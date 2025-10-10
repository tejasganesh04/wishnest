const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET ;
// ---------- SIGNUP ----------
exports.signup = async (req, res) => {
  try {
    const { name, username, email, password } = req.body;

    // 1️⃣ Basic field validation
    if (!name || !username || !email || !password)
      return res.status(400).json({ error: 'All fields required' });

    // 2️⃣ Username validation — disallow '@'
    if (username.includes('@'))
      return res.status(400).json({ error: 'Username cannot contain @ symbol' });

    // 3️⃣ Check if user already exists (email or username)
    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing)
      return res.status(409).json({ error: 'Email or username already exists' });

    // 4️⃣ Hash password and create new user
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, username, email, passwordHash });

    // 5️⃣ Generate JWT token
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });

    // 6️⃣ Send response (no passwordHash exposed)
    res.status(201).json({
      message: 'Signup successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};


// ---------- LOGIN ----------
// controllers/auth.controller.js (excerpt)

// -------------- LOGIN (signin) --------------
// Allows login with EITHER email OR username, plus password.
// Expects body:
// {
//   "emailOrUsername": "tejas" OR "tejas@example.com",
//   "password": "Passw0rd!"
// }
exports.login = async (req, res) => {
  try {
    // 1) Extract and sanity-trim inputs
    const rawId = (req.body.emailOrUsername || "").trim();
    const password = req.body.password || "";

    // 2) Basic presence validation
    if (!rawId || !password) {
      return res.status(400).json({ error: "Missing credentials" });
    }

    // 3) Normalize identifier:
    //    - If it's an email (has '@'), normalize to lowercase
    //    - If it's a username (no '@'), also normalize to lowercase
    //      (keeps lookups consistent even if user typed caps)
    const looksLikeEmail = rawId.includes("@");
    const identifier = rawId.toLowerCase();

    // 4) Build the MongoDB query dynamically based on identifier type
    const query = looksLikeEmail ? { email: identifier } : { username: identifier };

    // 5) Fetch the user (must include passwordHash to compare)
    //    Our schema stores the hash as "passwordHash", not "password".
    const user = await User.findOne(query);
    if (!user) {
      // Avoid leaking which field failed; keep error generic
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // 6) Compare provided password with stored hash
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // 7) Issue a JWT (header-based flow)
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });

    // 8) Respond with token + sanitized user (never send hash)
    return res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl ?? null,
      },
    });
  } catch (err) {
    console.error("LOGIN_ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
};
