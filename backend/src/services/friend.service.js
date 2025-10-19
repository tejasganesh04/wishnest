// backend/src/services/friend.service.js
// Tiny helpers for reuse (e.g., wishlist visibility checks)

const { Friendship } = require("../models/friendship.model");

async function areFriends(userAId, userBId) {
  if (!userAId || !userBId) return false;

  const [a, b] = [userAId.toString(), userBId.toString()].sort();

  const edge = await Friendship.findOne({
    participants: [a, b],
    status: "accepted",
  }).lean();

  return !!edge;
}

module.exports = { areFriends };
