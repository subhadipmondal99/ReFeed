import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  Eye,
  EyeOff,
  Loader2,
  LogIn,
  HeartHandshake,
  UtensilsCrossed,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Leaf,
  ArrowRight,
  BrainCircuit,
  TrendingUp,
  Recycle,
} from "lucide-react";

import { loginUser, db } from "../firebase/auth";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import "./Login.css";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleLogin = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

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

      // -----------------------------------------
      // FIREBASE LOGIN
      // -----------------------------------------
      const user = await loginUser(
        email.trim(),
        password
      );

      // -----------------------------------------
      // GET USER ROLE
      // -----------------------------------------
      const userRef = doc(
        db,
        "users",
        user.uid
      );

      const userSnapshot = await getDoc(userRef);

      if (!userSnapshot.exists()) {
        setError(
          "Your account profile was not found. Please contact the administrator."
        );
        return;
      }

      const userData = userSnapshot.data();

      const userType = String(
        userData.userType ||
          userData.role ||
          ""
      )
        .trim()
        .toLowerCase();

      setSuccess("Login successful. Redirecting...");

      // -----------------------------------------
      // CANTEEN
      // -----------------------------------------
      if (
        userType === "canteen" ||
        userType === "admin"
      ) {
        setTimeout(() => {
          navigate("/dashboard", {
            replace: true,
          });
        }, 500);

        return;
      }

      // -----------------------------------------
      // NGO
      // -----------------------------------------
      if (
        userType === "ngo" ||
        userType === "ngos"
      ) {
        setTimeout(() => {
          navigate("/donations", {
            replace: true,
          });
        }, 500);

        return;
      }

      setError(
        "Your account role is not configured. Please contact the administrator."
      );
    } catch (loginError) {
      console.error(
        "Login error:",
        loginError
      );

      let message =
        "Unable to login. Please check your email and password.";

      if (
        loginError?.code ===
        "auth/invalid-credential"
      ) {
        message =
          "Invalid email or password.";
      }

      if (
        loginError?.code ===
        "auth/user-not-found"
      ) {
        message =
          "No account exists with this email.";
      }

      if (
        loginError?.code ===
        "auth/wrong-password"
      ) {
        message =
          "Incorrect password.";
      }

      if (
        loginError?.code ===
        "auth/invalid-email"
      ) {
        message =
          "Please enter a valid email address.";
      }

      if (
        loginError?.code ===
        "auth/too-many-requests"
      ) {
        message =
          "Too many login attempts. Please try again later.";
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">

      {/* =====================================================
          LEFT VISUAL SECTION
      ====================================================== */}

      <section className="login-visual">

        <div className="visual-grid" />

        <div className="visual-glow visual-glow-1" />
        <div className="visual-glow visual-glow-2" />
        <div className="visual-glow visual-glow-3" />

        <div className="visual-inner">

          {/* BRAND */}

          <div className="visual-brand">

            <div className="brand-logo">
              <HeartHandshake size={27} />
            </div>

            <div className="brand-text">
              <strong>ReFeed</strong>
              <span>
                Campus Food Rescue Platform
              </span>
            </div>

          </div>

          {/* MAIN */}

          <div className="visual-main">

            {/* HERO COPY */}

            <div className="visual-copy">

              <div className="ai-badge">
                <div className="ai-badge-icon">
                  <Sparkles size={13} />
                </div>

                AI POWERED FOOD MANAGEMENT
              </div>

              <h1>
                Feed more.
                <br />
                Waste <span>less.</span>
              </h1>

              <p className="visual-description">
                ReFeed uses intelligent demand forecasting
                to help campus canteens prepare the right
                amount of food and rescue surplus meals
                through nearby NGOs.
              </p>

              {/* PROCESS */}

              <div className="process-list">

                <div className="process-step active">
                  <div className="process-number">
                    <BrainCircuit size={15} />
                  </div>

                  <div>
                    <strong>
                      Predict demand
                    </strong>

                    <span>
                      AI forecasts upcoming meal demand
                    </span>
                  </div>
                </div>

                <div className="process-connector" />

                <div className="process-step">
                  <div className="process-number">
                    <UtensilsCrossed size={15} />
                  </div>

                  <div>
                    <strong>
                      Prepare smarter
                    </strong>

                    <span>
                      Calculate meals and ingredients
                    </span>
                  </div>
                </div>

                <div className="process-connector" />

                <div className="process-step">
                  <div className="process-number">
                    <Recycle size={15} />
                  </div>

                  <div>
                    <strong>
                      Rescue surplus
                    </strong>

                    <span>
                      Connect extra meals with NGOs
                    </span>
                  </div>
                </div>

              </div>

            </div>

            {/* ANALYTICS CARDS */}

            <div className="analytics-column">

              {/* FORECAST */}

              <div className="analytics-card forecast-card">

                <div className="analytics-card-top">

                  <div className="analytics-icon analytics-blue">
                    <TrendingUp size={16} />
                  </div>

                  <div className="analytics-title">

                    <span>
                      AI FORECAST
                    </span>

                    <strong>
                      Today's demand
                    </strong>

                  </div>

                  <div className="live-status">
                    <span />
                    Live
                  </div>

                </div>

                <div className="chart-area">

                  <div className="chart-bars">
                    <i style={{ height: "35%" }} />
                    <i style={{ height: "52%" }} />
                    <i style={{ height: "43%" }} />
                    <i style={{ height: "68%" }} />
                    <i style={{ height: "58%" }} />
                    <i style={{ height: "82%" }} />
                    <i style={{ height: "72%" }} />
                    <i style={{ height: "92%" }} />
                  </div>

                </div>

                <div className="forecast-result">
                  <span>
                    Predicted meals
                  </span>

                  <strong>
                    742 meals
                  </strong>
                </div>

              </div>

              {/* WASTE */}

              <div className="analytics-card waste-card">

                <div className="analytics-icon analytics-green">
                  <Leaf size={16} />
                </div>

                <div className="waste-content">

                  <span>
                    WASTE REDUCTION
                  </span>

                  <strong>
                    28%
                  </strong>

                  <div className="waste-progress">
                    <span />
                  </div>

                </div>

                <div className="waste-trend">
                  <TrendingUp size={15} />
                </div>

              </div>

              {/* NGO */}

              <div className="analytics-card ngo-card">

                <div className="analytics-icon analytics-cyan">
                  <HeartHandshake size={16} />
                </div>

                <div className="ngo-content">

                  <span>
                    FOOD RESCUE
                  </span>

                  <strong>
                    NGO connected
                  </strong>

                  <small>
                    Nearby pickup partner
                  </small>

                </div>

                <div className="ngo-check">
                  <CheckCircle2 size={18} />
                </div>

              </div>

            </div>

          </div>

          {/* MISSION */}

          <div className="mission-card">

            <div className="mission-icon">
              <Recycle size={18} />
            </div>

            <div className="mission-content">

              <span>
                OUR MISSION
              </span>

              <strong>
                Turn surplus campus food into meals
                for people who need them.
              </strong>

            </div>

            <Leaf
              className="mission-leaf"
              size={18}
            />

          </div>

          {/* FOOTER */}

          <div className="visual-footer">

            <div className="footer-status">
              <i />
              ReFeed systems operational
            </div>

            <span>
              Predict • Prepare • Rescue • Measure
            </span>

          </div>

        </div>

      </section>

      {/* =====================================================
          RIGHT LOGIN SECTION
      ====================================================== */}

      <section className="login-panel">

        <div className="panel-glow panel-glow-1" />
        <div className="panel-glow panel-glow-2" />

        <div className="login-container">

          {/* MOBILE BRAND */}

          <div className="mobile-brand">

            <div className="mobile-brand-logo">
              <HeartHandshake size={25} />
            </div>

            <div>
              <strong>ReFeed</strong>

              <span>
                Food Rescue Platform
              </span>
            </div>

          </div>

          {/* LOGIN CARD */}

          <div className="login-card">

            {/* HEADING */}

            <div className="login-heading">

              <div className="login-leaf">
                <HeartHandshake size={20} />
              </div>

              <div className="login-eyebrow">
                WELCOME BACK
              </div>

              <h2>
                Sign in to ReFeed
              </h2>

              <p>
                Continue managing your campus
                food rescue workspace.
              </p>

            </div>

            {/* ERROR */}

            {error && (
              <div className="form-alert form-alert-error">

                <div className="alert-icon">
                  <AlertCircle size={13} />
                </div>

                <span>
                  {error}
                </span>

              </div>
            )}

            {/* SUCCESS */}

            {success && (
              <div className="form-alert form-alert-success">

                <div className="success-icon">
                  <CheckCircle2 size={13} />
                </div>

                <span>
                  {success}
                </span>

              </div>
            )}

            {/* FORM */}

            <form
              className="login-form"
              onSubmit={handleLogin}
            >

              {/* EMAIL */}

              <div className="field">

                <label htmlFor="login-email">
                  Email address
                </label>

                <div className="input-box">

                  <span className="field-icon">
                    <svg
                      width="17"
                      height="17"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect
                        x="3"
                        y="5"
                        width="18"
                        height="14"
                        rx="2"
                      />
                      <path d="m3 7 9 6 9-6" />
                    </svg>
                  </span>

                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(
                        event.target.value
                      )
                    }
                    placeholder="you@example.com"
                    autoComplete="email"
                    disabled={loading}
                  />

                </div>

              </div>

              {/* PASSWORD */}

              <div className="field">

                <label htmlFor="login-password">
                  Password
                </label>

                <div className="input-box">

                  <span className="field-icon">
                    <svg
                      width="17"
                      height="17"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect
                        x="4"
                        y="10"
                        width="16"
                        height="10"
                        rx="2"
                      />
                      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                    </svg>
                  </span>

                  <input
                    id="login-password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={password}
                    onChange={(event) =>
                      setPassword(
                        event.target.value
                      )
                    }
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    disabled={loading}
                  />

                  <button
                    type="button"
                    className="eye-button"
                    onClick={() =>
                      setShowPassword(
                        (value) => !value
                      )
                    }
                    disabled={loading}
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff size={17} />
                    ) : (
                      <Eye size={17} />
                    )}
                  </button>

                </div>

              </div>

              {/* OPTIONS */}

              <div className="form-options">

                <label className="remember">

                  <input
                    type="checkbox"
                  />

                  <span className="checkbox">
                    <CheckCircle2 size={11} />
                  </span>

                  Remember me

                </label>

                <button
                  type="button"
                  className="forgot"
                  onClick={() => {
                    setError(
                      "Password reset can be added through Firebase Authentication."
                    );
                  }}
                >
                  Forgot password?
                </button>

              </div>

              {/* LOGIN BUTTON */}

              <button
                type="submit"
                className={`submit-button ${
                  success ? "success" : ""
                }`}
                disabled={loading}
              >

                {loading ? (
                  <>
                    <span className="spinner" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn size={17} />

                    Login

                    <span className="submit-arrow">
                      <ArrowRight size={15} />
                    </span>
                  </>
                )}

              </button>

            </form>

            {/* ROLE INFORMATION */}

            <div className="role-section">

              <div className="role-heading">
                <span>
                  ONE PLATFORM
                </span>

                <strong>
                  Different workspace for each role
                </strong>
              </div>

              <div className="role-grid">

                {/* CANTEEN */}

                <div className="role-card">

                  <div className="role-icon">
                    <UtensilsCrossed size={18} />
                  </div>

                  <div>
                    <strong>
                      Canteen
                    </strong>

                    <span>
                      Forecast & manage meals
                    </span>
                  </div>

                </div>

                {/* NGO */}

                <div className="role-card">

                  <div className="role-icon">
                    <HeartHandshake size={18} />
                  </div>

                  <div>
                    <strong>
                      NGO
                    </strong>

                    <span>
                      Receive pickup requests
                    </span>
                  </div>

                </div>

              </div>

            </div>

            {/* SIGNUP */}

            <div className="signup">

              <span>
                Don't have an account?
              </span>

              <Link to="/signup">
                Create account
                <ArrowRight size={12} />
              </Link>

            </div>

            {/* SECURITY */}

            <div className="security-note">

              <ShieldCheck size={13} />

              Secure authentication powered by Firebase

            </div>

          </div>

          {/* PANEL FOOTER */}

          <div className="panel-footer">

            <span>
              ReFeed
            </span>

            <i />

            <span>
              Campus Food Rescue
            </span>

            <i />

            <span>
              AI Powered
            </span>

          </div>

        </div>

      </section>

    </main>
  );
}
