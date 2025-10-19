// src/pages/Login.jsx
// Purpose: Real login form that calls /auth/login and stores JWT token.

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../lib/api";

export default function Login() {
  // ----- local state for inputs -----
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // ----- handle login submit -----
  const handleLogin = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!emailOrUsername.trim() || !password.trim()) {
      toast.warn("Please enter all fields");
      return;
    }

    setLoading(true);
    try {
      // Send credentials to backend
      const res = await api.post("/auth/login", {
        emailOrUsername,
        password,
      });

      // Extract token
      const token = res.data.token;
      localStorage.setItem("jwt", token);

      toast.success("Login successful 🎉");
      setTimeout(() => navigate("/"), 1000); // Redirect after success
    } catch (err) {
      console.error("LOGIN_ERROR:", err);
      const msg =
        err.response?.data?.error ||
        "Something went wrong. Please try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // ----- JSX -----
  return (
    <div className="min-h-screen grid place-items-center bg-gray-50">
      <form
        onSubmit={handleLogin}
        className="bg-white shadow-md rounded-xl p-8 w-full max-w-md"
      >
        <h1 className="text-2xl font-semibold text-center mb-6 text-gray-800">
          Sign in to WishNest
        </h1>

        {/* Username / Email */}
        <div className="mb-4">
          <label className="block text-gray-600 text-sm mb-2">
            Email or Username
          </label>
          <input
            type="text"
            value={emailOrUsername}
            onChange={(e) => setEmailOrUsername(e.target.value)}
            placeholder="tejas@example.com"
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        {/* Password */}
        <div className="mb-6">
          <label className="block text-gray-600 text-sm mb-2">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-2 px-4 rounded-md transition ${
            loading ? "opacity-70 cursor-not-allowed" : ""
          }`}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="text-sm text-center text-gray-500 mt-4">
          Don’t have an account yet?{" "}
          <span className="text-indigo-600 cursor-pointer">
            (Signup page coming soon)
          </span>
        </p>
      </form>
    </div>
  );
}
