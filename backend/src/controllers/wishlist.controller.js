// backend/src/controllers/wishlist.controller.js
// Handles the authenticated user's single wishlist + friend-facing meta.

const mongoose = require('mongoose');
const Wishlist = require('../models/Wishlist');
const { areFriends } = require('../services/friend.service');

// ---------- GET or CREATE (MY WISHLIST) ----------
exports.getOrCreateMyWishlist = async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user.id });
    if (!wishlist) {
      wishlist = await Wishlist.create({
        user: req.user.id,
        title: 'My Wishlist',
        description: '',
      });
    }
    return res.json({ wishlist });
  } catch (err) {
    console.error('GET_OR_CREATE_WISHLIST_ERROR:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// ---------- UPDATE (MY WISHLIST) ----------
exports.updateMyWishlist = async (req, res) => {
  try {
    const { title, description } = req.body;

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

// ---------- DELETE (MY WISHLIST) ----------
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

// ---------- FRIEND-FACING: GET META FOR USER ----------
exports.getUserWishlistMeta = async (req, res) => {
  try {
    const ownerUserId = req.params.userId;
    if (!mongoose.isValidObjectId(ownerUserId)) {
      return res.status(400).json({ error: 'Invalid user id' });
    }

    const callerId = req.user.id;
    const isOwner = callerId === ownerUserId;
    const ok = isOwner || (await areFriends(callerId, ownerUserId));
    if (!ok) return res.status(403).json({ error: 'Not allowed (not friends)' });

    const wl = await Wishlist.findOne({ user: ownerUserId }).select('title description updatedAt');
    if (!wl) return res.status(404).json({ error: 'Wishlist not found' });

    return res.json({ wishlist: wl });
  } catch (err) {
    console.error('GET_USER_WISHLIST_META_ERROR:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};
