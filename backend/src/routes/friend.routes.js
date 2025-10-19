// backend/src/routes/friend.routes.js
// Express routes for friends feature (uses your existing auth middleware)

const express = require('express');
const auth = require('../middleware/auth');

const {
  sendFriendRequest,
  acceptRequest,
  rejectRequest,
  removeFriend,
  listFriends,
  listRequests,
} = require('../controllers/friend.controller');

const router = express.Router();

// All friend routes require JWT auth
router.use(auth);

// Requests management
router.post('/request/:userId', sendFriendRequest);
router.post('/accept/:requestId', acceptRequest);
router.post('/reject/:requestId', rejectRequest);

// Remove relation (friendship or request)
router.delete('/remove/:userId', removeFriend);

// Lists
router.get('/list', listFriends);
router.get('/requests', listRequests);

module.exports = router;
