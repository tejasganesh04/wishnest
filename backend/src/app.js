// --- Core imports ---
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// --- Route imports (explicit) ---
const authRoutes = require('./routes/auth.routes');
const wishlistRoutes = require('./routes/wishlist.routes'); // ✅ new route added
const itemRoutes = require('./routes/item.routes');


// --- Create app instance ---
const app = express();

// --- Global middleware ---
app.use(express.json());   // Parse JSON body
app.use(cors());           // Allow frontend to call API
app.use(helmet());         // Security headers
app.use(morgan('dev'));    // Request logs

// --- Mount routers ---
app.use('/api/auth', authRoutes);
app.use('/api/wishlist', wishlistRoutes); // ✅ new route mounted
app.use('/api/wishlist', itemRoutes); // mounts under the same base path
// --- Health check / default ---
app.get('/', (req, res) => {
  res.send('✅ WishNest backend is running 🚀');
});

// --- Export app for server.js ---
module.exports = app;
