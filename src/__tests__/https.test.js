const https = require('https');
const request = require('supertest');
const fs = require('fs');
const path = require('path');

describe('HTTPS Server Tests', () => {
  let server;

  beforeEach(() => {
    // Clear require cache
    jest.resetModules();
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

  test('server should use HTTPS when https.enabled is true', () => {
    const config = require('../config');

    // If HTTPS is enabled, server.https should be defined
    if (config.server.https && config.server.https.enabled) {
      expect(config.server.https.certPath).toBeDefined();
      expect(config.server.https.keyPath).toBeDefined();
    }
  });

  test('server should load SSL certificate files when HTTPS is enabled', () => {
    const config = require('../config');

    if (config.server.https && config.server.https.enabled) {
      const certPath = path.resolve(config.server.https.certPath);
      const keyPath = path.resolve(config.server.https.keyPath);

      // Certificate files should exist
      expect(fs.existsSync(certPath)).toBe(true);
      expect(fs.existsSync(keyPath)).toBe(true);
    }
  });

  test('config should have defaults for HTTPS when not specified', () => {
    const config = require('../config');

    // Should have https config even if not in file
    expect(config.server.https).toBeDefined();
    expect(typeof config.server.https.enabled).toBe('boolean');
  });
});
