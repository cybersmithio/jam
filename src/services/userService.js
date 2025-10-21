const User = require('../models/User');

/**
 * Find existing user or create new user based on IdP profile
 * @param {Object} idpProfile - Profile from identity provider
 * @param {string} idpProfile.provider - Provider name (google, facebook, apple)
 * @param {string} idpProfile.providerId - User's ID from the provider
 * @param {string} idpProfile.email - User's email address
 * @param {string} idpProfile.name - User's display name
 * @param {Object} idpProfile.profileData - Additional profile data from IdP
 * @returns {Promise<User>} - User document
 */
async function findOrCreateUser(idpProfile) {
  const { provider, providerId, email, name, profileData } = idpProfile;

  // Email is required - reject if not provided
  if (!email || email.trim() === '') {
    throw new Error('Email is required from identity provider');
  }

  // Step 1: Try to find user by provider and providerId
  let user = await User.findOne({
    'identityProviders.provider': provider,
    'identityProviders.providerId': providerId
  });

  if (user) {
    // User found with this IdP - update lastLogin and return
    user.lastLogin = new Date();
    await user.save();
    return user;
  }

  // Step 2: User not found by IdP credentials - try to find by email
  user = await User.findOne({ email: email.toLowerCase().trim() });

  if (user) {
    // User exists with this email - link new IdP to existing account
    const idpExists = user.identityProviders.some(
      idp => idp.provider === provider && idp.providerId === providerId
    );

    if (!idpExists) {
      user.identityProviders.push({
        provider,
        providerId,
        email,
        profileData
      });
    }

    user.lastLogin = new Date();
    await user.save();
    return user;
  }

  // Step 3: New user - create account
  user = await User.create({
    email: email.toLowerCase().trim(),
    name: name || email,
    identityProviders: [
      {
        provider,
        providerId,
        email,
        profileData
      }
    ],
    lastLogin: new Date()
  });

  return user;
}

/**
 * Get user by MongoDB _id
 * @param {string|ObjectId} userId - User's MongoDB _id
 * @returns {Promise<User|null>} - User document or null if not found
 */
async function getUserById(userId) {
  return await User.findById(userId);
}

/**
 * Get user by email address
 * @param {string} email - User's email address
 * @returns {Promise<User|null>} - User document or null if not found
 */
async function getUserByEmail(email) {
  return await User.findOne({ email: email.toLowerCase().trim() });
}

module.exports = {
  findOrCreateUser,
  getUserById,
  getUserByEmail
};
