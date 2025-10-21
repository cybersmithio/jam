const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

describe('User Model Tests', () => {
  let mongoServer;

  beforeAll(async () => {
    // Create in-memory MongoDB instance for testing
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Ensure indexes are created
    const User = require('../models/User');
    await User.init();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear all collections before each test
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  });

  test('should create a user with email and name', async () => {
    const User = require('../models/User');

    const userData = {
      email: 'test@example.com',
      name: 'Test User'
    };

    const user = await User.create(userData);

    expect(user._id).toBeDefined();
    expect(user.email).toBe(userData.email);
    expect(user.name).toBe(userData.name);
    expect(user.createdAt).toBeDefined();
  });

  test('should store IdP credentials for a user', async () => {
    const User = require('../models/User');

    const userData = {
      email: 'test@example.com',
      name: 'Test User',
      identityProviders: [
        {
          provider: 'google',
          providerId: '123456789',
          email: 'test@example.com'
        }
      ]
    };

    const user = await User.create(userData);

    expect(user.identityProviders).toHaveLength(1);
    expect(user.identityProviders[0].provider).toBe('google');
    expect(user.identityProviders[0].providerId).toBe('123456789');
  });

  test('should allow multiple IdP credentials for same user', async () => {
    const User = require('../models/User');

    const userData = {
      email: 'test@example.com',
      name: 'Test User',
      identityProviders: [
        {
          provider: 'google',
          providerId: 'google-123',
          email: 'test@example.com'
        },
        {
          provider: 'facebook',
          providerId: 'facebook-456',
          email: 'test@example.com'
        }
      ]
    };

    const user = await User.create(userData);

    expect(user.identityProviders).toHaveLength(2);
    expect(user.identityProviders[0].provider).toBe('google');
    expect(user.identityProviders[1].provider).toBe('facebook');
  });

  test('should require email field', async () => {
    const User = require('../models/User');

    const userData = {
      name: 'Test User'
      // email is missing
    };

    await expect(User.create(userData)).rejects.toThrow();
  });

  test('should enforce unique email addresses', async () => {
    const User = require('../models/User');

    const userData1 = {
      email: 'test@example.com',
      name: 'Test User 1'
    };

    const userData2 = {
      email: 'test@example.com',
      name: 'Test User 2'
    };

    await User.create(userData1);

    // Creating second user with same email should fail
    await expect(User.create(userData2)).rejects.toThrow();
  });

  test('should find user by IdP provider and providerId', async () => {
    const User = require('../models/User');

    const userData = {
      email: 'test@example.com',
      name: 'Test User',
      identityProviders: [
        {
          provider: 'google',
          providerId: 'google-123',
          email: 'test@example.com'
        }
      ]
    };

    await User.create(userData);

    // Should be able to find user by IdP credentials
    const foundUser = await User.findOne({
      'identityProviders.provider': 'google',
      'identityProviders.providerId': 'google-123'
    });

    expect(foundUser).toBeDefined();
    expect(foundUser.email).toBe('test@example.com');
  });

  test('should update lastLogin timestamp', async () => {
    const User = require('../models/User');

    const user = await User.create({
      email: 'test@example.com',
      name: 'Test User'
    });

    const originalLastLogin = user.lastLogin;

    // Wait a bit and update lastLogin
    await new Promise(resolve => setTimeout(resolve, 10));

    user.lastLogin = new Date();
    await user.save();

    expect(user.lastLogin.getTime()).toBeGreaterThan(
      originalLastLogin ? originalLastLogin.getTime() : 0
    );
  });

  test('should add new IdP to existing user', async () => {
    const User = require('../models/User');

    const user = await User.create({
      email: 'test@example.com',
      name: 'Test User',
      identityProviders: [
        {
          provider: 'google',
          providerId: 'google-123',
          email: 'test@example.com'
        }
      ]
    });

    // Add Facebook IdP
    user.identityProviders.push({
      provider: 'facebook',
      providerId: 'facebook-456',
      email: 'test@example.com'
    });

    await user.save();

    const updatedUser = await User.findById(user._id);
    expect(updatedUser.identityProviders).toHaveLength(2);
  });

  test('should store profile data from IdP', async () => {
    const User = require('../models/User');

    const userData = {
      email: 'test@example.com',
      name: 'Test User',
      identityProviders: [
        {
          provider: 'google',
          providerId: 'google-123',
          email: 'test@example.com',
          profileData: {
            displayName: 'Test User',
            picture: 'https://example.com/photo.jpg'
          }
        }
      ]
    };

    const user = await User.create(userData);

    expect(user.identityProviders[0].profileData).toBeDefined();
    expect(user.identityProviders[0].profileData.displayName).toBe('Test User');
    expect(user.identityProviders[0].profileData.picture).toBe('https://example.com/photo.jpg');
  });
});
