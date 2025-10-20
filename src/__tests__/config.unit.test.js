// Unit tests for config module - no server required
describe('Config Module Unit Tests', () => {
  test('config module should load successfully', () => {
    const config = require('../config');
    expect(config).toBeDefined();
    expect(typeof config).toBe('object');
  });

  test('buildPublicUrl should generate correct Facebook callback URL', () => {
    const config = require('../config');
    const callbackUrl = config.buildPublicUrl('/auth/facebook/callback');

    expect(callbackUrl).toBeDefined();
    expect(typeof callbackUrl).toBe('string');
    expect(callbackUrl).toContain('/auth/facebook/callback');
    expect(callbackUrl).toMatch(/^https?:\/\//);
  });

  test('buildPublicUrl should generate correct Apple callback URL', () => {
    const config = require('../config');
    const callbackUrl = config.buildPublicUrl('/auth/apple/callback');

    expect(callbackUrl).toBeDefined();
    expect(typeof callbackUrl).toBe('string');
    expect(callbackUrl).toContain('/auth/apple/callback');
    expect(callbackUrl).toMatch(/^https?:\/\//);
  });

  test('getPublicBaseUrl should return valid base URL', () => {
    const config = require('../config');
    const baseUrl = config.getPublicBaseUrl();

    expect(baseUrl).toBeDefined();
    expect(typeof baseUrl).toBe('string');
    expect(baseUrl).toMatch(/^https?:\/\//);
    expect(baseUrl).not.toContain('undefined');
  });

  test('config should have idProviders object', () => {
    const config = require('../config');

    expect(config.idProviders).toBeDefined();
    expect(typeof config.idProviders).toBe('object');
  });

  test('config server settings should have defaults', () => {
    const config = require('../config');

    expect(config.server).toBeDefined();
    expect(config.server.publicProtocol).toBeDefined();
    expect(config.server.publicHost).toBeDefined();
    expect(config.server.publicPort).toBeDefined();
  });
});
