import GoogleStrategy from 'passport-google-oauth20';
import passport from 'passport';
import { v4 as uuidv4 } from 'uuid';

import UserModel from '../../models/userSchema';

import { User } from '../../interfaces/userInterface';
import VerifyModel from '../../models/verifySchema';


var isInvalid = false;

interface iAuthUser extends User{
  accessToken?: string;
  refreshToken?: string;
}

async function createToken(user: iAuthUser) {
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

const addToken = async (token: unknown, user: iAuthUser) => {
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
      console.log('\n \n In the GoogleStrategy callback function \n \n');
      console.log("Tokens are: \n");
      console.log('accessToken', accessToken, "\n refreshToken", refreshToken);
      try {
        let user: iAuthUser = await UserModel.findOne({ email: profile.emails[0].value });
        if (user) {
          return callback(null, {...user, accessToken, refreshToken });
        }

        user = await UserModel.create({
          name: profile.displayName,
          email: profile.emails[0].value,
          password: profile.id,
          profilePic: profile.photos[0].value,
        }) ;

        await createToken(user);

        console.log('user', user);
        if (isInvalid) return callback(null, null);
        return callback(null, {...user, accessToken, refreshToken });
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

export default passport;
