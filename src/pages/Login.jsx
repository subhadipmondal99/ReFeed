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
  Recycle,
  Sparkles,
  Users,
  ChefHat,
  TrendingDown,
  Utensils,
} from "lucide-react";

import { loginUser } from "../firebase/auth";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const validateForm = () => {
    let valid = true;

    setEmailError("");
    setPasswordError("");
    setError("");

    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setEmailError("Email address is required.");
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setEmailError("Please enter a valid email address.");
      valid = false;
    }

    if (!password) {
      setPasswordError("Password is required.");
      valid = false;
    } else if (password.length < 6) {
      setPasswordError("Password must contain at least 6 characters.");
      valid = false;
    }

    return valid;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading || success) return;

    if (!validateForm()) return;

    setLoading(true);

    try {
      /*
       * EXISTING AUTHENTICATION
       * -----------------------
       * Do not replace this.
       */
      await loginUser(email.trim(), password);

      setSuccess(true);

      setTimeout(() => {
        navigate("/dashboard");
      }, 700);
    } catch (err) {
      console.error("Login error:", err);

      let message = "Unable to sign in. Please try again.";

      if (err?.code === "auth/invalid-credential") {
        message = "Incorrect email or password.";
      } else if (err?.code === "auth/user-not-found") {
        message = "No account was found with this email.";
      } else if (err?.code === "auth/wrong-password") {
        message = "Incorrect password.";
      } else if (err?.code === "auth/too-many-requests") {
        message =
          "Too many unsuccessful attempts. Please try again later.";
      } else if (err?.code === "auth/network-request-failed") {
        message =
          "Network error. Please check your internet connection.";
      }

      setError(message);
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setError(
      "Password reset is not configured yet. Please contact the administrator."
    );
  };

  const handleSocialLogin = (provider) => {
    setError(`${provider} sign-in is not configured yet.`);
  };

  return (
    <main className="login-page">
      {/* =====================================================
          LEFT EXPERIENCE
      ====================================================== */}

      <section className="login-visual">
        <div className="visual-glow visual-glow-1" />
        <div className="visual-glow visual-glow-2" />
        <div className="visual-glow visual-glow-3" />

        <div className="visual-grid" />

        <div className="visual-inner">
          {/* BRAND */}
          <header className="visual-brand">
            <div className="brand-logo">
              <img src="/logo.png" alt="ReFeed logo" />
            </div>

            <div className="brand-text">
              <strong>ReFeed</strong>
              <span>Smart Food. Zero Waste.</span>
            </div>
          </header>

          {/* MAIN VISUAL AREA */}
          <div className="visual-main">
            {/* LEFT CONTENT */}
            <div className="visual-copy">
              <div className="ai-badge">
                <span className="ai-badge-icon">
                  <Sparkles size={14} />
                </span>

                <span>AI-POWERED FOOD MANAGEMENT</span>
              </div>

              <h1>
                Predict
                <br />
                <span>Wisely.</span>
                <br />
                Reduce
                <br />
                <span>Waste.</span>
              </h1>

              <p className="visual-description">
                Transform meal demand into smarter preparation,
                lower waste and meaningful food rescue.
              </p>

              {/* PROCESS */}
              <div className="process-list">
                <div className="process-step active">
                  <div className="process-number">
                    <BrainCircuit size={17} />
                  </div>

                  <div>
                    <strong>Predict</strong>
                    <span>AI meal demand forecasting</span>
                  </div>
                </div>

                <div className="process-connector" />

                <div className="process-step">
                  <div className="process-number">
                    <ChefHat size={17} />
                  </div>

                  <div>
                    <strong>Prepare</strong>
                    <span>Optimize meals & ingredients</span>
                  </div>
                </div>

                <div className="process-connector" />

                <div className="process-step">
                  <div className="process-number">
                    <Recycle size={17} />
                  </div>

                  <div>
                    <strong>Rescue</strong>
                    <span>Connect surplus with NGOs</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ANALYTICS COLUMN */}
            <div className="analytics-column">
              {/* FORECAST CARD */}
              <article className="analytics-card forecast-card">
                <div className="analytics-card-top">
                  <div className="analytics-icon analytics-blue">
                    <BrainCircuit size={17} />
                  </div>

                  <div className="analytics-title">
                    <span>AI FORECAST</span>
                    <strong>Meal Demand</strong>
                  </div>

                  <div className="live-status">
                    <span />
                    Live
                  </div>
                </div>

                <div className="chart-area">
                  <div className="chart-bars">
                    <i style={{ height: "35%" }} />
                    <i style={{ height: "48%" }} />
                    <i style={{ height: "42%" }} />
                    <i style={{ height: "64%" }} />
                    <i style={{ height: "55%" }} />
                    <i style={{ height: "76%" }} />
                    <i style={{ height: "68%" }} />
                    <i style={{ height: "90%" }} />
                  </div>
                </div>

                <div className="forecast-result">
                  <span>Tomorrow</span>
                  <strong>626 meals</strong>
                </div>
              </article>

              {/* WASTE CARD */}
              <article className="analytics-card waste-card">
                <div className="analytics-icon analytics-green">
                  <Leaf size={17} />
                </div>

                <div className="waste-content">
                  <span>FOOD WASTE REDUCTION</span>
                  <strong>40%</strong>

                  <div className="waste-progress">
                    <span />
                  </div>
                </div>

                <TrendingDown
                  size={17}
                  className="waste-trend"
                />
              </article>

              {/* NGO CARD */}
              <article className="analytics-card ngo-card">
                <div className="analytics-icon analytics-cyan">
                  <Users size={17} />
                </div>

                <div className="ngo-content">
                  <span>SURPLUS RESCUED</span>
                  <strong>18 meals → NGO</strong>
                  <small>Community Kitchen</small>
                </div>

                <CheckCircle2
                  size={18}
                  className="ngo-check"
                />
              </article>
            </div>
          </div>

          {/* MISSION */}
          <div className="mission-card">
            <div className="mission-icon">
              <Users size={19} />
            </div>

            <div className="mission-content">
              <span>OUR MISSION</span>

              <strong>
                Good Food Should
                <br />
                Reach Everyone.
              </strong>
            </div>

            <div className="mission-leaf">
              <Leaf size={23} />
            </div>
          </div>

          {/* FOOTER */}
          <footer className="visual-footer">
            <span className="footer-status">
              <i />
              Intelligent food management
            </span>

            <span>ReFeed © 2026</span>
          </footer>
        </div>
      </section>

      {/* =====================================================
          RIGHT LOGIN AREA
      ====================================================== */}

      <section className="login-panel">
        <div className="panel-glow panel-glow-1" />
        <div className="panel-glow panel-glow-2" />

        <div className="login-container">
          {/* MOBILE BRAND */}
          <div className="mobile-brand">
            <div className="mobile-brand-logo">
              <img src="/logo.png" alt="ReFeed" />
            </div>

            <div>
              <strong>ReFeed</strong>
              <span>Smart Food. Zero Waste.</span>
            </div>
          </div>

          {/* LOGIN CARD */}
          <div className="login-card">
            <div className="login-heading">
              <div className="login-leaf">
                <Leaf size={18} />
              </div>

              <span className="login-eyebrow">
                WELCOME TO REFEED
              </span>

              <h2>Welcome Back</h2>

              <p>
                Sign in to continue making an impact
                <br className="desktop-break" />
                with smarter food management.
              </p>
            </div>

            {/* ERROR */}
            {error && (
              <div className="form-alert form-alert-error">
                <span className="alert-icon">!</span>
                <span>{error}</span>
              </div>
            )}

            {/* SUCCESS */}
            {success && (
              <div className="form-alert form-alert-success">
                <span className="success-icon">
                  <Check size={14} />
                </span>

                <span>Login successful</span>
              </div>
            )}

            <form
              className="login-form"
              onSubmit={handleSubmit}
              noValidate
            >
              {/* EMAIL */}
              <div className="field">
                <label htmlFor="email">Email address</label>

                <div
                  className={`input-box ${
                    emailError ? "has-error" : ""
                  }`}
                >
                  <Mail
                    size={18}
                    className="field-icon"
                  />

                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    placeholder="Enter your email"
                    autoComplete="email"
                    disabled={loading || success}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setEmailError("");
                      setError("");
                    }}
                    aria-invalid={Boolean(emailError)}
                  />

                  {email && !emailError && (
                    <CheckCircle2
                      size={16}
                      className="valid-icon"
                    />
                  )}
                </div>

                {emailError && (
                  <span className="field-error">
                    {emailError}
                  </span>
                )}
              </div>

              {/* PASSWORD */}
              <div className="field">
                <label htmlFor="password">Password</label>

                <div
                  className={`input-box ${
                    passwordError ? "has-error" : ""
                  }`}
                >
                  <LockKeyhole
                    size={18}
                    className="field-icon"
                  />

                  <input
                    id="password"
                    name="password"
                    type={
                      showPassword ? "text" : "password"
                    }
                    value={password}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    disabled={loading || success}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setPasswordError("");
                      setError("");
                    }}
                    aria-invalid={Boolean(passwordError)}
                  />

                  <button
                    type="button"
                    className="eye-button"
                    onClick={() =>
                      setShowPassword(
                        (previous) => !previous
                      )
                    }
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                    disabled={loading || success}
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>

                {passwordError && (
                  <span className="field-error">
                    {passwordError}
                  </span>
                )}
              </div>

              {/* OPTIONS */}
              <div className="form-options">
                <label className="remember">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    disabled={loading || success}
                    onChange={(event) =>
                      setRememberMe(
                        event.target.checked
                      )
                    }
                  />

                  <span className="checkbox">
                    <Check size={11} />
                  </span>

                  <span>Remember me</span>
                </label>

                <button
                  type="button"
                  className="forgot"
                  onClick={handleForgotPassword}
                  disabled={loading || success}
                >
                  Forgot password?
                </button>
              </div>

              {/* LOGIN BUTTON */}
              <button
                type="submit"
                className={`submit-button ${
                  loading ? "loading" : ""
                } ${success ? "success" : ""}`}
                disabled={loading || success}
              >
                {loading ? (
                  <>
                    <span className="spinner" />
                    Signing in...
                  </>
                ) : success ? (
                  <>
                    <Check size={18} />
                    Login successful
                  </>
                ) : (
                  <>
                    <span>Login</span>

                    <span className="submit-arrow">
                      <ArrowRight size={18} />
                    </span>
                  </>
                )}
              </button>
            </form>

            {/* DIVIDER */}
            <div className="divider">
              <span />
              <p>or continue with</p>
              <span />
            </div>

            {/* SOCIAL LOGIN */}
            <div className="social-grid">
              <button
                type="button"
                className="social-button"
                onClick={() =>
                  handleSocialLogin("Google")
                }
              >
                <span className="google-icon">G</span>
                <span>Google</span>
              </button>

              <button
                type="button"
                className="social-button"
                onClick={() =>
                  handleSocialLogin("Microsoft")
                }
              >
                <span className="microsoft-icon">
                  <i />
                  <i />
                  <i />
                  <i />
                </span>

                <span>Microsoft</span>
              </button>
            </div>

            {/* SIGNUP */}
            <div className="signup">
              <span>Don't have an account?</span>

              <Link to="/signup">
                Sign Up
                <ArrowRight size={14} />
              </Link>
            </div>

            {/* SECURITY */}
            <div className="security-note">
              <LockKeyhole size={12} />
              <span>Your account is securely protected</span>
            </div>
          </div>

          <div className="panel-footer">
            <span>ReFeed</span>
            <i />
            <span>Predict • Reduce • Rescue</span>
          </div>
        </div>
      </section>
    </main>
  );
}