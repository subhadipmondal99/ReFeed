import { Navigate, Route, Routes } from "react-router-dom";

import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Signup from "./pages/Signup.jsx";

// Temporary landing page
// Your friend can replace this later with the actual LandingPage.
function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 flex items-center justify-center px-6">
      <div className="text-center">

        {/* Logo */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-600 text-4xl text-white shadow-lg">
          🌱
        </div>

        {/* Brand */}
        <h1 className="text-5xl font-bold text-emerald-700">
          MealRescue
        </h1>

        <p className="mt-3 text-lg text-gray-600">
          Predict. Prepare. Rescue.
        </p>

        {/* Description */}
        <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-gray-500">
          AI-powered campus food waste prevention and food rescue platform.
        </p>

        {/* Login button */}
        <div className="mt-8">
          <a
            href="/login"
            className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-7 py-3.5 font-semibold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700"
          >
            Get Started →
          </a>
        </div>

      </div>
    </div>
  );
}

export default function App() {
  return (
   <Routes>

  <Route
    path="/"
    element={<LandingPage />}
  />

  <Route
    path="/login"
    element={<Login />}
  />

  <Route
    path="/signup"
    element={<Signup />}
  />

  <Route
    path="/dashboard"
    element={<Dashboard />}
  />

  <Route
    path="*"
    element={<Navigate to="/" replace />}
  />

</Routes>
  );
}