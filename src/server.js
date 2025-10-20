const express = require('express');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const cors = require('cors');
const config = require('./config');
const authRoutes = require('./routes/auth');
const jwtUtils = require('./utils/jwt');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: config.session.secret,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: config.server.publicProtocol === 'https' }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    publicBaseUrl: config.getPublicBaseUrl(),
    listeningOn: `http://${config.server.host}:${config.server.port}`
  });
});

// Authentication routes
app.use('/auth', authRoutes);

// API Routes
app.get('/api/user', (req, res) => {
  if (req.isAuthenticated()) {
    res.json(req.user);
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

app.post('/api/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ success: true });
  });
});

// JWT token endpoint - generate token for authenticated users
app.get('/api/token', (req, res) => {
  if (req.isAuthenticated()) {
    try {
      const token = jwtUtils.generateToken(req.user);
      res.json({ token });
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate token' });
    }
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

// API 404 handler
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Serve static files from React frontend build
const frontendBuildPath = path.join(__dirname, '..', 'frontend', 'build');
app.use(express.static(frontendBuildPath));

// Serve React app for all other routes (client-side routing)
app.get('*', (req, res) => {
  const indexPath = path.join(frontendBuildPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(500).send('Frontend not built. Run npm run build:frontend');
    }
  });
});

// Start server on internal port
const PORT = config.server.port || 3000;
const HOST = config.server.host || 'localhost';
let server;

// Create HTTPS server if enabled, otherwise use HTTP
if (config.server.https && config.server.https.enabled) {
  try {
    const httpsOptions = {
      key: fs.readFileSync(path.resolve(config.server.https.keyPath)),
      cert: fs.readFileSync(path.resolve(config.server.https.certPath))
    };

    server = https.createServer(httpsOptions, app);
    server.listen(PORT, HOST, () => {
      console.log(`Server listening internally on https://${HOST}:${PORT}`);
      console.log(`Public URL: ${config.getPublicBaseUrl()}`);
      if (config.server.publicProtocol !== 'https' || config.server.publicPort !== PORT) {
        console.log('Note: Server is configured for proxy - OAuth callbacks will use public URL');
      }
    });
  } catch (error) {
    console.error('Error loading HTTPS certificates:', error.message);
    console.log('Falling back to HTTP');
    server = http.createServer(app);
    server.listen(PORT, HOST, () => {
      console.log(`Server listening internally on http://${HOST}:${PORT}`);
      console.log(`Public URL: ${config.getPublicBaseUrl()}`);
    });
  }
} else {
  server = http.createServer(app);
  server.listen(PORT, HOST, () => {
    console.log(`Server listening internally on http://${HOST}:${PORT}`);
    console.log(`Public URL: ${config.getPublicBaseUrl()}`);
    if (config.server.publicProtocol !== 'http' || config.server.publicPort !== PORT) {
      console.log('Note: Server is configured for proxy - OAuth callbacks will use public URL');
    }
  });
}

// Export for testing
module.exports = { app, server };
