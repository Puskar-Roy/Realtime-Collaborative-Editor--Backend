import { Document } from 'mongoose';
import { User } from './userInterface';
export interface VerificationToken extends Document {
  _id: string;
  token: string;
  userId: string; // User ID
  createdAt: Date;
  expiresAt: Date;
  user: User;
}
