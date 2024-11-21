import 'dotenv/config';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import bcrypt from 'bcryptjs';
import { generateAccessToken, generateRefreshToken } from '../utils/utils.js';
import { prisma } from '../prismaClient.js';
// Local strategy
passport.use(
  new LocalStrategy(
    { usernameField: 'email' },
    async (email, password, done) => {
      try {
        // Find the user by email
        const user = await prisma.users.findUnique({
          where: { email },
        });

        if (!user) {
          return done(null, false, { message: 'Invalid credentials' });
        }

        // Check if the password matches
        if (user.password) {
          const isMatch = await bcrypt.compare(password, user.password);
          if (!isMatch) {
            return done(null, false, { message: 'Invalid credentials' });
          }
        }
        

        // Generate JWT tokens
        const accessToken = generateAccessToken(user.id);
        const refreshToken = generateRefreshToken(user.id);

        // Return the user and token
        return done(null, { user, accessToken, refreshToken });
      } catch (err) {
        return done(err);
      }
    }
  )
);

// Google strategy
passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: process.env.GOOGLE_CALLBACKURL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0].value;
          if (!email) {
            return done(null, false, { message: 'Email not provided by Google' });
          }
  
          // Check if the user already exists by email
          let user = await prisma.users.findUnique({
            where: { email },
          });
  
          if (!user) {
            // If the user does not exist, create a new user
            user = await prisma.users.create({
              data: {
                email,
                name: profile.name?.givenName,
                lastName: profile.name?.familyName,
                imgURL: profile.photos?.[0]?.value,
                googleId: profile.id, // Save Google ID for future reference
              },
            });
          } else if (!user.googleId) {
            // If the user exists but doesn't have a Google ID, update it
            user = await prisma.users.update({
              where: { email },
              data: { googleId: profile.id },
            });
          }
  
          // Generate JWT tokens
          const newAccessToken = generateAccessToken(user.id);
          const newRefreshToken = generateRefreshToken(user.id);
  
          // Return the user and token
          return done(null, { user, newAccessToken, newRefreshToken, });
        } catch (err) {
          return done(err);
        }
      }
    )
  );