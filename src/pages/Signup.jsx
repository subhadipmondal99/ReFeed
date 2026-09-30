import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BrainCircuit,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Leaf,
  LockKeyhole,
  Mail,
  Phone,
  Recycle,
  ShieldCheck,
  Sparkles,
  Users,
  ChefHat,
  HeartHandshake,
  Utensils,
  UserRound,
} from "lucide-react";

import { registerUser } from "../firebase/auth";
import "./Signup.css";

export default function Signup() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    userType: "canteen",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const updateField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setFieldErrors((previous) => ({
      ...previous,
      [field]: "",
    }));

    setError("");
  };

  const validateForm = () => {
    const errors = {};

    if (!form.name.trim()) {
      errors.name = "Full name is required.";
    } else if (form.name.trim().length < 2) {
      errors.name = "Please enter your full name.";
    }

    if (!form.email.trim()) {
      errors.email = "Email address is required.";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        form.email.trim()
      )
    ) {
      errors.email = "Please enter a valid email.";
    }

    if (!form.phone.trim()) {
      errors.phone = "Phone number is required.";
    } else if (
      !/^[+]?[0-9\s-]{10,15}$/.test(
        form.phone.trim()
      )
    ) {
      errors.phone = "Please enter a valid phone number.";
    }

    if (!form.password) {
      errors.password = "Password is required.";
    } else if (form.password.length < 6) {
      errors.password =
        "Password must contain at least 6 characters.";
    }

    if (!form.confirmPassword) {
      errors.confirmPassword =
        "Please confirm your password.";
    } else if (
      form.password !== form.confirmPassword
    ) {
      errors.confirmPassword =
        "Passwords do not match.";
    }

    setFieldErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading || success) return;

    if (!validateForm()) return;

    setLoading(true);
    setError("");

    try {
      await registerUser({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        userType: form.userType,
      });

      setSuccess(true);

      setTimeout(() => {
        navigate("/dashboard");
      }, 900);
    } catch (err) {
      console.error("Signup error:", err);

      let message =
        "Unable to create your account. Please try again.";

      if (err?.code === "auth/email-already-in-use") {
        message =
          "An account already exists with this email.";
      } else if (err?.code === "auth/invalid-email") {
        message = "Please enter a valid email address.";
      } else if (err?.code === "auth/weak-password") {
        message =
          "Password is too weak. Please choose a stronger password.";
      } else if (
        err?.code === "auth/network-request-failed"
      ) {
        message =
          "Network error. Please check your internet connection.";
      }

      setError(message);
      setLoading(false);
    }
  };

  const passwordStrength = (() => {
    const password = form.password;

    if (!password) {
      return {
        level: 0,
        label: "Enter a password",
      };
    }

    let score = 0;

    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) {
      return {
        level: 1,
        label: "Weak",
      };
    }

    if (score <= 3) {
      return {
        level: 2,
        label: "Good",
      };
    }

    return {
      level: 3,
      label: "Strong",
    };
  })();

  return (
    <main className="signup-page">
      {/* =====================================================
          LEFT CINEMATIC PANEL
      ====================================================== */}

      <section className="signup-visual">
        <div className="signup-glow signup-glow-one" />
        <div className="signup-glow signup-glow-two" />
        <div className="signup-glow signup-glow-three" />

        <div className="signup-grid" />

        {/* Decorative particles */}
        <span className="signup-particle p1" />
        <span className="signup-particle p2" />
        <span className="signup-particle p3" />
        <span className="signup-particle p4" />
        <span className="signup-particle p5" />

        <div className="signup-visual-inner">
          {/* BRAND */}
          <header className="signup-brand">
            <div className="signup-brand-logo">
              <img
                src="/logo.png"
                alt="ReFeed logo"
              />
            </div>

            <div>
              <strong>ReFeed</strong>
              <span>Smart Food. Zero Waste.</span>
            </div>
          </header>

          {/* HERO */}
          <div className="signup-hero">
            <div className="signup-ai-pill">
              <span>
                <Sparkles size={13} />
              </span>

              BUILD A SMARTER CAMPUS
            </div>

            <h1>
              Join the
              <br />
              <em>Food Rescue</em>
              <br />
              Movement.
            </h1>

            <p>
              Create your ReFeed account and help turn
              everyday campus meals into measurable
              environmental and social impact.
            </p>
          </div>

          {/* IMPACT FLOW */}
          <div className="signup-flow">
            <div className="flow-card active">
              <div className="flow-icon">
                <BrainCircuit size={18} />
              </div>

              <div>
                <span>01</span>
                <strong>Predict</strong>
                <small>Demand with AI</small>
              </div>
            </div>

            <div className="flow-line">
              <i />
            </div>

            <div className="flow-card">
              <div className="flow-icon">
                <ChefHat size={18} />
              </div>

              <div>
                <span>02</span>
                <strong>Prepare</strong>
                <small>Only what matters</small>
              </div>
            </div>

            <div className="flow-line">
              <i />
            </div>

            <div className="flow-card">
              <div className="flow-icon">
                <HeartHandshake size={18} />
              </div>

              <div>
                <span>03</span>
                <strong>Rescue</strong>
                <small>Feed communities</small>
              </div>
            </div>
          </div>

          {/* IMPACT STATISTICS */}
          <div className="impact-strip">
            <div className="impact-stat">
              <div className="impact-stat-icon">
                <Utensils size={17} />
              </div>

              <div>
                <strong>626+</strong>
                <span>Meals planned</span>
              </div>
            </div>

            <div className="impact-divider" />

            <div className="impact-stat">
              <div className="impact-stat-icon">
                <Recycle size={17} />
              </div>

              <div>
                <strong>40%</strong>
                <span>Waste reduction</span>
              </div>
            </div>

            <div className="impact-divider" />

            <div className="impact-stat">
              <div className="impact-stat-icon">
                <Users size={17} />
              </div>

              <div>
                <strong>18+</strong>
                <span>Meals rescued</span>
              </div>
            </div>
          </div>

          {/* QUOTE CARD */}
          <div className="signup-quote">
            <div className="quote-mark">“</div>

            <div>
              <p>
                Every meal saved is a meal that can
                reach someone who needs it.
              </p>

              <span>
                ReFeed • Predict • Reduce • Rescue
              </span>
            </div>

            <Leaf size={23} />
          </div>

          {/* FOOTER */}
          <footer className="signup-visual-footer">
            <span>
              <i />
              Intelligent food management
            </span>

            <span>ReFeed © 2026</span>
          </footer>
        </div>
      </section>

      {/* =====================================================
          RIGHT SIGNUP PANEL
      ====================================================== */}

      <section className="signup-panel">
        <div className="signup-panel-glow one" />
        <div className="signup-panel-glow two" />

        <div className="signup-container">
          {/* MOBILE BRAND */}
          <div className="signup-mobile-brand">
            <div>
              <img
                src="/logo.png"
                alt="ReFeed"
              />
            </div>

            <span>
              <strong>ReFeed</strong>
              Smart Food. Zero Waste.
            </span>
          </div>

          {/* SIGNUP CARD */}
          <div className="signup-card">
            {/* HEADER */}
            <div className="signup-heading">
              <div className="signup-heading-icon">
                <Sparkles size={18} />
              </div>

              <span className="signup-eyebrow">
                START YOUR JOURNEY
              </span>

              <h2>Create Account</h2>

              <p>
                Join ReFeed and start making
                <br className="signup-desktop-break" />
                smarter food decisions.
              </p>
            </div>

            {/* PROGRESS */}
            <div className="signup-progress">
              <div className="progress-info">
                <span>ACCOUNT SETUP</span>
                <strong>Step 1 of 1</strong>
              </div>

              <div className="progress-track">
                <span />
              </div>
            </div>

            {/* ALERT */}
            {error && (
              <div className="signup-alert">
                <span>!</span>
                <p>{error}</p>
              </div>
            )}

            {/* SUCCESS */}
            {success && (
              <div className="signup-success">
                <div>
                  <Check size={15} />
                </div>

                <span>
                  Account created successfully.
                </span>
              </div>
            )}

            {/* FORM */}
            <form
              className="signup-form"
              onSubmit={handleSubmit}
              noValidate
            >
              {/* NAME */}
              <div className="signup-field">
                <label htmlFor="signup-name">
                  Full name
                </label>

                <div
                  className={`signup-input ${
                    fieldErrors.name
                      ? "invalid"
                      : ""
                  }`}
                >
                  <UserRound
                    size={17}
                    className="signup-input-icon"
                  />

                  <input
                    id="signup-name"
                    type="text"
                    value={form.name}
                    placeholder="Enter your full name"
                    autoComplete="name"
                    disabled={loading || success}
                    onChange={(event) =>
                      updateField(
                        "name",
                        event.target.value
                      )
                    }
                  />

                  {form.name &&
                    !fieldErrors.name && (
                      <CheckCircle2
                        size={15}
                        className="signup-valid"
                      />
                    )}
                </div>

                {fieldErrors.name && (
                  <span className="signup-field-error">
                    {fieldErrors.name}
                  </span>
                )}
              </div>

              {/* EMAIL + PHONE */}
              <div className="signup-two-fields">
                <div className="signup-field">
                  <label htmlFor="signup-email">
                    Email address
                  </label>

                  <div
                    className={`signup-input ${
                      fieldErrors.email
                        ? "invalid"
                        : ""
                    }`}
                  >
                    <Mail
                      size={17}
                      className="signup-input-icon"
                    />

                    <input
                      id="signup-email"
                      type="email"
                      value={form.email}
                      placeholder="you@example.com"
                      autoComplete="email"
                      disabled={loading || success}
                      onChange={(event) =>
                        updateField(
                          "email",
                          event.target.value
                        )
                      }
                    />

                    {form.email &&
                      !fieldErrors.email && (
                        <CheckCircle2
                          size={15}
                          className="signup-valid"
                        />
                      )}
                  </div>

                  {fieldErrors.email && (
                    <span className="signup-field-error">
                      {fieldErrors.email}
                    </span>
                  )}
                </div>

                <div className="signup-field">
                  <label htmlFor="signup-phone">
                    Phone number
                  </label>

                  <div
                    className={`signup-input ${
                      fieldErrors.phone
                        ? "invalid"
                        : ""
                    }`}
                  >
                    <Phone
                      size={17}
                      className="signup-input-icon"
                    />

                    <input
                      id="signup-phone"
                      type="tel"
                      value={form.phone}
                      placeholder="+91 XXXXX XXXXX"
                      autoComplete="tel"
                      disabled={loading || success}
                      onChange={(event) =>
                        updateField(
                          "phone",
                          event.target.value
                        )
                      }
                    />
                  </div>

                  {fieldErrors.phone && (
                    <span className="signup-field-error">
                      {fieldErrors.phone}
                    </span>
                  )}
                </div>
              </div>

              {/* USER TYPE */}
              <div className="signup-field">
                <label>Account type</label>

                <div className="role-grid">
                  <button
                    type="button"
                    className={`role-card ${
                      form.userType === "canteen"
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      updateField(
                        "userType",
                        "canteen"
                      )
                    }
                    disabled={loading || success}
                  >
                    <span className="role-icon">
                      <Utensils size={16} />
                    </span>

                    <span>
                      <strong>Canteen</strong>
                      <small>
                        Manage meals & forecasts
                      </small>
                    </span>

                    {form.userType ===
                      "canteen" && (
                      <CheckCircle2
                        size={15}
                        className="role-check"
                      />
                    )}
                  </button>

                  <button
                    type="button"
                    className={`role-card ${
                      form.userType === "ngo"
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      updateField(
                        "userType",
                        "ngo"
                      )
                    }
                    disabled={loading || success}
                  >
                    <span className="role-icon">
                      <HeartHandshake size={16} />
                    </span>

                    <span>
                      <strong>NGO</strong>
                      <small>
                        Rescue surplus food
                      </small>
                    </span>

                    {form.userType === "ngo" && (
                      <CheckCircle2
                        size={15}
                        className="role-check"
                      />
                    )}
                  </button>
                </div>
              </div>

              {/* PASSWORD */}
              <div className="signup-two-fields">
                <div className="signup-field">
                  <label htmlFor="signup-password">
                    Password
                  </label>

                  <div
                    className={`signup-input ${
                      fieldErrors.password
                        ? "invalid"
                        : ""
                    }`}
                  >
                    <LockKeyhole
                      size={17}
                      className="signup-input-icon"
                    />

                    <input
                      id="signup-password"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      value={form.password}
                      placeholder="Create password"
                      autoComplete="new-password"
                      disabled={loading || success}
                      onChange={(event) =>
                        updateField(
                          "password",
                          event.target.value
                        )
                      }
                    />

                    <button
                      type="button"
                      className="signup-eye"
                      onClick={() =>
                        setShowPassword(
                          (previous) => !previous
                        )
                      }
                      disabled={loading || success}
                    >
                      {showPassword ? (
                        <EyeOff size={17} />
                      ) : (
                        <Eye size={17} />
                      )}
                    </button>
                  </div>

                  {/* PASSWORD STRENGTH */}
                  {form.password && (
                    <div className="password-strength">
                      <div className="strength-bars">
                        <i
                          className={
                            passwordStrength.level >=
                            1
                              ? `active level-${passwordStrength.level}`
                              : ""
                          }
                        />
                        <i
                          className={
                            passwordStrength.level >=
                            2
                              ? `active level-${passwordStrength.level}`
                              : ""
                          }
                        />
                        <i
                          className={
                            passwordStrength.level >=
                            3
                              ? `active level-${passwordStrength.level}`
                              : ""
                          }
                        />
                      </div>

                      <span>
                        {passwordStrength.label}
                      </span>
                    </div>
                  )}

                  {fieldErrors.password && (
                    <span className="signup-field-error">
                      {fieldErrors.password}
                    </span>
                  )}
                </div>

                <div className="signup-field">
                  <label htmlFor="signup-confirm">
                    Confirm password
                  </label>

                  <div
                    className={`signup-input ${
                      fieldErrors.confirmPassword
                        ? "invalid"
                        : ""
                    }`}
                  >
                    <ShieldCheck
                      size={17}
                      className="signup-input-icon"
                    />

                    <input
                      id="signup-confirm"
                      type={
                        showConfirmPassword
                          ? "text"
                          : "password"
                      }
                      value={form.confirmPassword}
                      placeholder="Confirm password"
                      autoComplete="new-password"
                      disabled={loading || success}
                      onChange={(event) =>
                        updateField(
                          "confirmPassword",
                          event.target.value
                        )
                      }
                    />

                    <button
                      type="button"
                      className="signup-eye"
                      onClick={() =>
                        setShowConfirmPassword(
                          (previous) => !previous
                        )
                      }
                      disabled={loading || success}
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={17} />
                      ) : (
                        <Eye size={17} />
                      )}
                    </button>
                  </div>

                  {fieldErrors.confirmPassword && (
                    <span className="signup-field-error">
                      {fieldErrors.confirmPassword}
                    </span>
                  )}
                </div>
              </div>

              {/* TERMS */}
              <label className="terms">
                <span className="terms-checkbox">
                  <input
                    type="checkbox"
                    required
                    disabled={loading || success}
                  />

                  <span>
                    <Check size={11} />
                  </span>
                </span>

                <p>
                  I agree to the{" "}
                  <button type="button">
                    Terms of Service
                  </button>{" "}
                  and{" "}
                  <button type="button">
                    Privacy Policy
                  </button>
                  .
                </p>
              </label>

              {/* CREATE ACCOUNT */}
              <button
                type="submit"
                className={`create-account ${
                  loading ? "loading" : ""
                } ${success ? "success" : ""}`}
                disabled={loading || success}
              >
                {loading ? (
                  <>
                    <span className="signup-spinner" />
                    Creating account...
                  </>
                ) : success ? (
                  <>
                    <Check size={18} />
                    Account created
                  </>
                ) : (
                  <>
                    <span>Create Account</span>

                    <span className="create-arrow">
                      <ArrowRight size={18} />
                    </span>
                  </>
                )}
              </button>
            </form>

            {/* LOGIN LINK */}
            <div className="already-account">
              <span>Already have an account?</span>

              <Link to="/login">
                Login
                <ArrowRight size={14} />
              </Link>
            </div>

            {/* SECURITY */}
            <div className="signup-security">
              <LockKeyhole size={12} />
              <span>
                Your information is securely protected
              </span>
            </div>
          </div>

          <footer className="signup-panel-footer">
            <span>ReFeed</span>
            <i />
            <span>Predict • Reduce • Rescue</span>
          </footer>
        </div>
      </section>
    </main>
  );
}