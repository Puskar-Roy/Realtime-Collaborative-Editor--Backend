import cloudinary from 'cloudinary';
import { v4 as uuidv4 } from 'uuid';
import { Request as ExpressRequest, Response } from 'express';
import asyncHandler from '../util/catchAsync';
import dataUri from '../util/dataUri';
import UserModel from '../models/userSchema';

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface RequestWithFile extends ExpressRequest {
  file: unknown;
}

export const createProfilePic = asyncHandler(
  async (req: RequestWithFile, res: Response) => {
    const { userId } = req.params;
    const file = req.file;
    const fileUri = dataUri(file);

    try {
      const uploadCloud = await cloudinary.v2.uploader.upload(fileUri.content);
      console.log(uploadCloud);
      const existingProfile = await UserModel.findById({ _id: userId });
      if (!existingProfile) {
        throw new Error('User did not exist!');
      }
      await UserModel.updateOne({
        profilePic: uploadCloud.secure_url,
      });
      res.status(200).json({
        success: true,
        message: 'Profile Picture Uploded!',
        pic: uploadCloud.secure_url,
      });
    } catch (error) {
      console.error('Error updating profile pic in database:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);
