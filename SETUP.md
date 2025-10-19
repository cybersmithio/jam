# Setup and Development Guide

## Initial Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```
   This will automatically install both backend and frontend dependencies.

2. **Configure the Application**
   ```bash
   cp config.example.json config.json
   ```
   Edit `config.json` with your:
   - MongoDB connection string
   - JWT secret key
   - Session secret
   - IdP credentials (Google, etc.)

3. **Build the Frontend**
   ```bash
   npm run build:frontend
   ```

## Development

### Running in Development Mode

**Option 1: Run Backend and Frontend Separately**
```bash
# Terminal 1 - Backend (with auto-reload)
npm run dev

# Terminal 2 - Frontend (with hot-reload)
cd frontend
npm start
```
The frontend dev server will proxy API requests to the backend at http://localhost:3000.

**Option 2: Run Production Mode Locally**
```bash
# Build frontend first
npm run build:frontend

# Start backend (serves built frontend)
npm start
```

### Running Tests

```bash
# Run all backend tests
npm test

# Run tests in watch mode
npm run test:watch

# Run frontend tests
cd frontend
npm test
```

## Project Structure

```
jam/
├── src/                    # Backend source code
│   ├── server.js          # Express server entry point
│   ├── config.js          # Configuration loader
│   └── __tests__/         # Backend tests
├── frontend/              # React frontend
│   ├── src/
│   │   ├── components/   # React components
│   │   │   ├── Login.js  # Login page with IdP buttons
│   │   │   └── Welcome.js # Welcome page showing user info
│   │   ├── App.js        # Main app with routing
│   │   └── index.js      # React entry point
│   └── public/           # Static assets
├── config.json           # Application configuration (gitignored)
├── config.example.json   # Example configuration
└── package.json          # Dependencies and scripts
```

## Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with auto-reload
- `npm test` - Run backend tests
- `npm run test:watch` - Run tests in watch mode
- `npm run build:frontend` - Build React frontend for production
- `npm run install:frontend` - Install frontend dependencies

## Configuration

The application uses `config.json` for all configuration. Key sections:

- **server**: Port and host settings
  - `port`: Internal port the server listens on (e.g., 3000)
  - `host`: Internal host the server binds to (e.g., 'localhost', '0.0.0.0')
  - `publicProtocol`: Public-facing protocol (e.g., 'http', 'https')
  - `publicHost`: Public-facing hostname (e.g., 'auth.example.com')
  - `publicPort`: Public-facing port (e.g., 443, 80, 8080)
- **database**: MongoDB connection URI
- **jwt**: Secret key and token expiration
- **session**: Session secret for Express sessions
- **idProviders**: OAuth credentials for each IdP
  - `callbackPath`: Relative path for OAuth callback (e.g., '/auth/google/callback')
  - Note: Full callback URLs are automatically constructed using public protocol/host/port

### Proxy Configuration

When running behind a reverse proxy (nginx, Apache, load balancer), configure the server settings to use different internal and public values:

**Example: Server listening on HTTP port 3000, public access via HTTPS port 443**
```json
{
  "server": {
    "port": 3000,
    "host": "0.0.0.0",
    "publicProtocol": "https",
    "publicHost": "auth.example.com",
    "publicPort": 443
  }
}
```

The server will:
- Listen internally on `http://0.0.0.0:3000`
- Generate OAuth callback URLs as `https://auth.example.com/auth/google/callback`
- Use secure cookies when `publicProtocol` is 'https'

**Example: Server behind proxy on custom port**
```json
{
  "server": {
    "port": 8080,
    "host": "127.0.0.1",
    "publicProtocol": "https",
    "publicHost": "myapp.com",
    "publicPort": 8443
  }
}
```

OAuth callbacks will use: `https://myapp.com:8443/auth/google/callback`

## How Public URLs Work

The application automatically constructs public URLs for OAuth callbacks and other absolute URLs using `config.buildPublicUrl(path)`:

```javascript
// In src/routes/auth.js
const callbackURL = config.buildPublicUrl('/auth/google/callback');
// Result: https://auth.example.com/auth/google/callback
```

This ensures that:
- OAuth providers redirect to the correct public URL
- The server listens on the internal port/protocol
- Standard ports (80, 443) are omitted from URLs automatically

## Next Steps

To complete the authentication flow:
1. Set up MongoDB and update the database URI in config.json
2. Create database models for user accounts
3. Implement JWT generation and validation
4. Add user matching logic across different IdPs
