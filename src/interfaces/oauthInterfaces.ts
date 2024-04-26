import { Request } from 'express';
import { User } from './userInterface';
export interface iRequestWithToken extends Request {
  user: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface iOAuthRequest extends Request {
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

export interface iAuthUser extends User{
    accessToken?: string;
    refreshToken?: string;
  }
  