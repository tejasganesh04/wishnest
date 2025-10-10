const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  username:    { type: String, required: true, unique: true },
  email:       { type: String, required: true, unique: true },
  passwordHash:{ type: String, required: true },
  avatarUrl:   { type: String, default: null }
});

module.exports = mongoose.model('User', userSchema);
