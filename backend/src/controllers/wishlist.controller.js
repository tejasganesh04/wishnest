// src/controllers/wishlist.controller.js
// Handles the authenticated user's single wishlist (auto-creates on first access).

const mongoose = require('mongoose');
const Wishlist = require('../models/Wishlist');

// ---------- GET or CREATE ----------
exports.getOrCreateMyWishlist = async (req, res) => {
  try {
    // 1️⃣ look for existing wishlist
    let wishlist = await Wishlist.findOne({ user: req.user.id });

    // 2️⃣ if none found, create a new default one
    if (!wishlist) {
      wishlist = await Wishlist.create({
        user: req.user.id,
        title: 'My Wishlist',
        description: '',
      });
    }

    // 3️⃣ return the wishlist document
    return res.json({ wishlist });
  } catch (err) {
    console.error('GET_OR_CREATE_WISHLIST_ERROR:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// ---------- UPDATE ----------
exports.updateMyWishlist = async (req, res) => {
  try {
    const { title, description } = req.body;

    // 1️⃣ build update object
    const update = {};
    if (typeof title === 'string') {
      const t = title.trim();
      if (!t) return res.status(400).json({ error: 'Title cannot be empty' });
      if (t.length > 100) return res.status(400).json({ error: 'Title too long' });
      update.title = t;
    }
    if (typeof description === 'string') {
      const d = description.trim();
      if (d.length > 500) return res.status(400).json({ error: 'Description too long' });
      update.description = d;
    }

    // 2️⃣ find existing wishlist and update; upsert ensures one exists
    const wishlist = await Wishlist.findOneAndUpdate(
      { user: req.user.id },
      { $set: update },
      { new: true, upsert: true }
    );

    return res.json({ wishlist });
  } catch (err) {
    console.error('UPDATE_WISHLIST_ERROR:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// ---------- DELETE ----------
exports.deleteMyWishlist = async (req, res) => {
  try {
    const deleted = await Wishlist.findOneAndDelete({ user: req.user.id });
    if (!deleted) return res.status(404).json({ error: 'Wishlist not found' });
    return res.json({ message: 'Wishlist deleted' });
  } catch (err) {
    console.error('DELETE_WISHLIST_ERROR:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};
