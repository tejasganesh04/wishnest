// src/lib/api.js
// Purpose: Centralized Axios instance with request/response interceptors.
// - Reads base URL from Vite env (VITE_API_URL)
// - Auto-attaches JWT from localStorage to every request
// - Handles common auth/server errors in one place

import axios from "axios";

// 🔧 Create a reusable Axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // e.g., http://localhost:8000 or http://localhost:8000/api
  withCredentials: false,                // set to true ONLY if you actually use cookies/sessions
  timeout: 10000,                        // 10s safety timeout
  headers: {
    "Content-Type": "application/json",  // send JSON by default
    Accept: "application/json",
  },
});

// (Optional) Sanity check for missing env during dev
if (import.meta.env.DEV && !import.meta.env.VITE_API_URL) {
  // eslint-disable-next-line no-console
  console.warn(
    "[api] VITE_API_URL is missing. Add it to /frontend/wishhaven/.env and restart Vite."
  );
}

/* ---------------------------
   REQUEST INTERCEPTOR
   - Runs before every request.
   - Attaches Authorization: Bearer <jwt> if present.
----------------------------*/
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("jwt"); // we store token after login
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config; // must return config or request won't proceed
  },
  (error) => {
    console.error("❌ [api] Request error:", error);
    return Promise.reject(error);
  }
);

/* ---------------------------
   RESPONSE INTERCEPTOR
   - Runs for every response (success or error).
   - Centralizes auth error handling (401/403) and server errors (5xx).
----------------------------*/
api.interceptors.response.use(
  // ✅ Pass through successful responses
  (response) => response,

  // ❌ Normalize/handle errors
  (error) => {
    // If server responded with a status code
    if (error?.response) {
      const { status, data, config } = error.response;

      // 🔐 Unauthorized → token expired/invalid
      if (status === 401) {
        console.warn("⚠️ [api] 401 Unauthorized — clearing token.");
        localStorage.removeItem("jwt");

        // Optional: redirect to login if you're not already there
        // if (window.location.pathname !== "/login") window.location.href = "/login";
      }

      // 🚫 Forbidden → user lacks access rights
      else if (status === 403) {
        console.warn("⚠️ [api] 403 Forbidden — access denied.", { url: config?.url });
      }

      // 💥 Server errors
      else if (status >= 500) {
        console.error("💥 [api] Server error:", { status, url: config?.url, data });
      }
    } else {
      // No response (network down, CORS blocked, timeout, etc.)
      console.error("🚫 [api] Network/No response:", error?.message || error);
    }

    return Promise.reject(error);
  }
);

export default api;
