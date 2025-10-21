const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

describe('User Service Tests', () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  });

  describe('findOrCreateUser', () => {
    test('should create new user if not found by IdP credentials', async () => {
      const userService = require('../services/userService');

      const idpProfile = {
        provider: 'google',
        providerId: 'google-123',
        email: 'newuser@example.com',
        name: 'New User'
      };

      const user = await userService.findOrCreateUser(idpProfile);

      expect(user).toBeDefined();
      expect(user.email).toBe(idpProfile.email);
      expect(user.name).toBe(idpProfile.name);
      expect(user.identityProviders).toHaveLength(1);
      expect(user.identityProviders[0].provider).toBe('google');
      expect(user.identityProviders[0].providerId).toBe('google-123');
    });

    test('should return existing user if found by IdP credentials', async () => {
      const userService = require('../services/userService');
      const User = require('../models/User');

      // Create existing user
      const existingUser = await User.create({
        email: 'existing@example.com',
        name: 'Existing User',
        identityProviders: [
          {
            provider: 'google',
            providerId: 'google-123',
            email: 'existing@example.com'
          }
        ]
      });

      const idpProfile = {
        provider: 'google',
        providerId: 'google-123',
        email: 'existing@example.com',
        name: 'Existing User'
      };

      const user = await userService.findOrCreateUser(idpProfile);

      expect(user._id.toString()).toBe(existingUser._id.toString());
      expect(user.identityProviders).toHaveLength(1);
    });

    test('should link new IdP to existing user by email match', async () => {
      const userService = require('../services/userService');
      const User = require('../models/User');

      // Create user with Google IdP
      const existingUser = await User.create({
        email: 'user@example.com',
        name: 'Test User',
        identityProviders: [
          {
            provider: 'google',
            providerId: 'google-123',
            email: 'user@example.com'
          }
        ]
      });

      // User logs in with Facebook using same email
      const idpProfile = {
        provider: 'facebook',
        providerId: 'facebook-456',
        email: 'user@example.com',
        name: 'Test User'
      };

      const user = await userService.findOrCreateUser(idpProfile);

      expect(user._id.toString()).toBe(existingUser._id.toString());
      expect(user.identityProviders).toHaveLength(2);
      expect(user.identityProviders[1].provider).toBe('facebook');
      expect(user.identityProviders[1].providerId).toBe('facebook-456');
    });

    test('should update lastLogin timestamp when user logs in', async () => {
      const userService = require('../services/userService');
      const User = require('../models/User');

      const existingUser = await User.create({
        email: 'user@example.com',
        name: 'Test User',
        identityProviders: [
          {
            provider: 'google',
            providerId: 'google-123',
            email: 'user@example.com'
          }
        ]
      });

      const originalLastLogin = existingUser.lastLogin;

      await new Promise(resolve => setTimeout(resolve, 10));

      const idpProfile = {
        provider: 'google',
        providerId: 'google-123',
        email: 'user@example.com',
        name: 'Test User'
      };

      const user = await userService.findOrCreateUser(idpProfile);

      expect(user.lastLogin).toBeDefined();
      expect(user.lastLogin.getTime()).toBeGreaterThan(
        originalLastLogin ? originalLastLogin.getTime() : 0
      );
    });

    test('should not create duplicate user if IdP already linked', async () => {
      const userService = require('../services/userService');
      const User = require('../models/User');

      const idpProfile = {
        provider: 'google',
        providerId: 'google-123',
        email: 'user@example.com',
        name: 'Test User'
      };

      // First login creates user
      const user1 = await userService.findOrCreateUser(idpProfile);

      // Second login should find same user
      const user2 = await userService.findOrCreateUser(idpProfile);

      expect(user1._id.toString()).toBe(user2._id.toString());

      // Verify only one user exists in database
      const userCount = await User.countDocuments();
      expect(userCount).toBe(1);
    });

    test('should store IdP profile data', async () => {
      const userService = require('../services/userService');

      const idpProfile = {
        provider: 'google',
        providerId: 'google-123',
        email: 'user@example.com',
        name: 'Test User',
        profileData: {
          picture: 'https://example.com/photo.jpg',
          locale: 'en'
        }
      };

      const user = await userService.findOrCreateUser(idpProfile);

      expect(user.identityProviders[0].profileData).toBeDefined();
      expect(user.identityProviders[0].profileData.picture).toBe('https://example.com/photo.jpg');
    });

    test('should reject user if IdP does not provide email', async () => {
      const userService = require('../services/userService');

      const idpProfileNoEmail = {
        provider: 'apple',
        providerId: 'apple-123',
        email: null,
        name: 'Test User'
      };

      // Should reject - email is required to communicate with user
      await expect(userService.findOrCreateUser(idpProfileNoEmail)).rejects.toThrow(/email.*required/i);

      const idpProfileEmptyEmail = {
        provider: 'apple',
        providerId: 'apple-456',
        email: '',
        name: 'Test User'
      };

      // Should also reject empty string email
      await expect(userService.findOrCreateUser(idpProfileEmptyEmail)).rejects.toThrow(/email.*required/i);

      const idpProfileUndefinedEmail = {
        provider: 'facebook',
        providerId: 'facebook-789',
        name: 'Test User'
        // email is undefined
      };

      // Should also reject undefined email
      await expect(userService.findOrCreateUser(idpProfileUndefinedEmail)).rejects.toThrow(/email.*required/i);
    });
  });

  describe('getUserById', () => {
    test('should retrieve user by MongoDB _id', async () => {
      const userService = require('../services/userService');
      const User = require('../models/User');

      const createdUser = await User.create({
        email: 'user@example.com',
        name: 'Test User'
      });

      const user = await userService.getUserById(createdUser._id);

      expect(user).toBeDefined();
      expect(user._id.toString()).toBe(createdUser._id.toString());
      expect(user.email).toBe('user@example.com');
    });

    test('should return null if user not found', async () => {
      const userService = require('../services/userService');
      const mongoose = require('mongoose');

      const fakeId = new mongoose.Types.ObjectId();
      const user = await userService.getUserById(fakeId);

      expect(user).toBeNull();
    });
  });
});
