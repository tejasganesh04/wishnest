// src/models/Wishlist.js
// Purpose: one-wishlist-per-user model (1 : 1). Created lazily on first access.

const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema(
  {
    // The single user who owns this wishlist
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,   // enforce one wishlist per user
      index: true,
    },

    // Display title of the wishlist
    title: {
      type: String,
      trim: true,
      minlength: 1,
      maxlength: 100,
      default: 'My Wishlist',
    },

    // Optional short description
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },

    // Simple toggle (reserved for later)
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true } // adds createdAt & updatedAt
);

module.exports = mongoose.model('Wishlist', wishlistSchema);
