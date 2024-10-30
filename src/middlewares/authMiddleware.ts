import 'dotenv/config';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { CustomRequest, User } from '../interfaces/interface.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/utils.js';

export const jwtMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const { accessToken, refreshToken } = req.cookies;

  const handleDecodedUser = (decoded: any) => {
    (req as CustomRequest).user = decoded as User;
    next();
  };

  const setNewTokens = (userId: string) => {
    const newAccessToken = generateAccessToken(userId);
    const newRefreshToken = generateRefreshToken(userId);

    res.cookie("accessToken", newAccessToken, { httpOnly: true, maxAge: 15 * 60 * 1000 });
    res.cookie("refreshToken", newRefreshToken, { httpOnly: true, maxAge: 90 * 24 * 60 * 60 * 1000 });

    jwt.verify(newAccessToken, process.env.ACCESS_TOKEN_SECRET!, (err, decoded) =>
      err ? res.status(401).json({ message: 'Token is not valid or expired' }) : handleDecodedUser(decoded)
    );
  };

  if (!accessToken) {
    const decodedRefreshToken = verifyRefreshToken(refreshToken);
    return decodedRefreshToken
      ? setNewTokens(decodedRefreshToken.id)
      : res.status(401).json({ message: 'Unauthorized' });
  }

  jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET!, (err : any, decoded: any) =>
    err ? res.status(401).json({ message: 'Token is not valid or expired' }) : handleDecodedUser(decoded)
  );
};