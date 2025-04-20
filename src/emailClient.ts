import nodemailer from 'nodemailer';
import config from './config/index.js';

// Nodemailer configuration for sending emails
export const emailClient = nodemailer.createTransport({
    host: config.EMAIL_HOST,
    port: Number(config.EMAIL_PORT),
    secure: false, // true for 465, false for other ports
    auth: {
      user: config.EMAIL_USER,
      pass: config.EMAIL_PASS,
    },
});