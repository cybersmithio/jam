const express = require('express');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const cors = require('cors');
const config = require('./config');
const authRoutes = require('./routes/auth');

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
const server = app.listen(PORT, HOST, () => {
  console.log(`Server listening internally on http://${HOST}:${PORT}`);
  console.log(`Public URL: ${config.getPublicBaseUrl()}`);
  if (config.server.publicProtocol !== 'http' || config.server.publicPort !== PORT) {
    console.log('Note: Server is configured for proxy - OAuth callbacks will use public URL');
  }
});

// Export for testing
module.exports = { app, server };
