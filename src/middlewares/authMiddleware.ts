import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const jwtMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  jwt.verify(token, 'your_jwt_secret', (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    req.user = decoded; // Attach user information to the request
    next();
  });
};
