// seed.js
// Purpose: Populate MongoDB with sample WishNest data.
// Usage: node seed.js
// Prereqs: npm i mongoose bcrypt jsonwebtoken dotenv (if models aren't available here, this uses in-file schemas).

/* ----------------------------- Configuration ----------------------------- */
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/wishnest";
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";
const DEFAULT_PASSWORD = "Passw0rd!";

/* --------------------------------- Setup -------------------------------- */
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

/* ------------------------------- Schemas -------------------------------- */
// NOTE: If you already have separate model files, prefer importing them instead.
// I'm defining minimal versions to keep this seed file standalone.
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
}, { timestamps: true });

const wishlistSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true }, // single wishlist per user
  title: { type: String, default: "My Wishlist" },
  description: { type: String, default: "" }
}, { timestamps: true });

const itemSchema = new mongoose.Schema({
  wishlist: { type: mongoose.Schema.Types.ObjectId, ref: "Wishlist", required: true },
  title: { type: String, required: true },
  link: { type: String },
  price: { type: Number },
  priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
  notes: { type: String, default: "" },
  isReserved: { type: Boolean, default: false },
  reservedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }
}, { timestamps: true });

const User = mongoose.model("User", userSchema);
const Wishlist = mongoose.model("Wishlist", wishlistSchema);
const Item = mongoose.model("Item", itemSchema);

/* ------------------------------- Helpers -------------------------------- */
async function ensureUser({ name, email }) {
  // Find or create user with a hashed password.
  let user = await User.findOne({ email });
  if (!user) {
    const hash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    user = await User.create({ name, email, password: hash });
    console.log("Created user:", email);
  } else {
    console.log("User exists:", email);
  }
  return user;
}

async function ensureWishlist(owner, title, description) {
  // One wishlist per user (unique: owner)
  let wl = await Wishlist.findOne({ owner: owner._id });
  if (!wl) {
    wl = await Wishlist.create({ owner: owner._id, title, description });
    console.log("Created wishlist for:", owner.email);
  } else {
    console.log("Wishlist exists for:", owner.email);
  }
  return wl;
}

async function addItem(wishlist, data) {
  const item = await Item.create({ ...data, wishlist: wishlist._id });
  console.log(" + Item:", item.title);
  return item;
}

/* --------------------------------- Main --------------------------------- */
(async function main() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected:", MONGO_URI);

    // Sample users
    const tejas = await ensureUser({ name: "Tejas Ganesh", email: "tejas@example.com" });
    const friend = await ensureUser({ name: "Friend Contributor", email: "friend@example.com" });

    // Wishlists
    const tejasWL = await ensureWishlist(tejas, "Tejas' Wishlist", "Things I want or need this year");

    // Items (mix of reserved/unreserved)
    await addItem(tejasWL, {
      title: "Kindle Paperwhite",
      link: "https://example.com/kindle",
      price: 13999,
      priority: "medium",
      notes: "Prefer 16GB version",
      isReserved: false
    });

    await addItem(tejasWL, {
      title: "Noise-Cancelling Headphones",
      link: "https://example.com/headphones",
      price: 12999,
      priority: "high",
      notes: "Prefer black color",
      isReserved: true,
      reservedBy: friend._id
    });

    await addItem(tejasWL, {
      title: "Running Shoes",
      link: "https://example.com/shoes",
      price: 5999,
      priority: "low",
      notes: "EU size 43",
      isReserved: false
    });

    console.log("\nSeed complete. Credentials:");
    console.log(" - tejas@example.com / " + DEFAULT_PASSWORD);
    console.log(" - friend@example.com / " + DEFAULT_PASSWORD);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
