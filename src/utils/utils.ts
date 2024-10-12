import 'dotenv/config';
import jwt from 'jsonwebtoken';
import { users } from '@prisma/client';
import crypto from "crypto";
import bcrypt from 'bcryptjs';

export const generateTokens = (user: users) => {
    if (!process.env.ACCESS_TOKEN_SECRET || ! process.env.REFRESH_TOKEN_SECRET) {
        throw new Error('Access token secret or refresh token secret is not defined in .env file.');
    }
    const accessToken = jwt.sign({ id: user.id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' }); // Access token expires in 15 minutes
    const refreshToken = jwt.sign({ id: user.id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' }); // Refresh token expires in 7 days
    return { accessToken, refreshToken };
};

export const generateVerificationCode = () => {
    // Generates a 6-digit random number
    const code = crypto.randomInt(100000, 999999);
    return code.toString();
};

export const hashPassword = async (password: string) => {
    return await bcrypt.hash(password, 10);
};