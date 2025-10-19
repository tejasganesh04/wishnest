// --- Core imports ---
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// --- Route imports ---
const authRoutes = require('./routes/auth.routes');
const wishlistRoutes = require('./routes/wishlist.routes');
const itemRoutes = require('./routes/item.routes');
const friendRoutes = require('./routes/friend.routes');

// --- Create app instance ---
const app = express();

// --- Global middleware ---
app.use(express.json());
app.use(cors());           // If you need credentials, configure origin & credentials here
app.use(helmet());
app.use(morgan('dev'));

// --- Mount routers ---
app.use('/api/auth', authRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/wishlist', itemRoutes);   // OK if intended to share base path
app.use('/api/friends', friendRoutes);  // friends API

// --- Health check ---
app.get('/', (req, res) => {
  res.send('✅ WishHaven backend is running 🚀');
});

// --- Export app ---
module.exports = app;
