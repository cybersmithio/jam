# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an authentication microservice that integrates with public Identity Providers (Google, Apple, Facebook) to authenticate users and issue JWTs for other microservices.

**Technology Stack:**
- Backend: Node.js with Express
- Frontend: React.js (demonstration purposes)
- Database: MongoDB
- Containerization: Docker

## Development Methodology

**Test-Driven Development (TDD) is mandatory:**
- Write tests first and ensure they fail before implementing features
- All code must have corresponding tests
- Tests should be run and pass before considering any feature complete

**Test Best Practices:**
- **NEVER permanently modify configuration files during tests**
- If a test needs to modify `config.json` or any other configuration file:
  1. Save the original file content in `beforeAll()` hook
  2. Restore the original content in `afterAll()` hook
  3. See `src/__tests__/config.test.js` for the correct pattern
- Tests must clean up after themselves (close servers, release ports, delete temp files)
- Use `--runInBand` flag when running tests to avoid port conflicts: `npm test -- --runInBand`

## Architecture Overview

**Three-Tier Architecture:**

1. **Frontend (Demonstration)**
   - React.js application served by the backend
   - Login page with IdP buttons
   - Welcome page displaying authenticated user information

2. **Backend Service**
   - Express/Node.js REST API
   - Handles OAuth/OIDC flows with external IdPs
   - User account management and matching across IdPs
   - JWT generation and signing
   - Serves frontend static files

3. **Database Layer**
   - MongoDB for user account storage
   - Stores mappings between IdP identifiers and application user accounts

## Key Functional Requirements

**IdP Integration:**
- Accept credentials from Google, Apple, Facebook (extensible to other IdPs)
- Configuration-driven IdP setup
- Use unique IdP identifiers (not emails) for primary user matching
- Support users logging in with different IdPs and matching to existing accounts

**User Account Management:**
- Automatically create user accounts on first login
- Match users across different IdPs
- Request and store email addresses from IdPs for communication

**JWT Authentication:**
- Generate signed JWTs containing user application credentials
- Configurable expiration times
- Use proper signing key and certificate management

## Configuration

The backend uses `data/config.json` (create from `data/config.example.json`) containing:
- IdP client credentials and endpoints
- JWT signing configuration and expiration settings
- Database connection settings
- Server settings (internal and public URLs)
- HTTPS/TLS certificate paths

**Important:**
- `data/config.json` is gitignored - always use `data/config.example.json` as the template.
- The server supports running behind a proxy with separate internal/external configurations.
- SSL certificates are stored in `data/certsAndKeys/` (also gitignored)

### Public URL Generation

All absolute URLs (OAuth callbacks, etc.) must use `config.buildPublicUrl(path)` to construct URLs with the public protocol/host/port:

```javascript
// CORRECT - Uses public URL
const callbackURL = config.buildPublicUrl('/auth/google/callback');

// WRONG - Hardcoded URL won't work behind proxy
const callbackURL = 'http://localhost:3000/auth/google/callback';
```

The server listens on `config.server.port` and `config.server.host` but generates public URLs using `config.server.publicProtocol`, `config.server.publicHost`, and `config.server.publicPort`. This allows the server to run on HTTP:3000 internally while being accessed via HTTPS:443 publicly.

## Project Structure

- `src/` - Backend Express server code
  - `src/server.js` - Main server entry point (serves frontend + API)
  - `src/config.js` - Configuration loader
  - `src/__tests__/` - Backend tests (Jest + Supertest)
- `frontend/` - React application
  - `frontend/src/components/Login.js` - Login page with IdP buttons
  - `frontend/src/components/Welcome.js` - Welcome page showing authenticated user
  - `frontend/build/` - Production build (served by backend)

## Development Commands

**Setup:**
- `npm install` - Install all dependencies (backend + frontend)
- `cp data/config.example.json data/config.json` - Create config file
- `npm run build:frontend` - Build React frontend for production

**Development:**
- `npm run dev` - Start backend with auto-reload (nodemon)
- `cd frontend && npm start` - Start frontend dev server with hot-reload
- `npm test` - Run backend tests (TDD requirement)
- `npm run test:watch` - Run tests in watch mode

**Production:**
- `npm start` - Start production server (serves built frontend)
