// src/controllers/item.controller.js
// Purpose: CRUD for wishlist items + minimal reservation handlers

const mongoose = require('mongoose');
const Wishlist = require('../models/Wishlist');
const Item = require('../models/Item');

// Utility: ensure wishlist exists or create one
async function getMyWishlistIdOrCreate(userId) {
  let wl = await Wishlist.findOne({ user: userId });
  if (!wl) wl = await Wishlist.create({ user: userId, title: 'My Wishlist', description: '' });
  return wl._id;
}

// ---------------- LIST ITEMS ----------------
// GET /api/wishlist/items
exports.listItems = async (req, res) => {
  try {
    // Find the current user's wishlist
    const wishlist = await Wishlist.findOne({ user: req.user.id });
    if (!wishlist) return res.status(404).json({ error: 'Wishlist not found' });

    // Fetch all items belonging to that wishlist
    const items = await Item.find({ wishlist: wishlist._id })
      .sort({ createdAt: -1 }); // newest first

    return res.json({ items });
  } catch (err) {
    console.error('LIST_ITEMS_ERROR:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// ---------------- DELETE ITEM ----------------
// DELETE /api/wishlist/items/:itemId
exports.deleteItem = async (req, res) => {
  try {
    const { itemId } = req.params;

    // 1) Validate id
    if (!mongoose.isValidObjectId(itemId)) {
      return res.status(400).json({ error: 'Invalid item id' });
    }

    // 2) Ensure this user's wishlist exists
    const wishlist = await Wishlist.findOne({ user: req.user.id });
    if (!wishlist) return res.status(404).json({ error: 'Wishlist not found' });

    // 3) Delete only if the item belongs to this wishlist
    const deleted = await Item.findOneAndDelete({
      _id: itemId,
      wishlist: wishlist._id,
    });

    if (!deleted) return res.status(404).json({ error: 'Item not found' });

    // 4) Confirm
    return res.json({ message: 'Item deleted' });
  } catch (err) {
    console.error('DELETE_ITEM_ERROR:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};


// ---------------- CREATE ITEM ----------------
// POST /api/wishlist/items
exports.createItem = async (req, res) => {
  try {
    const { title = '', description = '', category, iconKey, url, price, alternate } = req.body;

    if (!title.trim()) return res.status(400).json({ error: 'Title is required' });
    if (!description.trim()) return res.status(400).json({ error: 'Description is required' });
    if (!category || !['everyday', 'dream'].includes(String(category))) {
      return res.status(400).json({ error: 'Category must be "everyday" or "dream"' });
    }

    const wishlistId = await getMyWishlistIdOrCreate(req.user.id);

    const payload = {
      wishlist: wishlistId,
      title: title.trim(),
      description: description.trim(),
      category: String(category),
    };

    if (typeof iconKey === 'string') payload.iconKey = iconKey.trim();
    if (typeof url === 'string') payload.url = url.trim();
    if (price !== undefined) {
      const n = Number(price);
      if (Number.isNaN(n) || n < 0) return res.status(400).json({ error: 'Invalid price' });
      payload.price = n;
    }

    if (alternate && typeof alternate === 'object' && typeof alternate.title === 'string') {
      const alt = { title: alternate.title.trim() };
      if (!alt.title) return res.status(400).json({ error: 'Alternate title cannot be empty' });
      if (typeof alternate.url === 'string') alt.url = alternate.url.trim();
      if (typeof alternate.note === 'string') alt.note = alternate.note.trim();
      if (alternate.price !== undefined) {
        const ap = Number(alternate.price);
        if (Number.isNaN(ap) || ap < 0) return res.status(400).json({ error: 'Invalid alternate price' });
        alt.price = ap;
      }
      payload.alternate = alt;
    }

    const item = await Item.create(payload);
    return res.status(201).json({ item });
  } catch (err) {
    console.error('CREATE_ITEM_ERROR:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// ---------------- UPDATE ITEM ----------------
// PATCH /api/wishlist/items/:itemId
exports.updateItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    if (!mongoose.isValidObjectId(itemId)) return res.status(400).json({ error: 'Invalid item id' });

    const wishlist = await Wishlist.findOne({ user: req.user.id });
    if (!wishlist) return res.status(404).json({ error: 'Wishlist not found' });

    const { title, description, category, iconKey, url, price, alternate } = req.body;
    const updateDoc = { $set: {} };

    if (typeof title === 'string') {
      const t = title.trim();
      if (!t) return res.status(400).json({ error: 'Title cannot be empty' });
      if (t.length > 140) return res.status(400).json({ error: 'Title too long (max 140)' });
      updateDoc.$set.title = t;
    }

    if (typeof description === 'string') {
      const d = description.trim();
      if (!d) return res.status(400).json({ error: 'Description cannot be empty' });
      if (d.length > 600) return res.status(400).json({ error: 'Description too long (max 600)' });
      updateDoc.$set.description = d;
    }

    if (typeof category === 'string') {
      const c = category.trim();
      if (!['everyday', 'dream'].includes(c))
        return res.status(400).json({ error: 'Category must be "everyday" or "dream"' });
      updateDoc.$set.category = c;
    }

    if (typeof iconKey === 'string') updateDoc.$set.iconKey = iconKey.trim();
    if (typeof url === 'string') updateDoc.$set.url = url.trim();
    if (price !== undefined) {
      const n = Number(price);
      if (Number.isNaN(n) || n < 0) return res.status(400).json({ error: 'Invalid price' });
      updateDoc.$set.price = n;
    }

    // --- Alternate handling (set or remove) ---
    if (alternate !== undefined) {
      if (alternate === null) {
        updateDoc.$unset = { ...(updateDoc.$unset || {}), alternate: 1 };
      } else if (typeof alternate === 'object') {
        if (typeof alternate.title !== 'string' || !alternate.title.trim())
          return res.status(400).json({ error: 'Alternate title is required when setting alternate' });

        const alt = { title: alternate.title.trim() };
        if (typeof alternate.url === 'string') alt.url = alternate.url.trim();
        if (typeof alternate.note === 'string') alt.note = alternate.note.trim();
        if (alternate.price !== undefined) {
          const ap = Number(alternate.price);
          if (Number.isNaN(ap) || ap < 0) return res.status(400).json({ error: 'Invalid alternate price' });
          alt.price = ap;
        }
        updateDoc.$set.alternate = alt;
        if (updateDoc.$unset && updateDoc.$unset.alternate) delete updateDoc.$unset.alternate;
      } else {
        return res.status(400).json({ error: 'Invalid alternate payload' });
      }
    }

    if (Object.keys(updateDoc.$set).length === 0) delete updateDoc.$set;

    const item = await Item.findOneAndUpdate(
      { _id: itemId, wishlist: wishlist._id },
      updateDoc,
      { new: true }
    );
    if (!item) return res.status(404).json({ error: 'Item not found' });

    return res.json({ item });
  } catch (err) {
    console.error('UPDATE_ITEM_ERROR:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// ---------------- RESERVE ITEM ----------------
// POST /api/wishlist/items/:itemId/reserve
exports.reserveItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    if (!mongoose.isValidObjectId(itemId)) return res.status(400).json({ error: 'Invalid item id' });

    const wishlist = await Wishlist.findOne({ user: req.user.id });
    if (!wishlist) return res.status(404).json({ error: 'Wishlist not found' });

    // Reserve only if not already reserved (covers missing or null)
    const item = await Item.findOneAndUpdate(
      {
        _id: itemId,
        wishlist: wishlist._id,
        $or: [{ reservedByUser: { $exists: false } }, { reservedByUser: null }],
      },
      { $set: { reservedByUser: req.user.id, reservedAt: new Date() } },
      { new: true }
    );

    if (!item) return res.status(409).json({ error: 'Item is already reserved' });
    return res.json({ item });
  } catch (err) {
    console.error('RESERVE_ITEM_ERROR:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// ---------------- UNRESERVE ITEM ----------------
// POST /api/wishlist/items/:itemId/unreserve
exports.unreserveItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    if (!mongoose.isValidObjectId(itemId)) return res.status(400).json({ error: 'Invalid item id' });

    const wishlist = await Wishlist.findOne({ user: req.user.id });
    if (!wishlist) return res.status(404).json({ error: 'Wishlist not found' });

    const item = await Item.findOneAndUpdate(
      {
        _id: itemId,
        wishlist: wishlist._id,
        reservedByUser: { $ne: null },
      },
      { $unset: { reservedByUser: 1, reservedAt: 1 } },
      { new: true }
    );

    if (!item) return res.status(404).json({ error: 'Reserved item not found' });
    return res.json({ item });
  } catch (err) {
    console.error('UNRESERVE_ITEM_ERROR:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};
