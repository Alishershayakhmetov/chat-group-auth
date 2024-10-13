import 'dotenv/config';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { CustomRequest, User } from '../interfaces/interface.js';


export const jwtMiddleware = (expressRequest: Request, res: Response, next: NextFunction) => {
  const token = expressRequest.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!, (err : any, decoded: any) => {
    if (err) {
      return res.status(401).json({ message: 'Token is not valid or expired' });
    }
    
    const req = expressRequest as CustomRequest;
    req.user = decoded as User; // Attach user information to the request
    next();
  });
};
