// backend/src/routes/item.routes.js
// Purpose: Item endpoints for the authenticated user's single wishlist
// Notes:
//  - All routes are protected via auth middleware
//  - Friend-view read route lets owner OR accepted friends view items
//  - Reserve/Unreserve authorize by item owner (implemented in controller)

const express = require('express');
const auth = require('../middleware/auth');

const {
  createItem,
  listItems,          // GET my items (owner view)
  listItemsForUser,   // GET items for :userId (owner or friend)  ✅
  updateItem,
  deleteItem,
  reserveItem,
  unreserveItem,
} = require('../controllers/item.controller');

const router = express.Router();

// All item routes require JWT auth
router.use(auth);

// Create an item in MY wishlist (owner-only)
router.post('/items', createItem);

// List items in MY wishlist (owner-only)
router.get('/items', listItems);

// ✅ Friend-view: list items for a given user (owner or accepted friend)
router.get('/users/:userId/items', listItemsForUser);

// Update an item in MY wishlist (owner-only)
router.patch('/items/:itemId', updateItem);

// Delete an item from MY wishlist (owner-only)
router.delete('/items/:itemId', deleteItem);

// Reserve an item (owner or accepted friend of the owner)
router.post('/items/:itemId/reserve', reserveItem);

// Unreserve an item (reserver or owner can force unreserve)
router.post('/items/:itemId/unreserve', unreserveItem);

module.exports = router;
