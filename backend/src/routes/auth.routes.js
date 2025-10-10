const router = require('express').Router();
const { signup, login, me } = require('../controllers/auth.controller.js');
const auth = require('../middleware/auth');
const User = require('../models/User.js');
router.post('/signup', signup);
router.post('/login', login);
//router.get('/me', auth, me);
router.get('/me', auth, async (req, res) => {
  try {
    // Fetch the complete user data using the ID from middleware
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    console.error('ME_ROUTE_ERROR:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
