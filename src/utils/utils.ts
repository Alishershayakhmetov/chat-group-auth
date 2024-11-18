import 'dotenv/config';
import jwt, { JwtPayload } from 'jsonwebtoken';
import crypto from "crypto";
import bcrypt from 'bcryptjs';

export const generateAccessToken = (userId: string) => {
    const accessToken = jwt.sign({ id: userId, token: "ACCESS" }, process.env.ACCESS_TOKEN_SECRET!, { expiresIn: '15m' }); // Access token expires in 15 minutes
    return accessToken;
}

export const generateRefreshToken = (userId: string) => {
    const refreshToken = jwt.sign({ id: userId, token: "REFRESH" }, process.env.REFRESH_TOKEN_SECRET!, { expiresIn: '90d' }); // refresh token expires in 7 days
    return refreshToken;
}

export const generateVerificationCode = () => {
    // Generates a 6-digit random number
    const code = crypto.randomInt(100000, 999999);
    return code.toString();
};

export const verifyRefreshToken = (token: string): JwtPayload | null => {
    try {
      return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET!) as JwtPayload;
    } catch (error) {
      return null;
    }
};

export const hashPassword = async (password: string) => {
    return await bcrypt.hash(password, 10);
};