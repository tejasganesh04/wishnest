// backend/src/controllers/friend.controller.js
// Core actions: request, accept, reject, remove, list, list pending

const mongoose = require("mongoose");
const { Friendship } = require("../models/friendship.model");
const { User } = require("../models/user.model"); // adjust path if needed

function pair(a, b) {
  return [a.toString(), b.toString()].sort();
}

async function sendFriendRequest(req, res) {
  try {
    const me = req.user._id;
    const target = req.params.userId;

    if (!mongoose.isValidObjectId(target)) {
      return res.status(400).json({ error: "Invalid userId" });
    }
    if (me.toString() === target.toString()) {
      return res.status(400).json({ error: "You cannot friend yourself" });
    }

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
      // rejected → allow re-request
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
    console.error("sendFriendRequest error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

async function acceptRequest(req, res) {
  try {
    const me = req.user._id;
    const { requestId } = req.params;

    const fr = await Friendship.findById(requestId);
    if (!fr) return res.status(404).json({ error: "Request not found" });
    if (fr.status !== "pending") return res.status(400).json({ error: "Not pending" });

    const [a, b] = fr.participants.map(String);
    const recipient = a === String(fr.requester) ? b : a;

    if (String(me) !== String(recipient)) {
      return res.status(403).json({ error: "Only the recipient can accept this request" });
    }

    fr.status = "accepted";
    await fr.save();
    return res.json({ message: "Friend request accepted", friendship: fr });
  } catch (err) {
    console.error("acceptRequest error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

async function rejectRequest(req, res) {
  try {
    const me = req.user._id;
    const { requestId } = req.params;

    const fr = await Friendship.findById(requestId);
    if (!fr) return res.status(404).json({ error: "Request not found" });
    if (fr.status !== "pending") return res.status(400).json({ error: "Not pending" });

    const [a, b] = fr.participants.map(String);
    const recipient = a === String(fr.requester) ? b : a;

    if (String(me) !== String(recipient)) {
      return res.status(403).json({ error: "Only the recipient can reject this request" });
    }

    fr.status = "rejected";
    await fr.save();
    return res.json({ message: "Friend request rejected", request: fr });
  } catch (err) {
    console.error("rejectRequest error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

async function removeFriend(req, res) {
  try {
    const me = req.user._id;
    const target = req.params.userId;

    const participants = pair(me, target);
    const fr = await Friendship.findOne({ participants });
    if (!fr) return res.status(404).json({ error: "No relationship found" });

    await Friendship.deleteOne({ _id: fr._id });
    return res.json({ message: "Relationship removed" });
  } catch (err) {
    console.error("removeFriend error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

async function listFriends(req, res) {
  try {
    const me = req.user._id.toString();

    const edges = await Friendship.find({
      participants: me,
      status: "accepted",
    }).lean();

    const friendIds = edges.map((e) => {
      const [a, b] = e.participants.map(String);
      return a === me ? b : a;
    });

    const friends = await User.find({ _id: { $in: friendIds } })
      .select("_id username name avatar")
      .lean();

    return res.json({ friends });
  } catch (err) {
    console.error("listFriends error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

async function listRequests(req, res) {
  try {
    const me = req.user._id.toString();
    const pending = await Friendship.find({ status: "pending", participants: me }).lean();

    const incoming = [];
    const outgoing = [];

    for (const fr of pending) {
      const [a, b] = fr.participants.map(String);
      const other = a === me ? b : a;

      if (String(fr.requester) === me) {
        outgoing.push({ ...fr, otherUserId: other });
      } else {
        incoming.push({ ...fr, otherUserId: other });
      }
    }

    return res.json({ incoming, outgoing });
  } catch (err) {
    console.error("listRequests error:", err);
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
