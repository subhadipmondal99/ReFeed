import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  BrainCircuit,
  CalendarDays,
  ChefHat,
  ChevronRight,
  CircleCheck,
  CloudRain,
  Gauge,
  HeartHandshake,
  Leaf,
  LogOut,
  Menu,
  MoreHorizontal,
  PackageCheck,
  Recycle,
  Settings,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Truck,
  Utensils,
  X,
  Zap,
} from "lucide-react";

import { auth, logoutUser, observeAuthState } from "../firebase/auth";
import "./Dashboard.css";

const DEMO_DEMAND = [
  52, 68, 61, 79, 72, 88,
  76, 94, 84, 98, 91, 108,
];

const WORKFLOW = [
  {
    number: "01",
    title: "Predict",
    description: "AI estimates meal demand",
    icon: BrainCircuit,
    path: "/forecast",
    accent: "green",
  },
  {
    number: "02",
    title: "Prepare",
    description: "Optimize ingredients",
    icon: ChefHat,
    path: "/preparation",
    accent: "cyan",
  },
  {
    number: "03",
    title: "Serve",
    description: "Track meal operations",
    icon: Utensils,
    path: "/meal-operations",
    accent: "blue",
  },
  {
    number: "04",
    title: "Rescue",
    description: "Connect surplus to NGOs",
    icon: HeartHandshake,
    path: "/food-rescue",
    accent: "orange",
  },
];

function getUserName(user) {
  if (!user) return "Campus Team";

  if (user.displayName) {
    return user.displayName.split(" ")[0];
  }

  if (user.email) {
    return user.email.split("@")[0];
  }

  return "Campus Team";
}

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";

  return "Good evening";
}

function AnimatedNumber({
  value,
  suffix = "",
}) {
  const [displayValue, setDisplayValue] =
    useState(0);

  useEffect(() => {
    let frame;

    const start = performance.now();
    const duration = 850;

    const animate = (now) => {
      const progress = Math.min(
        (now - start) / duration,
        1
      );

      const eased =
        1 - Math.pow(1 - progress, 3);

      setDisplayValue(
        Math.round(value * eased)
      );

      if (progress < 1) {
        frame =
          requestAnimationFrame(animate);
      }
    };

    frame = requestAnimationFrame(animate);

    return () => {
      if (frame) {
        cancelAnimationFrame(frame);
      }
    };
  }, [value]);

  return (
    <>
      {displayValue}
      {suffix}
    </>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  suffix,
  description,
  trend,
  trendText,
  accent,
}) {
  return (
    <div
      className={`dashboard-metric ${accent}`}
    >
      <div className="metric-top">
        <div className="metric-icon">
          <Icon size={21} />
        </div>

        <button
          className="metric-menu"
          type="button"
          aria-label={`${label} options`}
        >
          <MoreHorizontal size={18} />
        </button>
      </div>

      <div className="metric-value">
        <AnimatedNumber value={value} />
        {suffix && (
          <small>{suffix}</small>
        )}
      </div>

      <div className="metric-label">
        {label}
      </div>

      <div className="metric-bottom">
        <span className="metric-trend">
          {trend === "down" ? (
            <TrendingDown size={14} />
          ) : (
            <TrendingUp size={14} />
          )}

          {trendText}
        </span>

        <span className="metric-description">
          {description}
        </span>
      </div>
    </div>
  );
}

function WorkflowCard({
  item,
  index,
}) {
  const Icon = item.icon;

  return (
    <Link
      to={item.path}
      className={`workflow-card ${item.accent}`}
      style={{
        animationDelay: `${
          index * 100 + 200
        }ms`,
      }}
    >
      <div className="workflow-number">
        {item.number}
      </div>

      <div className="workflow-icon">
        <Icon size={21} />
      </div>

      <div className="workflow-content">
        <strong>{item.title}</strong>

        <span>
          {item.description}
        </span>
      </div>

      <ChevronRight
        className="workflow-arrow"
        size={19}
      />
    </Link>
  );
}

function DemandChart() {
  const max = Math.max(...DEMO_DEMAND);

  return (
    <div className="demand-chart">
      <div className="chart-y-labels">
        <span>120</span>
        <span>90</span>
        <span>60</span>
        <span>30</span>
        <span>0</span>
      </div>

      <div className="chart-area">
        <div className="chart-grid-lines">
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>

        <div className="chart-bars-wrap">
          {DEMO_DEMAND.map(
            (value, index) => {
              const height =
                (value / max) * 100;

              return (
                <div
                  className="chart-column"
                  key={`${value}-${index}`}
                >
                  <div
                    className="chart-bar"
                    style={{
                      height: `${height}%`,
                      animationDelay: `${
                        index * 70
                      }ms`,
                    }}
                  />
                </div>
              );
            }
          )}
        </div>

        <div className="chart-labels">
          {[
            "09",
            "10",
            "11",
            "12",
            "13",
            "14",
            "15",
            "16",
            "17",
            "18",
            "19",
            "20",
          ].map((label) => (
            <span key={label}>
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(
    auth.currentUser
  );

  const [mobileMenu, setMobileMenu] =
    useState(false);

  const userName = useMemo(
    () => getUserName(user),
    [user]
  );

  const greeting = useMemo(
    () => getGreeting(),
    []
  );

  useEffect(() => {
    const unsubscribe =
      observeAuthState((currentUser) => {
        setUser(currentUser);
      });

    return unsubscribe;
  }, []);

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate("/login");
    } catch (error) {
      console.error(
        "Logout error:",
        error
      );
    }
  };

  return (
    <div className="dashboard-page">
      {/* =====================================================
          BACKGROUND
      ====================================================== */}

      <div className="dashboard-background">
        <div className="dashboard-bg-orb orb-one" />
        <div className="dashboard-bg-orb orb-two" />
        <div className="dashboard-bg-orb orb-three" />
        <div className="dashboard-grid" />
      </div>

      {/* =====================================================
          SIDEBAR
      ====================================================== */}

      <aside
        className={`dashboard-sidebar ${
          mobileMenu
            ? "mobile-open"
            : ""
        }`}
      >
        <div className="sidebar-brand">
          <Link to="/dashboard">
            <div className="sidebar-logo">
              <img
                src="/logo.png"
                alt="ReFeed"
              />
            </div>

            <div className="sidebar-brand-text">
              <strong>ReFeed</strong>

              <span>
                Smart Food Management
              </span>
            </div>
          </Link>

          <button
            className="sidebar-mobile-close"
            onClick={() =>
              setMobileMenu(false)
            }
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-status">
          <span className="status-pulse" />

          <span>
            AI SYSTEM ONLINE
          </span>
        </div>

        <nav className="dashboard-nav">
          <div className="nav-section-label">
            COMMAND CENTER
          </div>

          <Link
            to="/dashboard"
            className="dashboard-nav-item active"
          >
            <Gauge size={19} />
            <span>Dashboard</span>

            <i />
          </Link>

          <Link
            to="/forecast"
            className="dashboard-nav-item"
          >
            <BrainCircuit size={19} />
            <span>AI Forecast</span>
          </Link>

          <Link
            to="/preparation"
            className="dashboard-nav-item"
          >
            <ChefHat size={19} />
            <span>Preparation</span>
          </Link>

          <Link
            to="/meal-operations"
            className="dashboard-nav-item"
          >
            <Utensils size={19} />
            <span>
              Meal Operations
            </span>
          </Link>

          <div className="nav-section-label second">
            FOOD RESCUE
          </div>

          <Link
            to="/food-rescue"
            className="dashboard-nav-item"
          >
            <HeartHandshake size={19} />

            <span>Food Rescue</span>

            <b className="nav-badge">
              03
            </b>
          </Link>

          <Link
            to="/donations"
            className="dashboard-nav-item"
          >
            <Truck size={19} />

            <span>
              NGO Donations
            </span>
          </Link>

          <div className="nav-section-label second">
            INSIGHTS
          </div>

          <Link
            to="/impact"
            className="dashboard-nav-item"
          >
            <Recycle size={19} />

            <span>
              Impact Dashboard
            </span>
          </Link>
        </nav>

        <div className="sidebar-bottom">
          <button
            type="button"
            className="dashboard-nav-item"
          >
            <Settings size={19} />
            <span>Settings</span>
          </button>

          <button
            type="button"
            className="dashboard-nav-item logout-nav"
            onClick={handleLogout}
          >
            <LogOut size={19} />
            <span>Logout</span>
          </button>

          <div className="sidebar-version">
            <span>ReFeed AI</span>
            <span>v1.0.0</span>
          </div>
        </div>
      </aside>

      {mobileMenu && (
        <button
          className="sidebar-overlay"
          onClick={() =>
            setMobileMenu(false)
          }
          aria-label="Close menu"
        />
      )}

      {/* =====================================================
          MAIN
      ====================================================== */}

      <main className="dashboard-main">
        {/* HEADER */}

        <header className="dashboard-header">
          <button
            className="mobile-menu-button"
            onClick={() =>
              setMobileMenu(true)
            }
            aria-label="Open navigation"
          >
            <Menu size={21} />
          </button>

          <div className="header-context">
            <div className="header-breadcrumb">
              <span>ReFeed</span>
              <ChevronRight size={14} />
              <strong>
                Dashboard
              </strong>
            </div>

            <div className="header-date">
              <CalendarDays size={16} />

              <span>
                {new Date().toLocaleDateString(
                  "en-IN",
                  {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  }
                )}
              </span>
            </div>
          </div>

          <div className="header-actions">
            <div className="header-ai-status">
              <span />
              <Sparkles size={16} />

              <span>
                AI Engine Active
              </span>
            </div>

            <button
              className="header-avatar"
              title={
                user?.email ||
                "Account"
              }
            >
              {userName
                .charAt(0)
                .toUpperCase()}
            </button>
          </div>
        </header>

        {/* =====================================================
            CONTENT
        ====================================================== */}

        <div className="dashboard-content">
          {/* INTRO */}

          <section className="dashboard-intro">
            <div>
              <div className="intro-eyebrow">
                <span>
                  <Sparkles size={14} />
                </span>

                CAMPUS FOOD
                INTELLIGENCE
              </div>

              <h1>
                {greeting},{" "}
                <em>{userName}.</em>
              </h1>

              <p>
                Your AI-powered command
                center for predicting
                demand, reducing waste
                and rescuing surplus
                meals.
              </p>
            </div>

            <Link
              to="/forecast"
              className="intro-action"
            >
              <span>
                <BrainCircuit size={19} />
                Run AI Forecast
              </span>

              <ArrowRight size={19} />
            </Link>
          </section>

          {/* =================================================
              AI HERO
          ================================================== */}

          <section className="ai-command-card">
            <div className="command-background">
              <div className="command-grid" />

              <div className="command-glow glow-a" />
              <div className="command-glow glow-b" />

              <div className="command-ring ring-one" />
              <div className="command-ring ring-two" />
              <div className="command-ring ring-three" />
            </div>

            <div className="command-copy">
              <div className="command-live">
                <span />

                LIVE INTELLIGENCE
              </div>

              <h2>
                Predict smarter.
                <br />
                <strong>
                  Waste less.
                </strong>
              </h2>

              <p>
                ReFeed combines
                historical demand,
                academic patterns and
                weather signals to help
                your canteen prepare the
                right amount of food.
              </p>

              <div className="command-actions">
                <Link
                  to="/forecast"
                  className="command-primary"
                >
                  <BrainCircuit
                    size={18}
                  />

                  Generate Forecast

                  <ArrowRight
                    size={17}
                  />
                </Link>

                <Link
                  to="/impact"
                  className="command-secondary"
                >
                  View Impact
                </Link>
              </div>
            </div>

            {/* 3D CORE */}

            <div className="ai-core-scene">
              <div className="ai-core-shadow" />

              <div className="ai-core">
                <div className="ai-core-ring ring-a" />
                <div className="ai-core-ring ring-b" />
                <div className="ai-core-ring ring-c" />

                <div className="ai-core-glow" />

                <div className="ai-core-center">
                  <BrainCircuit
                    size={34}
                  />

                  <span>AI</span>
                </div>
              </div>

              <div className="core-orbit orbit-one">
                <span />
              </div>

              <div className="core-orbit orbit-two">
                <span />
              </div>

              <div className="core-orbit orbit-three">
                <span />
              </div>
            </div>

            {/* FORECAST FLOATING CARD */}

            <div className="floating-forecast-card">
              <div className="floating-card-header">
                <div>
                  <span>
                    AI FORECAST
                  </span>

                  <strong>
                    Tomorrow
                  </strong>
                </div>

                <div className="forecast-live-dot">
                  <i />
                  Live
                </div>
              </div>

              <div className="floating-meal">
                <div>
                  <small>
                    EXPECTED DEMAND
                  </small>

                  <strong>
                    <AnimatedNumber
                      value={626}
                    />

                    <span>
                      {" "}
                      meals
                    </span>
                  </strong>
                </div>

                <div className="forecast-up">
                  <TrendingUp
                    size={14}
                  />

                  5.8%
                </div>
              </div>

              <div className="demand-bars">
                {[
                  52, 68, 61, 79,
                  72, 88, 76, 94,
                  84, 98,
                ].map(
                  (value, index) => (
                    <div
                      className="demand-bar-column"
                      key={index}
                    >
                      <div className="demand-bar-track">
                        <div
                          className="demand-bar"
                          style={{
                            height: `${
                              value
                            }%`,
                            animationDelay: `${
                              index *
                              70
                            }ms`,
                          }}
                        />
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* WEATHER */}

            <div className="floating-weather">
              <div className="weather-icon">
                <CloudRain
                  size={20}
                />
              </div>

              <div>
                <span>
                  WEATHER SIGNAL
                </span>

                <strong>
                  28°C · Partly cloudy
                </strong>
              </div>
            </div>
          </section>

          {/* =================================================
              METRICS
          ================================================== */}

          <section className="dashboard-metrics">
            <MetricCard
              icon={BrainCircuit}
              label="Predicted Meals"
              value={626}
              description="Tomorrow's demand"
              trend="up"
              trendText="+5.8%"
              accent="green"
            />

            <MetricCard
              icon={ChefHat}
              label="Recommended Cooking"
              value={657}
              description="Including safety buffer"
              trend="up"
              trendText="+4.9%"
              accent="cyan"
            />

            <MetricCard
              icon={PackageCheck}
              label="Meals Served"
              value={580}
              description="Today's operations"
              trend="up"
              trendText="92.6%"
              accent="blue"
            />

            <MetricCard
              icon={Recycle}
              label="Waste Reduction"
              value={40}
              suffix="%"
              description="Compared with baseline"
              trend="down"
              trendText="-12.4%"
              accent="orange"
            />
          </section>

          {/* =================================================
              ANALYTICS GRID
          ================================================== */}

          <section className="dashboard-grid-layout">
            {/* DEMAND */}

            <div className="dashboard-panel demand-panel">
              <div className="panel-header">
                <div>
                  <span className="panel-kicker">
                    DEMAND INTELLIGENCE
                  </span>

                  <h3>
                    Meal demand trajectory
                  </h3>
                </div>

                <button
                  className="panel-period"
                  type="button"
                >
                  Last 12 signals
                  <ChevronRight
                    size={15}
                  />
                </button>
              </div>

              <DemandChart />

              <div className="demand-footer">
                <div className="demand-insight">
                  <div>
                    <Zap size={19} />
                  </div>

                  <p>
                    <strong>
                      Demand is trending
                      upward
                    </strong>

                    <span>
                      Friday and lunch
                      periods usually
                      require additional
                      preparation.
                    </span>
                  </p>
                </div>

                <Link to="/forecast">
                  Explore forecast
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>

            {/* OPERATIONS */}

            <div className="dashboard-panel operations-panel">
              <div className="panel-header">
                <div>
                  <span className="panel-kicker">
                    TODAY'S OPERATIONS
                  </span>

                  <h3>
                    Service snapshot
                  </h3>
                </div>

                <div className="operation-live">
                  <span />
                  LIVE
                </div>
              </div>

              <div className="service-ring-area">
                <div className="service-ring">
                  <div className="service-ring-inner">
                    <strong>
                      92.6%
                    </strong>

                    <span>
                      Service rate
                    </span>
                  </div>
                </div>

                <div className="service-summary">
                  <div>
                    <span>
                      Prepared
                    </span>

                    <strong>
                      626
                    </strong>
                  </div>

                  <div>
                    <span>
                      Served
                    </span>

                    <strong>
                      580
                    </strong>
                  </div>

                  <div className="warning">
                    <span>
                      Remaining
                    </span>

                    <strong>
                      46
                    </strong>
                  </div>
                </div>
              </div>

              <div className="operation-status">
                <div className="status-icon">
                  <CircleCheck
                    size={20}
                  />
                </div>

                <div>
                  <strong>
                    Service running
                    normally
                  </strong>

                  <span>
                    Surplus threshold:
                    20 meals
                  </span>
                </div>

                <Link to="/meal-operations">
                  <ArrowRight
                    size={18}
                  />
                </Link>
              </div>
            </div>
          </section>

          {/* =================================================
              WORKFLOW
          ================================================== */}

          <section className="workflow-section">
            <div className="section-heading">
              <div>
                <span className="panel-kicker">
                  REFEED INTELLIGENCE LOOP
                </span>

                <h2>
                  From prediction to
                  impact
                </h2>

                <p>
                  One connected workflow
                  for smarter food
                  management.
                </p>
              </div>

              <div className="section-line" />
            </div>

            <div className="workflow-grid">
              {WORKFLOW.map(
                (item, index) => (
                  <div
                    className="workflow-wrapper"
                    key={item.number}
                  >
                    <WorkflowCard
                      item={item}
                      index={index}
                    />

                    {index <
                      WORKFLOW.length -
                        1 && (
                      <div className="workflow-connector">
                        <ArrowRight
                          size={16}
                        />
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          </section>

          {/* =================================================
              RESCUE + IMPACT
          ================================================== */}

          <section className="dashboard-bottom-grid">
            <Link
              to="/food-rescue"
              className="rescue-banner"
            >
              <div className="rescue-glow" />

              <div className="rescue-icon">
                <HeartHandshake
                  size={29}
                />
              </div>

              <div className="rescue-copy">
                <span>
                  FOOD RESCUE NETWORK
                </span>

                <strong>
                  46 meals are ready
                  for{" "}
                  <em>rescue.</em>
                </strong>

                <small>
                  Connect available
                  surplus with nearby
                  NGO partners.
                </small>
              </div>

              <div className="rescue-action">
                Start Rescue
                <ArrowRight
                  size={18}
                />
              </div>
            </Link>

            <Link
              to="/impact"
              className="impact-mini-card"
            >
              <div className="impact-mini-top">
                <div className="impact-mini-icon">
                  <Leaf size={21} />
                </div>

                <TrendingDown
                  size={19}
                />
              </div>

              <span>
                CUMULATIVE IMPACT
              </span>

              <strong>
                40%
              </strong>

              <p>
                less food waste
              </p>

              <div className="impact-progress">
                <span />
              </div>

              <div className="impact-link">
                View full impact
                <ArrowRight size={16} />
              </div>
            </Link>
          </section>

          {/* FOOTER */}

          <footer className="dashboard-footer">
            <div>
              <img
                src="/logo.png"
                alt="ReFeed"
              />

              <span>
                ReFeed AI • Smart Food
                Management
              </span>
            </div>

            <span>
              Predict • Reduce • Rescue
            </span>

            <span>
              © 2026 ReFeed
            </span>
          </footer>
        </div>
      </main>
    </div>
  );
}