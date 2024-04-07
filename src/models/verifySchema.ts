import { Schema, model } from 'mongoose';
import { VerificationToken } from '../interfaces/verifyInterface';

const verificationTokenSchema = new Schema<VerificationToken>({
  _id: String,
  token: { type: String, unique: true },
  userId: String,
  user: { type: Schema.Types.ObjectId, ref: 'EditorUser' },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: Date.now() + 600000 },
});

const VerifyModel = model<VerificationToken>(
  'VerificationToken',
  verificationTokenSchema
);

export default VerifyModel;
