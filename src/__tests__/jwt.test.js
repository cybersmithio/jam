const request = require('supertest');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const config = require('../config');

describe('JWT Generation Tests', () => {
  let app;
  let server;

  beforeEach(() => {
    // Clear require cache to get fresh instances
    jest.resetModules();
    const serverModule = require('../server');
    app = serverModule.app;
    server = serverModule.server;
  });

  afterEach((done) => {
    if (server) {
      server.close(() => {
        setTimeout(done, 100);
      });
    } else {
      done();
    }
  });

  test('JWT utility should generate valid token for user', () => {
    // Test the JWT utility function directly with MongoDB-like user object
    const mockUser = {
      _id: new mongoose.Types.ObjectId(),
      email: 'test@example.com',
      name: 'Test User'
    };

    const jwtUtils = require('../utils/jwt');
    const token = jwtUtils.generateToken(mockUser);

    expect(token).toBeDefined();
    expect(typeof token).toBe('string');

    // Verify the token is valid
    const decoded = jwt.verify(token, config.jwt.secret);
    expect(decoded.userId).toBe(mockUser._id.toString());
    expect(decoded.sub).toBe(mockUser._id.toString());
    expect(decoded.email).toBe(mockUser.email);
    expect(decoded.name).toBe(mockUser.name);
  });

  test('JWT should contain user information in payload', async () => {
    const mockUser = {
      _id: new mongoose.Types.ObjectId(),
      email: 'test@example.com',
      name: 'Test User'
    };

    const jwtUtils = require('../utils/jwt');
    const token = jwtUtils.generateToken(mockUser);

    expect(token).toBeDefined();
    expect(typeof token).toBe('string');

    // Decode and verify the token
    const decoded = jwt.verify(token, config.jwt.secret);
    expect(decoded.userId).toBe(mockUser._id.toString());
    expect(decoded.email).toBe(mockUser.email);
    expect(decoded.name).toBe(mockUser.name);
  });

  test('JWT should have expiration time', async () => {
    const mockUser = {
      _id: new mongoose.Types.ObjectId(),
      email: 'test@example.com',
      name: 'Test User'
    };

    const jwtUtils = require('../utils/jwt');
    const token = jwtUtils.generateToken(mockUser);

    const decoded = jwt.verify(token, config.jwt.secret);
    expect(decoded.exp).toBeDefined();
    expect(decoded.iat).toBeDefined();
    expect(decoded.exp).toBeGreaterThan(decoded.iat);
  });

  test('JWT should be signed with configured secret', async () => {
    const mockUser = {
      _id: new mongoose.Types.ObjectId(),
      email: 'test@example.com',
      name: 'Test User'
    };

    const jwtUtils = require('../utils/jwt');
    const token = jwtUtils.generateToken(mockUser);

    // Should verify with correct secret
    expect(() => {
      jwt.verify(token, config.jwt.secret);
    }).not.toThrow();

    // Should fail with wrong secret
    expect(() => {
      jwt.verify(token, 'wrong-secret');
    }).toThrow();
  });

  test('should return 401 when requesting token without authentication', async () => {
    const response = await request(app)
      .get('/api/token');

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error');
  });

  test('JWT should include subject (sub) claim with user ID', async () => {
    const mockUser = {
      _id: new mongoose.Types.ObjectId(),
      email: 'test@example.com',
      name: 'Test User'
    };

    const jwtUtils = require('../utils/jwt');
    const token = jwtUtils.generateToken(mockUser);

    const decoded = jwt.verify(token, config.jwt.secret);
    expect(decoded.sub).toBe(mockUser._id.toString());
  });

  test('JWT should include issuer (iss) claim', async () => {
    const mockUser = {
      _id: new mongoose.Types.ObjectId(),
      email: 'test@example.com',
      name: 'Test User'
    };

    const jwtUtils = require('../utils/jwt');
    const token = jwtUtils.generateToken(mockUser);

    const decoded = jwt.verify(token, config.jwt.secret);
    expect(decoded.iss).toBeDefined();
    expect(decoded.iss).toBe('jam-auth-service');
  });
});
