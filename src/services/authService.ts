import 'dotenv/config';
import jwt from 'jsonwebtoken';
import {Request, Response} from 'express';
import { v4 as uuidv4 } from 'uuid';
import redisClient from '../redisClient.js';
import { generateAccessToken, generateRefreshToken, generateVerificationCode, hashPassword, verifyRefreshToken } from '../utils/utils.js';
import { RegisterData, TempRegisterData, UserPayload } from '../interfaces/interface.js';
import { Kafka } from "kafkajs";
import { prisma } from '../prismaClient.js';

const kafka = new Kafka({
  clientId: "producer-service",
  brokers: ['localhost:9092']
});

const producer = kafka.producer();

const sendMessage = async (message: any) => {
  await producer.connect();
  await producer.send({
    topic: 'my_first_topic',
    messages: [{ value: JSON.stringify(message) }],
  });
  await producer.disconnect();
};

class AuthService {
  // Function to register a new user
  async registerUser(data: RegisterData) {
    const { email, password, name, lastName } = data;

    // Check if user already exists
    const existingUser = await prisma.users.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Create the new user
    const newUser = await prisma.users.create({
      data: {
        email,
        password: password,
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
    let user = await prisma.users.findUnique({
      where: { email: userProfile.email },
    });

    if (!user) {
      user = await prisma.users.create({
        data: {
          email: userProfile.email,
          name: userProfile.firstName,
          lastName: userProfile.lastName,
        },
      });
    }

    // Generate JWT
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    return {
      user,
      accessToken,
      refreshToken
    };
  }

  async handleTempRegisterUser(req: Request, res: Response) {
    const { email, password, fullName} : TempRegisterData = req.body;
    if (!email || !password || !fullName) {
      return res.status(400).json({ message: 'Email, password, and full name are required' });
    }
    const [name, lastName] = fullName.split(" ");

    // Generate a unique verification code
    // IMPORTANT: CHECK IF THERE IS A USER AND WITH EXACT ID
    const isUserExist = await prisma.users.findUnique({
      where: { email },
    });
    if (isUserExist) {
      res.status(400).json({ message: 'User already exists' });
    }
    const uniqueIdentifier = uuidv4();
    const verificationCode = generateVerificationCode();

    // Store the temporary user in Redis with an expiration time of 5 minutes
    const hashedPassword = await hashPassword(password);
    await redisClient.set(email, JSON.stringify({email, password: hashedPassword, name, lastName, verificationCode, uniqueIdentifier}), {'EX': 300});
    await redisClient.set(uniqueIdentifier, JSON.stringify({email, password: hashedPassword, name, lastName, verificationCode, uniqueIdentifier}), {'EX': 300});

    // Create the verification URL
    const verificationUrl = `${process.env.BASE_URL}/verify/${uniqueIdentifier}`;

    // Send the verification code to the user's email
    try {
      /*
      await emailClient.sendMail({
        from: `"Your App" <${process.env.EMAIL_FROM}>`,
        to: email,
        subject: 'Email Verification',
        text: `Please verify your email by clicking the following link: ${verificationUrl}, or typing code on website. code: ${verificationCode}`,
        html: `<p>Please verify your email by clicking the following link: <a href="${verificationUrl}">${verificationUrl}</a>, or typing code on website. code: ${verificationCode}</p>`,
      });
      */
      sendMessage({ email: email, text: `Please verify your email by clicking the following link: ${verificationUrl}, or typing code on website. code: ${verificationCode}`, HTMLText: `<p>Please verify your email by clicking the following link: <a href="${verificationUrl}">${verificationUrl}</a>, or typing code on website. code: ${verificationCode}</p>`});

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
        password: tempUser.password,
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
    const { code } = req.body;

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
