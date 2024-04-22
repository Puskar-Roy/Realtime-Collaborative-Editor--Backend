import express, { Router } from 'express';
import passport from 'passport';

import config from '../config/config';
import {
  login,
  register,
  verifyEmail,
  forgotPassword,
  verifyResetToken,
} from '../controllers/authController';
const router: Router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.get('/verify-email/:id', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', verifyResetToken);

router.get(
  '/google/callback',
  passport.authenticate('google', {
    successRedirect: config.CLIENT_URL,
    failureRedirect: '/api/v0.1/auth/register',
  })
);

router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/logout', (req, res) => {
  // @ts-ignore
  req.logout();
  res.redirect(config.CLIENT_URL);
});

export default router;
