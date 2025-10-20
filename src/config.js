const fs = require('fs');
const path = require('path');

/**
 * Load configuration from config.json file
 */
function loadConfig() {
  const configPath = path.join(__dirname, '..', 'data', 'config.json');

  try {
    const configFile = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configFile);

    // Set defaults for public URL if not specified
    if (!config.server.publicProtocol) {
      config.server.publicProtocol = 'http';
    }
    if (!config.server.publicHost) {
      config.server.publicHost = config.server.host || 'localhost';
    }
    if (!config.server.publicPort) {
      config.server.publicPort = config.server.port || 3000;
    }

    // Set defaults for HTTPS if not specified
    if (!config.server.https) {
      config.server.https = {
        enabled: false,
        certPath: './data/certsAndKeys/server-cert.pem',
        keyPath: './data/certsAndKeys/server-key.pem'
      };
    }

    return config;
  } catch (error) {
    console.error('Error loading config.json:', error.message);
    console.log('Using default configuration');

    // Return default configuration if file doesn't exist
    return {
      server: {
        port: 3000,
        host: 'localhost',
        publicProtocol: 'http',
        publicHost: 'localhost',
        publicPort: 3000,
        https: {
          enabled: false,
          certPath: './data/certsAndKeys/server-cert.pem',
          keyPath: './data/certsAndKeys/server-key.pem'
        }
      },
      database: {
        uri: 'mongodb://localhost:27017/jam-auth'
      },
      jwt: {
        secret: 'default-secret-change-this',
        expiration: '24h'
      },
      session: {
        secret: 'default-session-secret-change-this'
      },
      idProviders: {}
    };
  }
}

/**
 * Get the public base URL for this service
 * This is the URL that external users/services will use to access this server
 */
function getPublicBaseUrl() {
  const config = loadConfig();
  const { publicProtocol, publicHost, publicPort } = config.server;

  // Standard ports don't need to be included in the URL
  const portString = (
    (publicProtocol === 'http' && publicPort === 80) ||
    (publicProtocol === 'https' && publicPort === 443)
  ) ? '' : `:${publicPort}`;

  return `${publicProtocol}://${publicHost}${portString}`;
}

/**
 * Build a full public URL from a path
 * @param {string} path - The path (should start with /)
 * @returns {string} - Full public URL
 */
function buildPublicUrl(path) {
  return `${getPublicBaseUrl()}${path}`;
}

const config = loadConfig();
config.getPublicBaseUrl = getPublicBaseUrl;
config.buildPublicUrl = buildPublicUrl;

module.exports = config;
