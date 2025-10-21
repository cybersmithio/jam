const mongoose = require('mongoose');

const identityProviderSchema = new mongoose.Schema({
  provider: {
    type: String,
    required: true,
    enum: ['google', 'facebook', 'apple']
  },
  providerId: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: false // IdP email might differ from user's primary email
  },
  profileData: {
    type: mongoose.Schema.Types.Mixed,
    required: false
  }
}, { _id: false });

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    required: false
  },
  identityProviders: [identityProviderSchema],
  lastLogin: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Create indexes for efficient querying
userSchema.index({ 'identityProviders.provider': 1, 'identityProviders.providerId': 1 });
userSchema.index({ email: 1 }, { unique: true });

const User = mongoose.model('User', userSchema);

module.exports = User;
