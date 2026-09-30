import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  LockKeyhole,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  Leaf,
  Users,
} from "lucide-react";

import { registerUser } from "../firebase/auth";

export default function Signup() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    userType: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    setError("");

    const {
      name,
      email,
      phone,
      password,
      confirmPassword,
      userType,
    } = formData;

    // Basic validation
    if (
      !name.trim() ||
      !email.trim() ||
      !phone.trim() ||
      !password ||
      !confirmPassword ||
      !userType
    ) {
      setError("Please fill in all fields.");
      return;
    }

    // Phone validation
    const phoneRegex = /^[0-9]{10}$/;

    if (!phoneRegex.test(phone)) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }

    // Password validation
    if (password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    // Confirm password
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      await registerUser({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        userType,
      });

      // Registration successful
      navigate("/dashboard");
    } catch (error) {
      console.error("Signup error:", error);

      switch (error.code) {
        case "auth/email-already-in-use":
          setError("An account already exists with this email.");
          break;

        case "auth/invalid-email":
          setError("Please enter a valid email address.");
          break;

        case "auth/weak-password":
          setError("Password is too weak.");
          break;

        default:
          setError("Unable to create account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 flex items-center justify-center px-4 py-10">

      <div className="w-full max-w-lg">

        {/* Logo */}
        <div className="text-center mb-7">

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

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-7 sm:p-8">

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Create your account
            </h2>

            <p className="text-gray-500 mt-1">
              Join the MealRescue platform
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full name
              </label>

              <div className="relative">

                <User
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  autoComplete="name"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3.5 pl-12 pr-4 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />

              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email address
              </label>

              <div className="relative">

                <Mail
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3.5 pl-12 pr-4 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />

              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone number
              </label>

              <div className="relative">

                <Phone
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="10-digit phone number"
                  maxLength="10"
                  autoComplete="tel"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3.5 pl-12 pr-4 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />

              </div>
            </div>

            {/* User Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                I am joining as
              </label>

              <div className="relative">

                <Users
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />

                <select
                  name="userType"
                  value={formData.userType}
                  onChange={handleChange}
                  className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 py-3.5 pl-12 pr-10 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 text-gray-700"
                >
                  <option value="">
                    Select your role
                  </option>

                  <option value="canteen_manager">
                    Canteen Manager
                  </option>

                  <option value="ngo_partner">
                    NGO Partner
                  </option>

                  <option value="admin">
                    Admin
                  </option>
                </select>

                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                  ▼
                </span>

              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>

              <div className="relative">

                <LockKeyhole
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Minimum 6 characters"
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3.5 pl-12 pr-12 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>

              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm password
              </label>

              <div className="relative">

                <LockKeyhole
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3.5 pl-12 pr-12 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>

              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 font-semibold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create account
                  <ArrowRight size={20} />
                </>
              )}
            </button>

          </form>

          {/* Login link */}
          <div className="mt-6 text-center text-sm">

            <span className="text-gray-500">
              Already have an account?{" "}
            </span>

            <Link
              to="/login"
              className="font-semibold text-emerald-600 hover:text-emerald-700"
            >
              Sign in
            </Link>

          </div>

          <div className="mt-4 text-center">

            <Link
              to="/"
              className="text-sm text-gray-400 hover:text-emerald-600"
            >
              ← Back to home
            </Link>

          </div>

        </div>

        <p className="text-center text-xs text-gray-400 mt-5">
          © 2026 MealRescue • Campus Food Waste Prevention
        </p>

      </div>

    </div>
  );
}