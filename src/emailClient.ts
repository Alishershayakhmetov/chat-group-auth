import 'dotenv/config';
import nodemailer from 'nodemailer';

// Nodemailer configuration for sending emails
export const emailClient = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
});