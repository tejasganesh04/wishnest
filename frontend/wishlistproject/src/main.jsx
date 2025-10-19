
// src/main.jsx
// Purpose: Root entry point with routing + toast notifications setup.

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./index.css";

import App from "./App.jsx";
import Login from "./pages/Login.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/login" element={<Login />} />
      </Routes>

      {/* Global toast container */}
      <ToastContainer
        position="top-center"
        autoClose={2500}
        theme="colored"
        pauseOnHover
      />
    </BrowserRouter>
  </React.StrictMode>
);
