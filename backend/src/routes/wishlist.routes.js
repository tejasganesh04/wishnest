// src/routes/wishlist.routes.js
// Routes for the single wishlist (protected by JWT middleware).

const express = require('express');
const auth = require('../middleware/auth');
const {
  getOrCreateMyWishlist,
  updateMyWishlist,
  deleteMyWishlist,
} = require('../controllers/wishlist.controller');

const router = express.Router();

// All endpoints below require authentication
router.use(auth);

// GET → return existing wishlist or auto-create a default one
router.get('/', getOrCreateMyWishlist);

// PATCH → update title / description
router.patch('/', updateMyWishlist);

// DELETE → remove the wishlist entirely (optional)
router.delete('/', deleteMyWishlist);

module.exports = router;
