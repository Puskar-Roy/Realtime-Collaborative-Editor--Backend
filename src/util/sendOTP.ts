import config from '../config/config';
import nodemailer from 'nodemailer';
import { generateOTP } from './generateOTP';
import UserModel from '../models/userSchema';
import VerifyModel from '../models/verifySchema';

export const sendOTPwithNodemailer = async (userId: string) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: config.EMAIL,
      pass: config.PASSWORD,
    },
  });

  try {
    const user = await UserModel.findById({ _id: userId });
    if (!user) throw new Error('User not found');
    const token = generateOTP();
    await VerifyModel.create({ token: token, userId: user._id });
    const mailOptions = {
      from: 'puskarroy300@gmail.com',
      to: user.email,
      subject: 'Reset Password OTP',
      html: ` <h2 style="font-family: Arial, sans-serif; line-height: 1.6;">Hey ${user.name} 👋,Verify Your OTP For Reset Your Password, This Is Your OTP - ${token}</h2>

  <h4 style="font-family: Arial, sans-serif; line-height: 1.6;">Please note that this link will expire in 10 minutes. If you did not request this verification, you can safely ignore this email.</h4>
  <h3 style="font-family: Arial, sans-serif; line-height: 1.6;">Thank you,<br>Puskar Roy - E learning Platform!</h3>`,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.log(error);
  }
};
