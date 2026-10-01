import { useEffect, useState } from "react";
import {
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  CloudRain,
  HeartHandshake,
  Leaf,
  Menu,
  Recycle,
  Sparkles,
  Truck,
  Utensils,
  X,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";
import "./LandingPage.css";

const features = [
  {
    icon: BrainCircuit,
    number: "01",
    title: "AI Demand Forecasting",
    description:
      "Predict tomorrow's lunch and dinner demand using historical meals, academic schedules and weather conditions.",
    tag: "PREDICT",
  },
  {
    icon: Utensils,
    number: "02",
    title: "Smart Preparation",
    description:
      "Convert predicted demand into recommended cooking quantities and ingredient requirements.",
    tag: "PREPARE",
  },
  {
    icon: Recycle,
    number: "03",
    title: "Surplus Rescue",
    description:
      "Detect excess prepared meals and create a rescue opportunity before safe shelf-life expires.",
    tag: "RESCUE",
  },
  {
    icon: HeartHandshake,
    number: "04",
    title: "Impact Intelligence",
    description:
      "Track rescued meals, food waste reduction and social impact through one clear dashboard.",
    tag: "MEASURE",
  },
];

const workflowSteps = [
  {
    number: "01",
    title: "Predict",
    description: "AI estimates upcoming meal demand.",
    icon: BrainCircuit,
  },
  {
    number: "02",
    title: "Prepare",
    description: "Calculate meals and ingredients precisely.",
    icon: Utensils,
  },
  {
    number: "03",
    title: "Serve",
    description: "Track real canteen operations.",
    icon: CheckCircle2,
  },
  {
    number: "04",
    title: "Rescue",
    description: "Route surplus to nearby NGOs.",
    icon: Truck,
  },
];

function AnimatedNumber({ value, suffix = "" }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const target = Number(value) || 0;
    const duration = 1400;
    const startTime = performance.now();

    let frame;

    const animate = (time) => {
      const progress = Math.min(
        (time - startTime) / duration,
        1
      );

      const eased =
        1 - Math.pow(1 - progress, 3);

      setDisplayValue(
        Math.round(target * eased)
      );

      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      }
    };

    frame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frame);
  }, [value]);

  return (
    <>
      {displayValue.toLocaleString()}
      {suffix}
    </>
  );
}

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="rf-navbar">
      <div className="rf-navbar-inner">
        <Link
          to="/"
          className="rf-brand"
          onClick={closeMenu}
        >
          <div className="rf-brand-logo">
            <img
              src="/logo.png"
              alt="ReFeed logo"
            />
          </div>

          <div className="rf-brand-copy">
            <span className="rf-brand-name">
              ReFeed
            </span>

            <span className="rf-brand-tagline">
              FOOD • DATA • IMPACT
            </span>
          </div>
        </Link>

        <nav
          className={`rf-nav-links ${
            menuOpen ? "open" : ""
          }`}
        >
          <a
            href="#features"
            onClick={closeMenu}
          >
            Features
          </a>

          <a
            href="#workflow"
            onClick={closeMenu}
          >
            Workflow
          </a>

          <a
            href="#impact"
            onClick={closeMenu}
          >
            Impact
          </a>

          <Link
            to="/login"
            className="mobile-login"
            onClick={closeMenu}
          >
            Login
          </Link>
        </nav>

        <div className="rf-navbar-actions">
          <Link
            to="/login"
            className="rf-nav-login"
          >
            Login
          </Link>

          <Link
            to="/signup"
            className="rf-nav-button"
          >
            Get Started
            <ArrowRight size={15} />
          </Link>
        </div>

        <button
          className="rf-menu-button"
          onClick={() =>
            setMenuOpen(!menuOpen)
          }
          aria-label="Toggle navigation"
        >
          {menuOpen ? (
            <X size={21} />
          ) : (
            <Menu size={21} />
          )}
        </button>
      </div>
    </header>
  );
}

function BackgroundScene() {
  return (
    <div
      className="rf-background"
      aria-hidden="true"
    >
      <div className="rf-background-grid" />

      <div className="rf-background-glow rf-glow-one" />
      <div className="rf-background-glow rf-glow-two" />
      <div className="rf-background-glow rf-glow-three" />

      <div className="rf-background-orb rf-orb-one" />
      <div className="rf-background-orb rf-orb-two" />

      <div className="rf-floating-particles">
        {Array.from(
          { length: 28 },
          (_, index) => (
            <span
              key={index}
              className="rf-particle"
              style={{
                "--particle-index": index,
              }}
            />
          )
        )}
      </div>
    </div>
  );
}

function AICore() {
  return (
    <div className="rf-ai-core-wrapper">
      <div className="rf-ai-shadow" />

      <div className="rf-ai-orbit rf-ai-orbit-one">
        <span />
      </div>

      <div className="rf-ai-orbit rf-ai-orbit-two">
        <span />
      </div>

      <div className="rf-ai-orbit rf-ai-orbit-three">
        <span />
      </div>

      <div className="rf-ai-core">
        <div className="rf-ai-core-inner">
          <img
            src="/logo.png"
            alt="ReFeed AI"
          />
        </div>

        <div className="rf-ai-core-glow" />
      </div>

      <div className="rf-ai-core-label">
        <span className="rf-ai-live-dot" />
        AI ENGINE
      </div>
    </div>
  );
}

function ForecastCard() {
  return (
    <div className="rf-floating-card rf-forecast-card">
      <div className="rf-floating-card-top">
        <div>
          <span className="rf-card-label">
            TOMORROW • LUNCH
          </span>

          <strong>742 meals</strong>
        </div>

        <div className="rf-card-icon green">
          <BrainCircuit size={17} />
        </div>
      </div>

      <div className="rf-mini-chart">
        <span style={{ height: "35%" }} />
        <span style={{ height: "52%" }} />
        <span style={{ height: "43%" }} />
        <span style={{ height: "69%" }} />
        <span style={{ height: "58%" }} />
        <span style={{ height: "83%" }} />
        <span style={{ height: "92%" }} />
      </div>

      <div className="rf-card-bottom">
        <span>AI confidence</span>
        <strong>94.2%</strong>
      </div>
    </div>
  );
}

function WeatherCard() {
  return (
    <div className="rf-floating-card rf-weather-card">
      <div className="rf-card-icon cyan">
        <CloudRain size={18} />
      </div>

      <div className="rf-weather-copy">
        <span className="rf-card-label">
          CAMPUS WEATHER
        </span>

        <strong>28°</strong>

        <span>
          Light rain expected
        </span>
      </div>
    </div>
  );
}

function ImpactMiniCard() {
  return (
    <div className="rf-floating-card rf-impact-mini-card">
      <div className="rf-card-icon orange">
        <HeartHandshake size={18} />
      </div>

      <div>
        <span className="rf-card-label">
          MEALS RESCUED
        </span>

        <strong>
          <AnimatedNumber value={1248} />
        </strong>

        <small>this month</small>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="rf-hero">
      <BackgroundScene />

      <div className="rf-hero-container">
        <div className="rf-hero-copy">
          <div className="rf-hero-badge">
            <span className="rf-badge-pulse" />
            AI-POWERED CAMPUS FOOD INTELLIGENCE
          </div>

          <h1>
            Feed people.
            <br />
            <span>Not landfills.</span>
          </h1>

          <p>
            ReFeed predicts campus meal demand,
            optimizes preparation, detects
            surplus and connects safe excess
            food with nearby NGOs.
          </p>

          <div className="rf-hero-actions">
            <Link
              to="/signup"
              className="rf-primary-button"
            >
              Start with ReFeed
              <ArrowRight size={17} />
            </Link>

            <a
              href="#workflow"
              className="rf-secondary-button"
            >
              Explore the workflow

              <span>
                <ArrowRight size={15} />
              </span>
            </a>
          </div>

          <div className="rf-hero-trust">
            <div className="rf-trust-item">
              <CheckCircle2 size={15} />
              Demand forecasting
            </div>

            <div className="rf-trust-item">
              <CheckCircle2 size={15} />
              Surplus detection
            </div>

            <div className="rf-trust-item">
              <CheckCircle2 size={15} />
              NGO dispatch
            </div>
          </div>
        </div>

        <div className="rf-hero-visual">
          <AICore />
          <ForecastCard />
          <WeatherCard />
          <ImpactMiniCard />

          <div className="rf-visual-status">
            <span className="rf-status-light" />
            SYSTEM OPERATIONAL
          </div>
        </div>
      </div>

      <div className="rf-scroll-indicator">
        <span>SCROLL TO EXPLORE</span>
        <div className="rf-scroll-line" />
      </div>
    </section>
  );
}

function Features() {
  return (
    <section
      className="rf-section rf-features-section"
      id="features"
    >
      <div className="rf-section-container">
        <div className="rf-section-heading">
          <div className="rf-eyebrow">
            <span />
            THE INTELLIGENCE LAYER
          </div>

          <h2>
            One system.
            <br />
            <span>Every meal.</span>
          </h2>

          <p>
            ReFeed connects prediction,
            preparation, operations and food
            rescue into one continuous campus
            workflow.
          </p>
        </div>

        <div className="rf-features-grid">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <article
                className="rf-feature-card"
                key={feature.number}
              >
                <div className="rf-feature-number">
                  {feature.number}
                </div>

                <div className="rf-feature-icon">
                  <Icon size={23} />
                </div>

                <span className="rf-feature-tag">
                  {feature.tag}
                </span>

                <h3>{feature.title}</h3>

                <p>
                  {feature.description}
                </p>

                <div className="rf-feature-arrow">
                  <ArrowRight size={16} />
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Workflow() {
  const [activeStep, setActiveStep] =
    useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep(
        (current) =>
          (current + 1) %
          workflowSteps.length
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section
      className="rf-section rf-workflow-section"
      id="workflow"
    >
      <div className="rf-workflow-bg">
        <div className="rf-workflow-grid" />
        <div className="rf-workflow-glow rf-wg-left" />
        <div className="rf-workflow-glow rf-wg-right" />
      </div>

      <div className="rf-section-container">
        <div className="rf-workflow-heading">
          <div className="rf-eyebrow">
            <span />
            END-TO-END WORKFLOW
          </div>

          <h2>
            Predict.
            <span> Prepare.</span>
            <span> Serve.</span>
            <span> Rescue.</span>
          </h2>

          <p>
            From tomorrow's demand to today's
            rescued meals, ReFeed connects the
            entire loop.
          </p>
        </div>

        <div className="rf-workflow">
          <div className="rf-workflow-line">
            <div
              className="rf-workflow-line-progress"
              style={{
                width: `${
                  (activeStep /
                    (workflowSteps.length - 1)) *
                  100
                }%`,
              }}
            />
          </div>

          <div className="rf-workflow-steps">
            {workflowSteps.map(
              (step, index) => {
                const Icon = step.icon;

                return (
                  <button
                    key={step.number}
                    type="button"
                    className={`rf-workflow-step ${
                      index === activeStep
                        ? "active"
                        : ""
                    } ${
                      index < activeStep
                        ? "completed"
                        : ""
                    }`}
                    onClick={() =>
                      setActiveStep(index)
                    }
                  >
                    <div className="rf-workflow-orbit">
                      <div className="rf-workflow-ring" />

                      <div className="rf-workflow-circle">
                        <Icon size={25} />
                      </div>

                      {index ===
                        activeStep && (
                        <span className="rf-workflow-pulse" />
                      )}
                    </div>

                    <div className="rf-workflow-content">
                      <span className="rf-workflow-number">
                        STEP {step.number}
                      </span>

                      <h3>{step.title}</h3>

                      <p>
                        {step.description}
                      </p>
                    </div>
                  </button>
                );
              }
            )}
          </div>

          <div className="rf-workflow-center-logo">
            <div className="rf-logo-orbit orbit-a" />
            <div className="rf-logo-orbit orbit-b" />

            <div className="rf-logo-core">
              <img
                src="/logo.png"
                alt="ReFeed"
              />
            </div>
          </div>

          <div className="rf-workflow-status">
            <div className="rf-live-status">
              <span />
              LIVE PROCESS
            </div>

            <div className="rf-status-separator" />

            <div className="rf-current-process">
              Currently optimizing{" "}
              <strong>
                {
                  workflowSteps[
                    activeStep
                  ].title
                }
              </strong>
            </div>

            <div className="rf-process-dots">
              {workflowSteps.map(
                (step, index) => (
                  <button
                    key={step.number}
                    type="button"
                    aria-label={`Show ${step.title} step`}
                    className={
                      index === activeStep
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      setActiveStep(index)
                    }
                  />
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Impact() {
  return (
    <section
      className="rf-section rf-impact-section"
      id="impact"
    >
      <div className="rf-section-container">
        <div className="rf-impact-layout">
          <div className="rf-impact-copy">
            <div className="rf-eyebrow">
              <span />
              MEASURE THE DIFFERENCE
            </div>

            <h2>
              Every rescued meal
              <br />
              becomes{" "}
              <span>real impact.</span>
            </h2>

            <p>
              Turn daily canteen operations into
              measurable environmental and
              social outcomes.
            </p>

            <div className="rf-impact-list">
              <div>
                <CheckCircle2 size={17} />
                Reduce unnecessary food
                preparation
              </div>

              <div>
                <CheckCircle2 size={17} />
                Connect surplus with NGOs
              </div>

              <div>
                <CheckCircle2 size={17} />
                Track cumulative impact
              </div>
            </div>

            <Link
              to="/signup"
              className="rf-outline-button"
            >
              Explore ReFeed
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="rf-impact-dashboard">
            <div className="rf-dashboard-top">
              <div>
                <span>
                  IMPACT OVERVIEW
                </span>

                <strong>
                  Campus Food Intelligence
                </strong>
              </div>

              <div className="rf-dashboard-live">
                <span />
                LIVE
              </div>
            </div>

            <div className="rf-dashboard-metrics">
              <div className="rf-dashboard-metric">
                <span>
                  MEALS RESCUED
                </span>

                <strong>
                  <AnimatedNumber
                    value={1248}
                  />
                </strong>

                <small>
                  +18.4% this month
                </small>
              </div>

              <div className="rf-dashboard-metric">
                <span>
                  WASTE AVOIDED
                </span>

                <strong>
                  <AnimatedNumber
                    value={96}
                    suffix=" kg"
                  />
                </strong>

                <small>
                  food redirected
                </small>
              </div>
            </div>

            <div className="rf-impact-chart">
              <div className="rf-chart-header">
                <span>
                  RESCUE TRAJECTORY
                </span>

                <span>
                  LAST 7 DAYS
                </span>
              </div>

              <div className="rf-chart-area">
                <div className="rf-chart-line" />

                {[
                  "p1",
                  "p2",
                  "p3",
                  "p4",
                  "p5",
                  "p6",
                  "p7",
                ].map((point) => (
                  <span
                    key={point}
                    className={`rf-chart-point ${point}`}
                  />
                ))}
              </div>

              <div className="rf-chart-days">
                <span>MON</span>
                <span>TUE</span>
                <span>WED</span>
                <span>THU</span>
                <span>FRI</span>
                <span>SAT</span>
                <span>SUN</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="rf-cta-section">
      <div className="rf-cta-glow" />

      <div className="rf-section-container">
        <div className="rf-cta-card">
          <div className="rf-cta-icon">
            <Zap size={22} />
          </div>

          <h2>
            Ready to make every meal count?
          </h2>

          <p>
            Bring prediction, preparation and
            food rescue together with ReFeed.
          </p>

          <Link
            to="/signup"
            className="rf-primary-button"
          >
            Start with ReFeed
            <ArrowRight size={17} />
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="rf-footer">
      <div className="rf-section-container">
        <div className="rf-footer-brand">
          <div className="rf-brand-logo">
            <img
              src="/logo.png"
              alt="ReFeed"
            />
          </div>

          <div>
            <strong>ReFeed</strong>
            <span>
              FOOD • DATA • IMPACT
            </span>
          </div>
        </div>

        <p>
          Predict better. Prepare smarter.
          Rescue more.
        </p>

        <span className="rf-footer-copy">
          © 2026 ReFeed
        </span>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div className="rf-page">
      <Navbar />

      <main>
        <Hero />
        <Features />
        <Workflow />
        <Impact />
        <CTA />
      </main>

      <Footer />
    </div>
  );
}