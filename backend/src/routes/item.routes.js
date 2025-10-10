// src/routes/item.routes.js
// Purpose: Item endpoints for the authenticated user's single wishlist.

const express = require('express');
const auth = require('../middleware/auth');
const {
  createItem,
  listItems,
  updateItem,
  deleteItem,
  reserveItem,
  unreserveItem,
} = require('../controllers/item.controller');

const router = express.Router();

// All routes require JWT auth
router.use(auth);

// Create item
router.post('/items', createItem);

// List all items in my wishlist (most recent first recommended in controller)
router.get('/items', listItems);

// Update item (partial)
router.patch('/items/:itemId', updateItem);

// Delete item
router.delete('/items/:itemId', deleteItem);

// Reserve / Unreserve
router.post('/items/:itemId/reserve', reserveItem);
router.post('/items/:itemId/unreserve', unreserveItem);

module.exports = router;
