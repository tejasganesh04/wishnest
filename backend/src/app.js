// app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();

// 🔹 basic middlewares
app.use(express.json());      // parse incoming JSON
app.use(cors());              // allow frontend requests
app.use(helmet());            // security headers
app.use(morgan('dev'));       // log every request in console

// 🔹 simple test route
app.get('/', (req, res) => {
  res.send('WishNest backend is running 🚀');
});

// export the app (so server.js can import it)
module.exports = app;
