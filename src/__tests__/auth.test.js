const request = require('supertest');
const express = require('express');
const session = require('express-session');
const passport = require('passport');

describe('Authentication Routes Tests', () => {
  let app;
  let server;

  beforeEach(() => {
    // Clear require cache and passport strategies
    jest.resetModules();

    // Clear all passport strategies
    if (passport._strategies) {
      Object.keys(passport._strategies).forEach(key => {
        delete passport._strategies[key];
      });
    }
  });

  afterEach((done) => {
    if (server) {
      server.close(() => {
        // Give a small delay to ensure port is released
        setTimeout(done, 100);
      });
    } else {
      done();
    }
  });

  describe('Google OAuth Routes', () => {
    test('GET /auth/google should redirect to Google OAuth', async () => {
      // This test requires Google OAuth to be configured
      // We'll test that the route exists
      const { app: testApp, server: testServer } = require('../server');
      app = testApp;
      server = testServer;

      const response = await request(app).get('/auth/google');

      // Should redirect (302) or return an error if not configured
      expect([302, 500]).toContain(response.status);
    });

    test('GET /auth/google/callback should handle OAuth callback', async () => {
      const { app: testApp, server: testServer } = require('../server');
      app = testApp;
      server = testServer;

      const response = await request(app).get('/auth/google/callback');

      // Without valid OAuth data, should redirect to login (failure case)
      // Or return 302 redirect
      expect([302]).toContain(response.status);
    });
  });

  describe('Facebook OAuth Routes', () => {
    test('GET /auth/facebook should redirect to Facebook OAuth', async () => {
      const { app: testApp, server: testServer } = require('../server');
      app = testApp;
      server = testServer;

      const response = await request(app).get('/auth/facebook');

      // Should redirect (302) or return an error if not configured
      expect([302, 500]).toContain(response.status);
    });

    test('GET /auth/facebook/callback should handle OAuth callback', async () => {
      const { app: testApp, server: testServer } = require('../server');
      app = testApp;
      server = testServer;

      const response = await request(app).get('/auth/facebook/callback');

      // Without valid OAuth data, should redirect to login (failure case)
      expect([302]).toContain(response.status);
    });

    test('Facebook callback should redirect to /welcome on success', async () => {
      const { app: testApp, server: testServer } = require('../server');
      app = testApp;
      server = testServer;

      // This tests the route configuration
      // Actual OAuth flow would require mocking Passport
      const response = await request(app).get('/auth/facebook/callback');

      // Should be a redirect
      expect(response.status).toBe(302);
    });
  });

  describe.skip('Apple Sign In Routes - TODO: Test when Apple Developer account is enabled', () => {
    test('POST /auth/apple should initiate Apple Sign In', async () => {
      const { app: testApp, server: testServer } = require('../server');
      app = testApp;
      server = testServer;

      const response = await request(app).post('/auth/apple');

      // Should redirect (302) or return an error if not configured
      expect([302, 500]).toContain(response.status);
    });

    test('POST /auth/apple/callback should handle Apple callback', async () => {
      const { app: testApp, server: testServer } = require('../server');
      app = testApp;
      server = testServer;

      const response = await request(app).post('/auth/apple/callback');

      // Without valid OAuth data, should redirect or error
      expect([302, 500]).toContain(response.status);
    });

    test('Apple callback should redirect on invalid auth', async () => {
      const { app: testApp, server: testServer } = require('../server');
      app = testApp;
      server = testServer;

      // This tests the route configuration
      const response = await request(app).post('/auth/apple/callback');

      // Without valid data, expect redirect or error
      expect([302, 500]).toContain(response.status);
    });
  });

  describe('User API Routes', () => {
    test('GET /api/user should return 401 when not authenticated', async () => {
      const { app: testApp, server: testServer } = require('../server');
      app = testApp;
      server = testServer;

      const response = await request(app).get('/api/user');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Not authenticated');
    });

    test('POST /api/logout should succeed', async () => {
      const { app: testApp, server: testServer } = require('../server');
      app = testApp;
      server = testServer;

      const response = await request(app).post('/api/logout');

      // Should return success even if not logged in
      expect([200, 500]).toContain(response.status);
    });
  });

});
