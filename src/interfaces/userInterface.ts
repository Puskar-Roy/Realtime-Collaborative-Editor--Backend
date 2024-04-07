import { Document } from 'mongoose';
import { VerificationToken } from './verifyInterface';
export interface User extends Document {
  name: string;
  email: string;
  password: string;
  profilePic: string;
  verificationTokens: VerificationToken[];
  isVerified: boolean;
}
