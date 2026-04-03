import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/appStore";

// Pages
import { LandingPage } from "./pages/LandingPage";
import { LoginPage, RegisterPage } from "./pages/AuthPages";
import { DashboardPage } from "./pages/DashboardPage";
import EditorPage from "./pages/EditorPage";

// Access Control Route Component - prevents redirects, shows unauthorized state
const AccessControlRoute = ({ children, requiresAuth = true }) => {
  const { user } = useAuthStore();
  
  if (requiresAuth && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-800 rounded-lg shadow-2xl border border-slate-700 p-8 text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">🔒 Access Denied</h1>
          <p className="text-slate-400 mb-6">You need to be logged in to access this page.</p>
          <a 
            href="/login" 
            className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded transition"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }
  
  return children;
};

/**
 * Main App Component - Hypixel Housing HTSL Editor
 * 
 * Features:
 * - Landing page with authentication
 * - Account-based house management
 * - Visual + code editor with two-way sync
 * - Auto-save to Cloudflare storage
 */
function App() {
  const { checkAuth } = useAuthStore();

  // Check authentication status on app load
  useEffect(() => {
    checkAuth();
  }, []); // Empty dependency array - run only once

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <AccessControlRoute>
              <DashboardPage />
            </AccessControlRoute>
          }
        />
        <Route
          path="/editor/:houseId"
          element={
            <AccessControlRoute>
              <EditorPage />
            </AccessControlRoute>
          }
        />

        {/* Catch-all redirect to landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
