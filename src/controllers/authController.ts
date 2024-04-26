import { CookieOptions, Request, Response } from 'express';
import asyncHandler from '../util/catchAsync';
import UserModel from '../models/userSchema';
import VerifyModel from '../models/verifySchema';
import bcrypt from 'bcryptjs';
import validator from 'validator';
import { createToken } from '../util/utils';
import { sendEmailwithNodemailer } from '../util/sendEmail';
import { sendOTPwithNodemailer } from '../util/sendOTP';
import config from '../config/config';

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw Error('All fields must be filled');
  }
  try {
    const user = await UserModel.findOne({ email });
    if (!user) {
      throw Error('Email is not valid');
    }
    if (user.isVerified === false) {
      await sendEmailwithNodemailer(user._id);
      return res.status(400).json({
        message:
          'Email is not Verified, Verification email sent to your email!',
        success: false,
      });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      throw Error('Invalid credentials');
    }
    const token = createToken(user._id);
    res.status(200).json({
      message: 'Login successful!',
      success: true,
      token: token,
      email: user.email,
      id: user._id,
      name: user.name,
      pic: user.profilePic,
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export const register = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    console.log('fields are:', name, email, password);
    if (!name || !email || !password) {
      throw Error('All fields must be filled');
    }
    if (!validator.isEmail(email)) {
      throw Error('Email is not valid');
    }

    const exists = await UserModel.findOne({ email });
    if (exists) {
      throw Error('Email already in use');
    }
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    const user = await UserModel.create({ name, email, password: hash });
    await sendEmailwithNodemailer(user._id);
    return res.status(200).json({
      message: 'Verification email sent !',
      success: true,
    });
  } catch (error) {
    console.error('Registration error:', error.message);
    return res.status(500).json({ message: error.message, success: false });
  }
});

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.query;
  const { id } = req.params;
  if (!token || typeof token !== 'string')
    return res.status(400).send('Token not provided or invalid');
  try {
    const user = await UserModel.findById({ _id: id });
    if (!user) {
      throw Error('User Not Found!');
    }
    const verificationToken = await VerifyModel.findOne({
      token: token,
      userId: user._id,
    });
    if (!verificationToken) return res.status(404).send('Invalid token');
    if (verificationToken.expiresAt < new Date()) {
      await VerifyModel.deleteOne({ _id: verificationToken._id });
      throw Error('Token has expired');
    }
    await UserModel.updateOne(
      { _id: verificationToken.userId },
      { $set: { isVerified: true } }
    );
    await VerifyModel.deleteOne({ token });
    return res.status(200).send('Email verified successfully');
  } catch (error) {
    console.log(error);
    return res.status(400).send('Email verified Failed');
  }
});

export const forgotPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) {
      throw Error('Email is required');
    }
    try {
      const user = await UserModel.findOne({ email });
      if (!user) {
        throw Error('User not found');
      }
      await sendOTPwithNodemailer(user.id);
      return res
        .status(200)
        .json({ success: true, message: 'Token sent to your email' });
    } catch (error) {
      console.log(error);
      return res
        .status(400)
        .json({ success: false, message: 'Token sent Failed !' });
    }
  }
);

export const verifyResetToken = asyncHandler(
  async (req: Request, res: Response) => {
    const { email, token, newPassword } = req.body;
    if (!email || !token || !newPassword) {
      throw Error('Email, token, and new password are required');
    }
    try {
      const user = await UserModel.findOne({ email });
      if (!user) {
        throw Error('User not found');
      }

      const resetToken = await VerifyModel.findOne({
        token: token,
        userId: user._id,
      });

      if (resetToken.expiresAt < new Date()) {
        await VerifyModel.deleteOne({ _id: resetToken._id });
        throw Error('Token has expired');
      }

      if (!resetToken) {
        throw Error('Invalid or expired token');
      }
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(newPassword, salt);

      await UserModel.findByIdAndUpdate({ _id: user.id }, { password: hash });
      await VerifyModel.deleteOne({ id: resetToken.id });

      return res
        .status(200)
        .json({ success: true, message: 'Password reset successful' });
    } catch (error) {
      console.log(error);
      return res
        .status(400)
        .json({ success: false, message: 'Password reset failed' });
    }
  }
);

interface iOAuthRequest extends Request {
  user: {
    _doc: {
      _id: string;
      email: string;
      name: string;
      profilePic: string;
    };
    email: string;
    name: string;
    profilePic: string;
  };
}
export const sendOAuthVerifiedUser = asyncHandler(
  async (req: iOAuthRequest, res: Response) => {
    try {
      const id = req.params.userId;
      const user = await UserModel.findById({ _id: id });
      if (!user) {
        throw Error('User not found');
      }
      const token = createToken(user._id);

      res.status(200).json({
        message: 'Login successful!',
        success: true,
        token: token,
        email: user.email,
        id: user._id,
        name: user.name,
        pic: user.profilePic,
      });
    } catch (error) {
      console.log(error);
      return res.status(400).json({
        message: 'Login failed!',
        success: false,
      });
    }
  }
);

export const setGauthInCookie = asyncHandler(
  async (req: iOAuthRequest, res: Response) => {
    const user = req.user._doc;
    try {
      if (!user) {
        throw Error('User not found');
      }
      const token = createToken(user._id);
      const cookieOptions: CookieOptions = {
        httpOnly: false,
        expires: new Date(Date.now() + 1000 * 60 * 60 * 30),
        secure: config.DEV_ENV === 'PROD' ? true : false,
        sameSite: 'lax',
      };
      const cookieInfo = {
        message: 'Login successful!',
        success: true,
        token: token,
        email: user.email,
        id: user._id.toString(),
        name: user.name,
        pic: user.profilePic,
      };

      res.cookie('oauthToken', JSON.stringify(cookieInfo), cookieOptions);
      res.redirect(config.FRONTENDURL);
    } catch (error) {
      console.log(error);
      return res.status(400).json({
        message: 'Login failed!',
        success: false,
      });
    }
  }
);
