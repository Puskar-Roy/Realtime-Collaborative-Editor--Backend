import { Request } from 'express';
export interface iRequestWithToken extends Request {
  user: {
    accessToken: string;
    refreshToken: string;
  };
}
