import express from 'express';
import passport from '../util/auth/oauth';
import config from '../config/config';

const router = express.Router();

router.get(
  '/google/callback',
  passport.authenticate('google', {
    successRedirect: config.CLIENT_URL,
    failureRedirect: '/api/v0.1/auth/register',
  })
);

router.get(
  '/google',
  (req, res, next) => {
    console.log('google auth hit');
    console.log("original url: ", req.originalUrl);
    next();
  },
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/logout', (req, res) => {
  // @ts-ignore
  req.logout();
  res.redirect(config.CLIENT_URL);
});

export default router;