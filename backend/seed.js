// backend/seed.js
// Purpose: Populate MongoDB with sample WishNest data using the real runtime models.
// Usage: node backend/seed.js

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Import your actual runtime models (so field names match everywhere)
const User = require('./src/models/User');
const Wishlist = require('./src/models/Wishlist');
const Item = require('./src/models/Item');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/wishnest';
const DEFAULT_PASSWORD = 'Passw0rd!';

async function ensureUser({ name, username, email }) {
  let user = await User.findOne({ $or: [{ email }, { username }] });
  if (!user) {
    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    user = await User.create({ name, username, email, passwordHash });
    console.log('Created user:', email);
  } else {
    console.log('User exists:', email);
  }
  return user;
}

async function ensureWishlist(userId, { title, description }) {
  let wl = await Wishlist.findOne({ user: userId });
  if (!wl) {
    wl = await Wishlist.create({ user: userId, title, description });
    console.log('Created wishlist for:', userId.toString());
  } else {
    console.log('Wishlist exists for:', userId.toString());
  }
  return wl;
}

async function addItem(wishlistId, data) {
  const item = await Item.create({ ...data, wishlist: wishlistId });
  console.log(' + Item:', item.title);
  return item;
}

(async function main() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected:', MONGO_URI);

    // Sample users
    const tejas = await ensureUser({
      name: 'Tejas Ganesh',
      username: 'tejas',
      email: 'tejas@example.com',
    });

    const friend = await ensureUser({
      name: 'Friend Contributor',
      username: 'friend1',
      email: 'friend@example.com',
    });

    // Tejas's wishlist (runtime model expects "user", not "owner")
    const tejasWL = await ensureWishlist(tejas._id, {
      title: "Tejas' Wishlist",
      description: 'Things I want or need this year',
    });

    // Items (runtime model fields: reservedByUser/reservedAt — no isReserved/reservedBy)
    await addItem(tejasWL._id, {
      title: 'Kindle Paperwhite',
      description: 'Prefer 16GB version',
      category: 'everyday',
      url: 'https://example.com/kindle',
      price: 13999,
    });

    await addItem(tejasWL._id, {
      title: 'Noise-Cancelling Headphones',
      description: 'Prefer black color',
      category: 'dream',
      url: 'https://example.com/headphones',
      price: 12999,
      reservedByUser: friend._id, // reserve by friend to demo the flow
      reservedAt: new Date(),
    });

    await addItem(tejasWL._id, {
      title: 'Running Shoes',
      description: 'EU size 43',
      category: 'everyday',
      url: 'https://example.com/shoes',
      price: 5999,
    });

    console.log('\nSeed complete. Credentials:');
    console.log(' - tejas@example.com / ' + DEFAULT_PASSWORD);
    console.log(' - friend@example.com / ' + DEFAULT_PASSWORD);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
