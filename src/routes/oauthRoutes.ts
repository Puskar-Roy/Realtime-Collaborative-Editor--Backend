import express,{NextFunction, Request, Response} from 'express';

import passport from '../util/auth/oauth';
import config from '../config/config';
import {  sendOAuthVerifiedUser, setGauthInCookie } from '../controllers/authController';
import asyncHandler from '../util/catchAsync';

const router = express.Router();
interface iRequestWithToken extends express.Request {
  user: {
    accessToken: string;
    refreshToken: string;
  };
}

const tempCheckOAuthUserRoute = asyncHandler(
  async (req: Request, res: Response, next:NextFunction) => {
    // @ts-ignore
    const userParam = req.params.userId;
    console.log('req.user in tempCheckOAuthUserRoute is ', userParam);
    res.status(200).json({
      message: 'tempCheckOAuthUserRoute hit',
      success: true,
    });
    next();
  }
);
router.get('/user/:userId',tempCheckOAuthUserRoute, sendOAuthVerifiedUser);

router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${config.FRONTENDURL}/`,
    // successRedirect: config.CLIENT_URL+"/success_auth",
    // failureRedirect: '/api/v0.1/auth/register',
  }),
  setGauthInCookie
);

// This is a temporary callback middleware for debug purpose for the /google/callback route
const temp_callback_middleware = (req: iRequestWithToken, res) => {
  try {
    console.log('google auth callback hit');
    console.log('req.user: ', req.user);

    // @ts-ignore
    console.log('tokens are', req.user.accessToken, req.user.refreshToken);

    // Let's send this accessToken to the frontend.
    res.cookie('accessToken', req.user.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    });
    res.redirect('/success_auth');
  } catch (error) {
    console.log(error);
    res.redirect('/failure_auth');
  }
};

router.get(
  '/google',
  (req, res, next) => {
    console.log('google auth hit');
    console.log('original url: ', req.originalUrl);
    next();
  },
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/logout', (req, res) => {
  // @ts-ignore
  req.logout();
  res.redirect(config.CLIENT_URL);
});

export default router;
