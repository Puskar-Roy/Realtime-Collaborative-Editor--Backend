import express, { Express, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import xss from 'xss-clean';
import hpp from 'hpp';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import cors, { CorsOptions } from 'cors';
import config from './config/config';
import CheckError from './util/checkError';
import errorHandler from './middleware/errorMiddleware';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import { Server } from 'socket.io';
import http from 'http';

const app: Express = express();

// whitelist contains the allowed origins for CORS requests.
const whitelist = ['http://localhost:5173']; // It is used to check if a request's origin is allowed to access the server.

const corsOptions: CorsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
};
app.use(config.DEV_ENV === 'PROD' ? cors(corsOptions) : cors()); // Enable CORS based on the Production environment: allow specific request origins in production, allow all requests in Dev environments.
app.set('trust proxy', config.DEV_ENV === 'PROD' ? true : false); // Enable trust proxy on the Production environment
app.use(express.json());
app.use(helmet());
app.use(xss());
app.use(hpp());
app.use(mongoSanitize());
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 100,
});
app.use(limiter);
app.use((req, res, next) => {
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: `${config.FRONTENDURL}`,
    credentials: true,
    methods: ['GET', 'POST'],
  },
});

import './database/connectDb';

app.use('/api/v0.1/auth', authRoutes);
app.use('/api/v0.1/users', userRoutes);

app.get('/', (req: Request, res: Response) => {
  res.json({ success: true, message: 'API IS WORKING 🥳' });
});

app.all('*', (req: Request, res: Response, next: NextFunction) => {
  next(new CheckError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(errorHandler);
const userSocketMap = {};
const userPicMap = {};
const roomCodeMap = {};
const typingUsers = {};

const getAllClients = (roomId) => {
  return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
    (socketId) => {
      return {
        socketId,
        name: userSocketMap[socketId],
        pic: userPicMap[socketId],
      };
    }
  );
};

function getCodeForRoom(roomId) {
  return roomCodeMap[roomId] || '';
}

function setCodeForRoom(roomId, code) {
  roomCodeMap[roomId] = code;
}

io.on('connection', (socket) => {
  socket.on('join', ({ name, roomId, pic }) => {
    userSocketMap[socket.id] = name;
    userPicMap[socket.id] = pic;
    socket.join(roomId);
    const clients = getAllClients(roomId);
    clients.forEach(({ socketId }) => {
      io.to(socketId).emit('joined', {
        clients,
        name,
        socketId: socket.id,
      });
    });
    const code = getCodeForRoom(roomId);
    if (code) {
      socket.emit('existing-code', { code });
    }
  });

  socket.on('code-change', ({ roomId, code }) => {
    setCodeForRoom(roomId, code);
    socket.in(roomId).emit('code-change', { code });
  });

  socket.on('typing-start', ({ roomId, userId }) => {
    typingUsers[roomId] = typingUsers[roomId] || {};
    typingUsers[roomId][userId] = true;
    io.to(roomId).emit('typing-start', { userId });
  });

  socket.on('typing-stop', ({ roomId, userId }) => {
    if (typingUsers[roomId]) {
      typingUsers[roomId][userId] = false;
      io.to(roomId).emit('typing-stop', { userId });
    }
  });

  socket.on('disconnecting', () => {
    const rooms = [...socket.rooms];
    rooms.forEach((roomId) => {
      socket.leave(roomId);
      delete userSocketMap[socket.id];
      delete userPicMap[socket.id];
      const clients = getAllClients(roomId);
      clients.forEach(({ socketId }) => {
        io.to(socketId).emit('disconnected', {
          socketId: socket.id,
          name: userSocketMap[socket.id],
        });
      });
    });
  });
});
server.listen(config.PORT, () => {
  console.log(`[⚡] Server Is Running on ${config.BACKENDURL}`);
});

export default app;
