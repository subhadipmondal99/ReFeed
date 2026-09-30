import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ArrowRight,
  Loader2,
  Leaf,
} from "lucide-react";

import { loginUser } from "../firebase/auth";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");

    // Basic validation
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    try {
      setLoading(true);

      // Firebase login
      await loginUser(email.trim(), password);

      // Login successful
      navigate("/dashboard");
    } catch (error) {
      console.error("Login error:", error);

      switch (error.code) {
        case "auth/invalid-credential":
          setError("Invalid email or password.");
          break;

        case "auth/user-not-found":
          setError("No account was found with this email.");
          break;

        case "auth/wrong-password":
          setError("Incorrect password.");
          break;

        case "auth/invalid-email":
          setError("Please enter a valid email address.");
          break;

        case "auth/user-disabled":
          setError(
            "This account has been disabled. Please contact support."
          );
          break;

        case "auth/too-many-requests":
          setError(
            "Too many login attempts. Please try again later."
          );
          break;

        case "auth/network-request-failed":
          setError(
            "Network error. Please check your internet connection."
          );
          break;

        default:
          setError("Unable to sign in. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 flex items-center justify-center px-4">

      <div className="w-full max-w-md">

        {/* ============================= */}
        {/* LOGO / BRAND */}
        {/* ============================= */}

        <div className="text-center mb-8">

          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-600 text-white shadow-lg mb-4">
            <Leaf size={32} />
          </div>

          <h1 className="text-3xl font-bold text-gray-900">
            MealRescue
          </h1>

          <p className="text-gray-500 mt-2">
            Predict. Prepare. Rescue.
          </p>

        </div>

        {/* ============================= */}
        {/* LOGIN CARD */}
        {/* ============================= */}

        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">

          {/* Heading */}

          <div className="mb-7">

            <h2 className="text-2xl font-bold text-gray-900">
              Welcome back
            </h2>

            <p className="text-gray-500 mt-1">
              Sign in to your MealRescue account
            </p>

          </div>

          {/* ============================= */}
          {/* ERROR MESSAGE */}
          {/* ============================= */}

          {error && (
            <div
              role="alert"
              className="mb-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {/* ============================= */}
          {/* LOGIN FORM */}
          {/* ============================= */}

          <form
            onSubmit={handleLogin}
            className="space-y-5"
          >

            {/* ============================= */}
            {/* EMAIL */}
            {/* ============================= */}

            <div>

              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email address
              </label>

              <div className="relative">

                <Mail
                  size={20}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  id="email"
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={loading}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3.5 pl-12 pr-4 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-70"
                />

              </div>

            </div>

            {/* ============================= */}
            {/* PASSWORD */}
            {/* ============================= */}

            <div>

              <div className="flex items-center justify-between mb-2">

                <label
                  htmlFor="password"
                  className="text-sm font-medium text-gray-700"
                >
                  Password
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    alert(
                      "Password reset will be added next."
                    );
                  }}
                  className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
                >
                  Forgot password?
                </button>

              </div>

              <div className="relative">

                <LockKeyhole
                  size={20}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={loading}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3.5 pl-12 pr-12 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-70"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  disabled={loading}
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
                >
                  {showPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>

              </div>

            </div>

            {/* ============================= */}
            {/* SIGN IN BUTTON */}
            {/* ============================= */}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 font-semibold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
            >

              {loading ? (
                <>
                  <Loader2
                    size={20}
                    className="animate-spin"
                  />

                  Signing in...
                </>
              ) : (
                <>
                  Sign in

                  <ArrowRight size={20} />
                </>
              )}

            </button>

          </form>

          {/* ============================= */}
          {/* SIGN UP */}
          {/* ============================= */}

          <div className="mt-7 text-center text-sm">

            <span className="text-gray-500">
              Don't have an account?{" "}
            </span>

            <Link
              to="/signup"
              className="font-semibold text-emerald-600 hover:text-emerald-700"
            >
              Create account
            </Link>

          </div>

          {/* ============================= */}
          {/* BACK TO HOME */}
          {/* ============================= */}

          <div className="mt-4 text-center">

            <Link
              to="/"
              className="text-sm text-gray-400 hover:text-emerald-600"
            >
              ← Back to home
            </Link>

          </div>

        </div>

        {/* ============================= */}
        {/* FOOTER */}
        {/* ============================= */}

        <p className="text-center text-xs text-gray-400 mt-6">
          © 2026 MealRescue • Campus Food Waste Prevention
        </p>

      </div>

    </div>
  );
}