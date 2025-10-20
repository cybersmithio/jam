const request = require('supertest');
const path = require('path');
const fs = require('fs');

describe('Server Tests', () => {
  let app;
  let server;

  beforeEach(() => {
    // Clear require cache to get fresh server instance
    jest.resetModules();
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

  test('server should start and respond to health check', async () => {
    const { app: testApp, server: testServer } = require('../server');
    app = testApp;
    server = testServer;

    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
  });

  test('server should serve static files from frontend build directory', async () => {
    const { app: testApp, server: testServer } = require('../server');
    app = testApp;
    server = testServer;

    // This test will pass once frontend is built
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
  });

  test('server should handle 404 for unknown API routes', async () => {
    const { app: testApp, server: testServer } = require('../server');
    app = testApp;
    server = testServer;

    const response = await request(app).get('/api/nonexistent');
    expect(response.status).toBe(404);
  });
});
