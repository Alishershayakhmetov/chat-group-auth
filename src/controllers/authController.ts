import { Router, Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { authService } from '../services/authService.js';

const authRouter = Router();

// Local login
authRouter.post('/login', (req: Request, res: Response, next: NextFunction) => { 
  passport.authenticate('local', { session: false }, (err: Error | null, userWithToken: any, info: { message: string } | undefined) => {
    if (err || !userWithToken) {
      return res.status(400).json({ message: info ? info.message : 'Login failed', user: userWithToken });
    }
    
    res.cookie("accessToken", userWithToken.accessToken, {httpOnly: true, maxAge: 1000 * 60 * 15})
    res.cookie("refreshToken", userWithToken.refreshToken, {httpOnly: true, maxAge: 1000 * 60 * 60 * 24 * 90})
    res.json({ user: userWithToken.user, accessToken: userWithToken.accessToken, refreshToken: userWithToken.refreshToken });
  })(req, res, next);
});

// Google authentication
authRouter.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

authRouter.get('/auth/google/callback', (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('google', { session: false }, (err: Error | null, userWithToken: any) => {
    if (err || !userWithToken) {
      return res.redirect('/login?error=auth_failed');
    }

    res.cookie("accessToken", userWithToken.newAccessToken, {httpOnly: true, maxAge: 1000 * 60 * 15})
    res.cookie("refreshToken", userWithToken.newRefreshToken, {httpOnly: true, maxAge: 1000 * 60 * 60 * 24 * 90})

    res.redirect(`/dashboard`);
  })(req, res, next);
});

// Register temporary user
authRouter.post('/register-temp', async (req: Request, res: Response) => {
  return authService.handleTempRegisterUser(req, res);
});

// Verify email through URL
authRouter.get('/verify-email', async (req: Request, res: Response) => {
  return authService.handleVerifyUserByURL(req, res);
});

// verify email through code
authRouter.post('/verify-email', async (req: Request, res: Response) => {
  return authService.handleVerifyUserByCode(req, res);
});

export default authRouter;
