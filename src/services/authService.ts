import 'dotenv/config';
import jwt from 'jsonwebtoken';
import { prismaService } from '../prismaClient.js';
import {Request, Response} from 'express';
import { v4 as uuidv4 } from 'uuid';
import redisClient from '../redisClient.js';
import { generateVerificationCode, hashPassword } from '../utils/utils.js';
import { RegisterData, UserPayload } from '../interfaces/interface.js';
import { emailClient } from '../emailClient.js';


class AuthService {
  // Function to register a new user
  async registerUser(data: RegisterData) {
    const { email, hashedPassword, name, lastName } = data;

    // Check if user already exists
    const existingUser = await prismaService.getClient().users.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Create the new user
    const newUser = await prismaService.getClient().users.create({
      data: {
        email,
        password: hashedPassword,
        name,
        lastName,
      },
    });

    // Return the new user data without the password
    const { password: _, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }

  // Function to handle Google authentication response
  async handleGoogleAuth(userProfile: any) {
    // Find or create the user
    let user = await prismaService.getClient().users.findUnique({
      where: { email: userProfile.email },
    });

    if (!user) {
      user = await prismaService.getClient().users.create({
        data: {
          email: userProfile.email,
          name: userProfile.firstName,
          lastName: userProfile.lastName,
        },
      });
    }

    // Generate JWT
    const userPayload: UserPayload = { id: user.id, email: user.email };
    const token = jwt.sign(userPayload, process.env.JWT_SECRET!, { expiresIn: '15m' });

    return {
      user,
      token,
    };
  }

  async handleTempRegisterUser(req: Request, res: Response) {
    const { email, hashedPassword: password, name, lastName } : RegisterData = req.body;
    if (!email || !password || !name || !lastName) {
      return res.status(400).json({ message: 'Email, password, name, and full name are required' });
    }

    // Generate a unique verification code
    const uniqueIdentifier = uuidv4();
    const verificationCode = generateVerificationCode();

    // Store the temporary user in Redis with an expiration time of 5 minutes
    const hashedPassword = hashPassword(password);
    await redisClient.set(email, JSON.stringify({email, hashedPassword, name, lastName, verificationCode, uniqueIdentifier}), {'EX': 300});
    await redisClient.set(uniqueIdentifier, JSON.stringify({email, hashedPassword, name, lastName, verificationCode, uniqueIdentifier}), {'EX': 300});

    // Create the verification URL
    const verificationUrl = `${process.env.BASE_URL}/verify-email/${uniqueIdentifier}`;

    // Send the verification code to the user's email
    try {
      await emailClient.sendMail({
        from: `"Your App" <${process.env.EMAIL_FROM}>`,
        to: email,
        subject: 'Email Verification',
        text: `Please verify your email by clicking the following link: ${verificationUrl}`,
        html: `<p>Please verify your email by clicking the following link: <a href="${verificationUrl}">${verificationUrl}</a></p>`,
      });

      res.status(200).json({ message: 'Verification email sent', verificationUrl });
    } catch (error) {
      console.error('Error sending email:', error);
      res.status(500).json({ message: 'Failed to send verification email' });
    }
  }

  async createUserOnDB(tempUser: RegisterData, res: Response) {
    // Move the user to the actual database
    try {
      const registeredUser = await this.registerUser({
        email: tempUser.email,
        hashedPassword: tempUser.hashedPassword,
        name: tempUser.name,
        lastName: tempUser.lastName,
      });
  
      res.status(200).json({ message: 'Email verified successfully', user: registeredUser });
    } catch (error) {
      console.error('Error registering user:', error);
      res.status(500).json({ message: 'Internal server error' });
    } 
  }

  async handleVerifyUserByURL(req: Request, res: Response) {
    const { code } = req.params;

    // Retrieve the temporary user from Redis
    const tempUserJson = await redisClient.get(code);
    if (!tempUserJson) {
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }
  
    const tempUser = JSON.parse(tempUserJson);

    // Move the user to the actual database
    return this.createUserOnDB(tempUser, res);
  }

  async handleVerifyUserByCode(req: Request, res: Response) {
    const { email, code } = req.body;

    // Retrieve the temporary user from Redis
    const tempUserJson = await redisClient.get(email);
    if (!tempUserJson) {
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }
  
    const tempUser = JSON.parse(tempUserJson);
    if (tempUser.verificationCode !== code ) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }
    // Move the user to the actual database
    return this.createUserOnDB(tempUser, res);
  }
}

export const authService = new AuthService();
