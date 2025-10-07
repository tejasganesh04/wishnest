// server.js
const app = require('./app');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
// load environment variables from .env file
dotenv.config();

// connect to MongoDB first
connectDB();
// choose port (from .env or default 8000)
const PORT = process.env.PORT;

// start the server
app.listen(PORT, () => {
  console.log(`✅  WishNest backend running on port ${PORT}`);
});
