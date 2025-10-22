const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const AppleStrategy = require('passport-apple').Strategy;
const fs = require('fs');
const path = require('path');
const config = require('../config');
const userService = require('../services/userService');

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
      // Find or create user in database
      const idpProfile = {
        provider: 'google',
        providerId: profile.id,
        email: profile.emails?.[0]?.value,
        name: profile.displayName,
        profileData: {
          displayName: profile.displayName,
          picture: profile.photos?.[0]?.value,
          locale: profile._json.locale
        }
      };

      const user = await userService.findOrCreateUser(idpProfile);

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
      // Find or create user in database
      const idpProfile = {
        provider: 'facebook',
        providerId: profile.id,
        email: profile.emails?.[0]?.value,
        name: profile.displayName,
        profileData: {
          displayName: profile.displayName,
          firstName: profile.name?.givenName,
          lastName: profile.name?.familyName
        }
      };

      const user = await userService.findOrCreateUser(idpProfile);

      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }));
}

/**
 * Configure Apple Sign In Strategy
 * Uses config.buildPublicUrl() to construct callback URL with public protocol/host/port
 */
if (config.idProviders.apple && config.idProviders.apple.clientID) {
  const appleConfig = config.idProviders.apple;

  // Build the full callback URL using public protocol, host, and port
  const callbackURL = config.buildPublicUrl(appleConfig.callbackPath || '/auth/apple/callback');

  // Read the private key file
  let privateKey;
  try {
    const keyPath = path.resolve(appleConfig.privateKeyPath);
    privateKey = fs.readFileSync(keyPath, 'utf8');
  } catch (error) {
    console.error('Error reading Apple private key:', error.message);
    console.log('Apple Sign In will not be available');
  }

  if (privateKey) {
    console.log('=== Apple Strategy Configuration ===');
    console.log('Callback URL:', callbackURL);
    console.log('Client ID:', appleConfig.clientID);
    console.log('Team ID:', appleConfig.teamID);
    console.log('Key ID:', appleConfig.keyID);
    console.log('Scope:', appleConfig.scope || ['name', 'email']);
    console.log('===================================');

    passport.use(new AppleStrategy({
      clientID: appleConfig.clientID,
      teamID: appleConfig.teamID,
      keyID: appleConfig.keyID,
      privateKeyString: privateKey,
      callbackURL: callbackURL,
      scope: appleConfig.scope || ['name', 'email'],
      passReqToCallback: true
    },
    async (req, accessToken, refreshToken, idToken, profile, done) => {
      try {
        // Debug logging to see what Apple is sending
        console.log('=== Apple Sign In Callback ===');
        console.log('Profile object:', JSON.stringify(profile, null, 2));
        console.log('ID Token:', JSON.stringify(idToken, null, 2));
        console.log('req.appleUserData:', JSON.stringify(req.appleUserData, null, 2));
        console.log('============================');

        // Apple sends user data in req.body.user on first authorization only
        // After that, only the ID token contains the user's ID (sub)
        // We parsed this data in middleware and stored it in req.appleUserData

        // Extract email from multiple possible locations
        const email = profile.email || idToken.email || req.appleUserData?.email;

        // Extract name from req.appleUserData (first auth) or profile
        let firstName = req.appleUserData?.name?.firstName || profile.name?.firstName;
        let lastName = req.appleUserData?.name?.lastName || profile.name?.lastName;

        // Construct display name
        let displayName = '';
        if (firstName || lastName) {
          displayName = `${firstName || ''} ${lastName || ''}`.trim();
        } else {
          displayName = email; // Fallback to email if no name
        }

        const idpProfile = {
          provider: 'apple',
          providerId: profile.id || profile.sub || idToken.sub,
          email: email,
          name: displayName,
          profileData: {
            firstName: firstName,
            lastName: lastName
          }
        };

        console.log('Parsed idpProfile:', JSON.stringify(idpProfile, null, 2));

        const user = await userService.findOrCreateUser(idpProfile);

        return done(null, user);
      } catch (error) {
        console.error('Apple authentication error:', error);
        return done(error, null);
      }
    }));
  }
}

// Serialize/deserialize user for session management
passport.serializeUser((user, done) => {
  // Store only the user ID in the session
  done(null, user._id.toString());
});

passport.deserializeUser(async (id, done) => {
  try {
    // Retrieve full user from database
    const user = await userService.getUserById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
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
 * Apple Sign In Routes
 */
router.post('/apple',
  passport.authenticate('apple')
);

router.post('/apple/callback',
  (req, res, next) => {
    // Debug: Log raw request data from Apple
    console.log('=== Apple Callback Request ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Request query:', JSON.stringify(req.query, null, 2));
    console.log('req.body.user type:', typeof req.body.user);

    // Apple sends user data in req.body.user on first authorization only
    // Store parsed data in a separate property to avoid conflicts with passport-apple
    if (req.body.user && typeof req.body.user === 'string') {
      try {
        const userData = JSON.parse(req.body.user);
        console.log('Parsed Apple user data from string:', JSON.stringify(userData, null, 2));
        // Store in a custom property instead of overwriting req.body.user
        req.appleUserData = userData;
      } catch (error) {
        console.error('Error parsing Apple user data:', error);
      }
    } else if (req.body.user && typeof req.body.user === 'object') {
      // Already parsed by Express body parser
      console.log('Apple user data (already parsed):', JSON.stringify(req.body.user, null, 2));
      req.appleUserData = req.body.user;
    }

    console.log('============================');
    next();
  },
  passport.authenticate('apple', { failureRedirect: '/login' }),
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
