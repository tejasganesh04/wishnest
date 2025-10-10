// src/models/Item.js
// Purpose: Item with one optional alternate suggestion (not a list),
//          plus minimal reservation state (reservedByUser, reservedAt).

const mongoose = require('mongoose');

// ---------------- Alternate (single, optional) ----------------
const alternateSchema = new mongoose.Schema(
  {
    // Required title for the alternate suggestion
    title: { type: String, required: true, trim: true, maxlength: 140 },

    // Optional link to the alternate product/info
    url: { type: String, trim: true, maxlength: 1000 },

    // Optional short note like "cheaper, similar sound"
    note: { type: String, trim: true, maxlength: 300 },

    // Optional rough price (no currency in MVP)
    price: { type: Number, min: 0 },
  },
  { _id: false } // no separate Mongo _id for the embedded doc
);

// ---------------- Item ----------------
const itemSchema = new mongoose.Schema(
  {
    // Link to the owner's single wishlist
    wishlist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wishlist',
      required: true,
      index: true,
    },

    // Core, expressive fields
    title: { type: String, required: true, trim: true, maxlength: 140 },
    description: { type: String, required: true, trim: true, maxlength: 600 },

    // Mood bucket drives default icon/styling
    category: { type: String, required: true, enum: ['everyday', 'dream'], index: true },

    // Optional personal icon override (UI maps keys -> emoji/svg)
    iconKey: { type: String, trim: true, maxlength: 30 },

    // Optional link + rough price
    url: { type: String, trim: true, maxlength: 1000 },
    price: { type: Number, min: 0 },

    // ✅ Single alternate suggestion (optional)
    alternate: { type: alternateSchema, default: undefined },

    // ---------- Reservation (minimal, derives "isReserved" from presence) ----------
    // If present => reserved; if absent => not reserved
    reservedByUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // Optional timestamp for when reservation happened (kept small for audit/UX)
    reservedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Item', itemSchema);
