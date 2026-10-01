import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

import {
  Eye,
  EyeOff,
  Loader2,
  LogIn,
  HeartHandshake,
  UtensilsCrossed,
  AlertCircle,
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

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (event) => {
    event.preventDefault();

    setError("");

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    try {
      setLoading(true);

      /*
      |--------------------------------------------------------------------------
      | FIREBASE AUTH LOGIN
      |--------------------------------------------------------------------------
      */

      const user = await loginUser(
        email.trim(),
        password
      );

      /*
      |--------------------------------------------------------------------------
      | GET USER ROLE FROM FIRESTORE
      |--------------------------------------------------------------------------
      |
      | users/{uid}
      |
      | userType:
      |   "canteen"
      |   "ngo"
      |
      */

      const userRef = doc(
        db,
        "users",
        user.uid
      );

      const userSnapshot =
        await getDoc(userRef);

      if (!userSnapshot.exists()) {
        setError(
          "Your account profile was not found."
        );

        return;
      }

      const userData =
        userSnapshot.data();

      const userType =
        String(
          userData.userType ||
            userData.role ||
            ""
        )
          .trim()
          .toLowerCase();

      /*
      |--------------------------------------------------------------------------
      | CANTEEN LOGIN
      |--------------------------------------------------------------------------
      */

      if (
        userType === "canteen" ||
        userType === "admin"
      ) {
        navigate("/dashboard", {
          replace: true,
        });

        return;
      }

      /*
      |--------------------------------------------------------------------------
      | NGO LOGIN
      |--------------------------------------------------------------------------
      */

      if (
        userType === "ngo" ||
        userType === "ngos"
      ) {
        navigate("/donations", {
          replace: true,
        });

        return;
      }

      /*
      |--------------------------------------------------------------------------
      | UNKNOWN ROLE
      |--------------------------------------------------------------------------
      */

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

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      <div className="login-container">

        <div className="login-card">

          {/* LOGO */}

          <div className="login-logo">
            <div className="login-logo-icon">
              <HeartHandshake size={28} />
            </div>

            <div>
              <h1>ReFeed</h1>

              <p>
                Food Rescue Platform
              </p>
            </div>
          </div>

          {/* TITLE */}

          <div className="login-heading">

            <h2>
              Welcome back
            </h2>

            <p>
              Login to continue to your
              ReFeed workspace.
            </p>

          </div>

          {/* ERROR */}

          {error && (
            <div
              className="login-error"
              style={{
                display: "flex",
                gap: "10px",
                alignItems: "flex-start",
                padding: "12px 14px",
                marginBottom: "18px",
                borderRadius: "12px",
                background:
                  "rgba(239,68,68,0.10)",
                border:
                  "1px solid rgba(239,68,68,0.25)",
                color: "#fecaca",
                fontSize: "14px",
              }}
            >
              <AlertCircle
                size={18}
                style={{
                  flexShrink: 0,
                }}
              />

              <span>
                {error}
              </span>
            </div>
          )}

          {/* FORM */}

          <form
            onSubmit={handleLogin}
            className="login-form"
          >

            {/* EMAIL */}

            <div className="login-field">

              <label>
                Email address
              </label>

              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="you@example.com"
                autoComplete="email"
                disabled={loading}
              />

            </div>

            {/* PASSWORD */}

            <div className="login-field">

              <label>
                Password
              </label>

              <div
                style={{
                  position: "relative",
                }}
              >

                <input
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
                  style={{
                    paddingRight: "48px",
                  }}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                  disabled={loading}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform:
                      "translateY(-50%)",
                    border: "none",
                    background: "transparent",
                    color: "#94a3b8",
                    cursor: "pointer",
                  }}
                >
                  {showPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>

              </div>

            </div>

            {/* LOGIN BUTTON */}

            <button
              type="submit"
              className="login-submit"
              disabled={loading}
            >

              {loading ? (
                <>
                  <Loader2
                    size={19}
                    className="spin"
                  />

                  Signing in...
                </>
              ) : (
                <>
                  <LogIn size={19} />

                  Login
                </>
              )}

            </button>

          </form>

          {/* ROLE INFO */}

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "1fr 1fr",
              gap: "10px",
              marginTop: "22px",
            }}
          >

            <div
              style={{
                padding: "12px",
                borderRadius: "12px",
                background:
                  "rgba(16,185,129,0.07)",
                border:
                  "1px solid rgba(16,185,129,0.12)",
              }}
            >

              <UtensilsCrossed
                size={18}
                color="#34d399"
              />

              <strong
                style={{
                  display: "block",
                  marginTop: "6px",
                  color: "#d1fae5",
                  fontSize: "13px",
                }}
              >
                Canteen
              </strong>

              <span
                style={{
                  display: "block",
                  marginTop: "3px",
                  color: "#82968d",
                  fontSize: "11px",
                }}
              >
                Dashboard
              </span>

            </div>

            <div
              style={{
                padding: "12px",
                borderRadius: "12px",
                background:
                  "rgba(16,185,129,0.07)",
                border:
                  "1px solid rgba(16,185,129,0.12)",
              }}
            >

              <HeartHandshake
                size={18}
                color="#34d399"
              />

              <strong
                style={{
                  display: "block",
                  marginTop: "6px",
                  color: "#d1fae5",
                  fontSize: "13px",
                }}
              >
                NGO
              </strong>

              <span
                style={{
                  display: "block",
                  marginTop: "3px",
                  color: "#82968d",
                  fontSize: "11px",
                }}
              >
                Pickup requests
              </span>

            </div>

          </div>

          {/* SIGNUP */}

          <div className="login-footer">

            <span>
              Don't have an account?
            </span>

            <Link to="/signup">
              Create account
            </Link>

          </div>

        </div>

      </div>

      <style>{`
        .spin {
          animation: loginSpin 1s linear infinite;
        }

        @keyframes loginSpin {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(360deg);
          }
        }
      `}</style>

    </div>
  );
}