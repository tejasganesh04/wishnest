// backend/src/models/friendship.model.js
// Represents a friendship edge between two users (A <-> B)
// One doc per pair (unique index on sorted participants)

const mongoose = require("mongoose");
const { Schema } = mongoose;

const FriendshipSchema = new Schema(
  {
    participants: {
      type: [Schema.Types.ObjectId],
      ref: "User",
      required: true,
      validate: {
        validator: (arr) =>
          Array.isArray(arr) && arr.length === 2 && arr[0].toString() !== arr[1].toString(),
        message: "participants must be two distinct user ids",
      },
    },
    requester: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// Always store participants in ascending string order
FriendshipSchema.pre("validate", function (next) {
  if (Array.isArray(this.participants) && this.participants.length === 2) {
    const [a, b] = this.participants.map((x) => x.toString()).sort();
    this.participants = [a, b];
  }
  next();
});

FriendshipSchema.index({ participants: 1 }, { unique: true });

const Friendship = mongoose.model("Friendship", FriendshipSchema);
module.exports = { Friendship };
