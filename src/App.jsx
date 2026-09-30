import { Navigate, Route, Routes } from "react-router-dom";

import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Dashboard from "./pages/Dashboard.jsx";

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

        <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-gray-500">
          AI-powered campus food waste prevention
          and food rescue platform.
        </p>

        {/* Buttons */}
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">

          <a
            href="/login"
            className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-7 py-3.5 font-semibold text-white shadow-lg transition hover:bg-emerald-700"
          >
            Login
          </a>

          <a
            href="/signup"
            className="inline-flex items-center justify-center rounded-xl border border-emerald-600 bg-white px-7 py-3.5 font-semibold text-emerald-700 transition hover:bg-emerald-50"
          >
            Create Account
          </a>

        </div>

      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>

      {/* Landing page */}
      <Route
        path="/"
        element={<LandingPage />}
      />

      {/* Authentication */}
      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/signup"
        element={<Signup />}
      />

      {/* Main application */}
      <Route
        path="/dashboard"
        element={<Dashboard />}
      />

      {/* Unknown URL */}
      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />

    </Routes>
  );
}