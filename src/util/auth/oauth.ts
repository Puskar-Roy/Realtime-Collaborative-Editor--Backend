import GoogleStrategy from 'passport-google-oauth20';
import passport from 'passport';
import { v4 as uuidv4 } from 'uuid';

import UserModel from '../../models/userSchema';

import { User } from '../../interfaces/userInterface';
import VerifyModel from '../../models/verifySchema';

var isInvalid = false;

async function createToken(user: User) {
  try {
    const token = uuidv4();
    const tokenExpiresAt = new Date();
    tokenExpiresAt.setMinutes(tokenExpiresAt.getMinutes() + 10);
    const createdToken = await VerifyModel.create({
      token: token,
      userId: user._id,
      expiresAt: tokenExpiresAt,
    });
    console.log(createdToken);
    if (!user) throw new Error('User not found');
    console.log(user.email);
    addToken(createdToken, user);
  } catch (error) {
    console.log(error);
    isInvalid = true;
  }
}

const addToken = async (token: unknown, user: User) => {
  try {
    if (!token || typeof token !== 'string') throw new Error('Invalid token');

    const verificationToken = await VerifyModel.findOne({
      token: token,
      userId: user._id,
    });
    if (!verificationToken) throw new Error('Invalid token');
    if (verificationToken.expiresAt < new Date()) {
      await VerifyModel.deleteOne({ _id: verificationToken._id });
      throw Error('Token has expired');
    }
    await UserModel.updateOne(
      { _id: verificationToken.userId },
      { $set: { isVerified: true } }
    );
    await VerifyModel.deleteOne({ token });
  } catch (error) {
    console.log(error);
    isInvalid = true;
  }
};

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      scope: ['profile', 'email'],
    },
    async (accessToken, refreshToken, profile, callback) => {
      console.log("\n Google OAuth details",profile);
      try {
        // check if the user already user
        let user = await UserModel.findOne({ email: profile.emails[0].value });
        if (user) {
          return callback(null, user);
        }

        user = await UserModel.create({
          name: profile.displayName,
          email: profile.emails[0].value,
          password: profile.googleId, // This will act as a strong password
          profilePic: profile.photos[0].value,
        });      

        // create a token and send to the user
        await createToken(user);
        if (isInvalid) return callback(null, null);
        return callback(null, user);
      } catch (error) {
        callback(error, null);
      }
    }
  )
);

passport.serializeUser((user, callback) => {
  callback(null, user);
});

passport.deserializeUser((user, callback) => {
  callback(null, user);
});
function uuidv4() {
  throw new Error('Function not implemented.');
}

export default passport;
