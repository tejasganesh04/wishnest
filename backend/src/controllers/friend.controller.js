// backend/src/controllers/friend.controller.js
// Core actions: request, accept, reject, remove, list friends, list pending
// Assumes auth middleware sets req.user = { id: "<ObjectId>" }

const mongoose = require("mongoose");
const { Friendship } = require("../models/friendship.model");
const User = require("../models/User"); // ✅ correct import & casing

// Normalize a pair of user IDs into a sorted array to guarantee uniqueness
function pair(a, b) {
  return [a.toString(), b.toString()].sort();
}

/**
 * POST /api/friends/request/:userId
 * Send (or re-send) a friend request to :userId
 */
async function sendFriendRequest(req, res) {
  try {
    const me = req.user.id; // ✅ middleware provides { id }
    const target = req.params.userId;

    if (!mongoose.isValidObjectId(target)) {
      return res.status(400).json({ error: "Invalid userId" });
    }
    if (me.toString() === target.toString()) {
      return res.status(400).json({ error: "You cannot friend yourself" });
    }

    // Ensure target exists
    const exists = await User.exists({ _id: target });
    if (!exists) return res.status(404).json({ error: "User not found" });

    const participants = pair(me, target);
    const existing = await Friendship.findOne({ participants });

    if (existing) {
      if (existing.status === "accepted") {
        return res.status(409).json({ error: "You are already friends" });
      }
      if (existing.status === "pending") {
        return res.status(409).json({ error: "Request already pending" });
      }
      // If previously rejected → allow re-request by flipping back to pending
      existing.status = "pending";
      existing.requester = me;
      await existing.save();
      return res.json({ message: "Friend request re-sent", request: existing });
    }

    const created = await Friendship.create({
      participants,
      requester: me,
      status: "pending",
    });

    return res.status(201).json({ message: "Friend request sent", request: created });
  } catch (err) {
    console.error("SEND_FRIEND_REQUEST_ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

/**
 * POST /api/friends/accept/:requestId
 * Accept a pending friend request (only the recipient can accept)
 */
async function acceptRequest(req, res) {
  try {
    const me = req.user.id;
    const { requestId } = req.params;

    if (!mongoose.isValidObjectId(requestId)) {
      return res.status(400).json({ error: "Invalid request id" });
    }

    const fr = await Friendship.findById(requestId);
    if (!fr) return res.status(404).json({ error: "Request not found" });
    if (fr.status !== "pending") return res.status(400).json({ error: "Request is not pending" });

    // Identify the recipient (the participant who is NOT the requester)
    const [a, b] = fr.participants.map(String);
    const recipient = a === String(fr.requester) ? b : a;

    if (String(me) !== String(recipient)) {
      return res.status(403).json({ error: "Only the recipient can accept this request" });
    }

    fr.status = "accepted";
    await fr.save();
    return res.json({ message: "Friend request accepted", friendship: fr });
  } catch (err) {
    console.error("ACCEPT_REQUEST_ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

/**
 * POST /api/friends/reject/:requestId
 * Reject a pending friend request (only the recipient can reject)
 */
async function rejectRequest(req, res) {
  try {
    const me = req.user.id;
    const { requestId } = req.params;

    if (!mongoose.isValidObjectId(requestId)) {
      return res.status(400).json({ error: "Invalid request id" });
    }

    const fr = await Friendship.findById(requestId);
    if (!fr) return res.status(404).json({ error: "Request not found" });
    if (fr.status !== "pending") return res.status(400).json({ error: "Request is not pending" });

    const [a, b] = fr.participants.map(String);
    const recipient = a === String(fr.requester) ? b : a;

    if (String(me) !== String(recipient)) {
      return res.status(403).json({ error: "Only the recipient can reject this request" });
    }

    fr.status = "rejected";
    await fr.save();
    return res.json({ message: "Friend request rejected", request: fr });
  } catch (err) {
    console.error("REJECT_REQUEST_ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

/**
 * DELETE /api/friends/remove/:userId
 * Remove an existing friendship (either party can remove)
 */
async function removeFriend(req, res) {
  try {
    const me = req.user.id;
    const target = req.params.userId;

    if (!mongoose.isValidObjectId(target)) {
      return res.status(400).json({ error: "Invalid userId" });
    }

    const participants = pair(me, target);
    const fr = await Friendship.findOne({ participants });
    if (!fr) return res.status(404).json({ error: "No relationship found" });

    await Friendship.deleteOne({ _id: fr._id });
    return res.json({ message: "Relationship removed" });
  } catch (err) {
    console.error("REMOVE_FRIEND_ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

/**
 * GET /api/friends/list
 * List accepted friends for the authenticated user
 */
async function listFriends(req, res) {
  try {
    const me = req.user.id.toString();

    // All edges where I'm a participant and status is accepted
    const edges = await Friendship.find({
      participants: me,
      status: "accepted",
    }).lean();

    const friendIds = edges.map((e) => {
      const [a, b] = e.participants.map(String);
      return a === me ? b : a;
    });

    const friends = await User.find({ _id: { $in: friendIds } })
      .select("_id username name avatarUrl") // ✅ your User schema uses avatarUrl
      .lean();

    return res.json({ friends });
  } catch (err) {
    console.error("LIST_FRIENDS_ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

/**
 * GET /api/friends/requests
 * List pending requests split into incoming vs outgoing for the authenticated user
 */
async function listRequests(req, res) {
  try {
    const me = req.user.id.toString();
    const pending = await Friendship.find({ status: "pending", participants: me }).lean();

    const incoming = [];
    const outgoing = [];

    for (const fr of pending) {
      const [a, b] = fr.participants.map(String);
      const other = a === me ? b : a;

      if (String(fr.requester) === me) {
        // I sent it → outgoing
        outgoing.push({
          _id: fr._id,
          otherUserId: other,
          status: fr.status,
          createdAt: fr.createdAt,
          updatedAt: fr.updatedAt,
        });
      } else {
        // I received it → incoming
        incoming.push({
          _id: fr._id,
          otherUserId: other,
          status: fr.status,
          createdAt: fr.createdAt,
          updatedAt: fr.updatedAt,
        });
      }
    }

    return res.json({ incoming, outgoing });
  } catch (err) {
    console.error("LIST_REQUESTS_ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

module.exports = {
  sendFriendRequest,
  acceptRequest,
  rejectRequest,
  removeFriend,
  listFriends,
  listRequests,
};
