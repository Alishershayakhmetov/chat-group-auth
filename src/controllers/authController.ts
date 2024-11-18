import { Router, Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { authService } from '../services/authService.js';
import { CustomRequest } from '../interfaces/interface.js';
import { prisma } from '../prismaClient.js';
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

    res.redirect(`${process.env.BASE_WEBAPP_URL}`);
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

authRouter.get('/auth/isAuth', async (req: Request, res: Response) => {
  const userId = (req as CustomRequest).user.id;
  try {
    const user = await prisma.users.findUnique({
      where: { id:userId }
    })
    if(!user) {
      res.status(404).json({ message: 'User not found' });
    }
    res.status(200).end();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
  }
)

authRouter.get("/isPrismaWorking", async (req: Request, res: Response) => {
  try {
    const result = await prisma.users.findMany();
    res.json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
})

export default authRouter;
