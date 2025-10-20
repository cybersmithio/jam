const fs = require('fs');
const path = require('path');

describe('Config Tests', () => {
  const originalConfigPath = path.join(__dirname, '..', '..', 'data', 'config.json');
  const testConfigPath = path.join(__dirname, '..', '..', 'data', 'config.test.json');
  let originalConfig;

  beforeAll(() => {
    // Save the original config
    if (fs.existsSync(originalConfigPath)) {
      originalConfig = fs.readFileSync(originalConfigPath, 'utf8');
    }
  });

  beforeEach(() => {
    // Clear require cache
    jest.resetModules();
  });

  afterEach(() => {
    // Clean up test config file
    if (fs.existsSync(testConfigPath)) {
      fs.unlinkSync(testConfigPath);
    }
  });

  afterAll(() => {
    // Restore the original config
    if (originalConfig) {
      fs.writeFileSync(originalConfigPath, originalConfig);
    }
  });

  test('buildPublicUrl should construct correct URLs with standard HTTP port', () => {
    const testConfig = {
      server: {
        port: 3000,
        host: 'localhost',
        publicProtocol: 'http',
        publicHost: 'example.com',
        publicPort: 80
      }
    };

    fs.writeFileSync(originalConfigPath, JSON.stringify(testConfig, null, 2));
    const config = require('../config');

    expect(config.buildPublicUrl('/auth/callback')).toBe('http://example.com/auth/callback');
  });

  test('buildPublicUrl should include port when not standard HTTP/HTTPS port', () => {
    const testConfig = {
      server: {
        port: 3000,
        host: 'localhost',
        publicProtocol: 'http',
        publicHost: 'example.com',
        publicPort: 8080
      }
    };

    fs.writeFileSync(originalConfigPath, JSON.stringify(testConfig, null, 2));
    jest.resetModules();
    const config = require('../config');

    expect(config.buildPublicUrl('/auth/callback')).toBe('http://example.com:8080/auth/callback');
  });

  test('buildPublicUrl should handle HTTPS with standard port 443', () => {
    const testConfig = {
      server: {
        port: 3000,
        host: 'localhost',
        publicProtocol: 'https',
        publicHost: 'example.com',
        publicPort: 443
      }
    };

    fs.writeFileSync(originalConfigPath, JSON.stringify(testConfig, null, 2));
    jest.resetModules();
    const config = require('../config');

    expect(config.buildPublicUrl('/auth/callback')).toBe('https://example.com/auth/callback');
  });

  test('buildPublicUrl should handle HTTPS with non-standard port', () => {
    const testConfig = {
      server: {
        port: 8080,
        host: '127.0.0.1',
        publicProtocol: 'https',
        publicHost: 'secure.example.com',
        publicPort: 8443
      }
    };

    fs.writeFileSync(originalConfigPath, JSON.stringify(testConfig, null, 2));
    jest.resetModules();
    const config = require('../config');

    expect(config.buildPublicUrl('/auth/google/callback')).toBe('https://secure.example.com:8443/auth/google/callback');
  });

  test('getPublicBaseUrl should return base URL without path', () => {
    const testConfig = {
      server: {
        port: 3000,
        host: 'localhost',
        publicProtocol: 'https',
        publicHost: 'api.example.com',
        publicPort: 443
      }
    };

    fs.writeFileSync(originalConfigPath, JSON.stringify(testConfig, null, 2));
    jest.resetModules();
    const config = require('../config');

    expect(config.getPublicBaseUrl()).toBe('https://api.example.com');
  });
});
