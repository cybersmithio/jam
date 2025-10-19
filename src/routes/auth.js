const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const config = require('../config');

const router = express.Router();

/**
 * Configure Google OAuth Strategy
 * Uses config.buildPublicUrl() to construct callback URL with public protocol/host/port
 */
if (config.idProviders.google && config.idProviders.google.clientID) {
  const googleConfig = config.idProviders.google;

  // Build the full callback URL using public protocol, host, and port
  const callbackURL = config.buildPublicUrl(googleConfig.callbackPath || '/auth/google/callback');

  passport.use(new GoogleStrategy({
    clientID: googleConfig.clientID,
    clientSecret: googleConfig.clientSecret,
    callbackURL: callbackURL,
    scope: googleConfig.scope || ['profile', 'email']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // TODO: Implement user lookup/creation logic
      // For now, just pass the profile
      const user = {
        idpId: profile.id,
        provider: 'google',
        name: profile.displayName,
        email: profile.emails?.[0]?.value,
        profile: profile
      };

      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }));
}

/**
 * Configure Facebook OAuth Strategy
 * Uses config.buildPublicUrl() to construct callback URL with public protocol/host/port
 */
if (config.idProviders.facebook && config.idProviders.facebook.clientID) {
  const facebookConfig = config.idProviders.facebook;

  // Build the full callback URL using public protocol, host, and port
  const callbackURL = config.buildPublicUrl(facebookConfig.callbackPath || '/auth/facebook/callback');

  passport.use(new FacebookStrategy({
    clientID: facebookConfig.clientID,
    clientSecret: facebookConfig.clientSecret,
    callbackURL: callbackURL,
    profileFields: facebookConfig.profileFields || ['id', 'displayName', 'emails', 'name']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // TODO: Implement user lookup/creation logic
      // For now, just pass the profile
      const user = {
        idpId: profile.id,
        provider: 'facebook',
        name: profile.displayName,
        email: profile.emails?.[0]?.value,
        profile: profile
      };

      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }));
}

// Serialize/deserialize user for session management
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

/**
 * Google OAuth Routes
 */
router.get('/google',
  passport.authenticate('google', {
    scope: config.idProviders.google?.scope || ['profile', 'email']
  })
);

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Successful authentication, redirect to welcome page
    res.redirect('/welcome');
  }
);

/**
 * Facebook OAuth Routes
 */
router.get('/facebook',
  passport.authenticate('facebook', {
    scope: config.idProviders.facebook?.scope || ['public_profile', 'email']
  })
);

router.get('/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  (req, res) => {
    // Successful authentication, redirect to welcome page
    res.redirect('/welcome');
  }
);

/**
 * Get current user
 */
router.get('/user', (req, res) => {
  if (req.isAuthenticated()) {
    res.json(req.user);
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

/**
 * Logout
 */
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ success: true });
  });
});

module.exports = router;
