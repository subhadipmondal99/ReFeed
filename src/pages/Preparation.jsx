import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  Check,
  CheckCircle2,
  ChefHat,
  CloudRain,
  Database,
  Leaf,
  Loader2,
  Package,
  RefreshCw,
  Sparkles,
  Thermometer,
  Utensils,
  Users,
  Zap,
} from "lucide-react";

import {
  getPrediction,
} from "../services/predictionService";

import "./Preparation.css";


// =========================================================
// HELPERS
// =========================================================

const formatNumber = (value) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "0";
  }

  return number.toLocaleString("en-IN");
};


const formatQuantity = (value) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "0.00";
  }

  return number.toFixed(2);
};


const formatDate = (date) => {

  if (!date) {
    return "";
  }

  const parsed =
    new Date(`${date}T00:00:00`);

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    return date;
  }

  return parsed.toLocaleDateString(
    "en-IN",
    {
      weekday: "long",
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
};


// =========================================================
// PREPARATION PAGE
// =========================================================

export default function Preparation() {

  const navigate = useNavigate();

  const location = useLocation();


  // ---------------------------------------------------------
  // FORECAST PASSED FROM FORECAST PAGE
  // ---------------------------------------------------------

  const routerForecast =
    location.state?.forecast || null;


  // ---------------------------------------------------------
  // FIREBASE FORECAST
  // ---------------------------------------------------------

  const [
    firebaseForecast,
    setFirebaseForecast,
  ] = useState(null);


  const [
    forecastLoading,
    setForecastLoading,
  ] = useState(false);


  const [
    forecastError,
    setForecastError,
  ] = useState("");


  // ---------------------------------------------------------
  // CHECKLIST
  // ---------------------------------------------------------

  const [
    checkedItems,
    setCheckedItems,
  ] = useState({});


  // =========================================================
  // IDENTIFY FORECAST
  // =========================================================

  const forecastDate =
    routerForecast?.date ||
    routerForecast?.forecastDate ||
    new Date()
      .toISOString()
      .split("T")[0];


  const mealType =
    routerForecast?.meal_type ||
    routerForecast?.mealType ||
    "Lunch";


  // =========================================================
  // LOAD FORECAST FROM FIREBASE
  // =========================================================
  //
  // If the Forecast page passed data through router state,
  // we already have something to display immediately.
  //
  // Firebase is then loaded to make sure the page is using
  // the saved forecast.
  // =========================================================

  useEffect(() => {

    let cancelled = false;


    const loadForecast = async () => {

      try {

        setForecastLoading(true);

        setForecastError("");


        const savedForecast =
          await getPrediction(
            forecastDate,
            mealType
          );


        if (cancelled) {
          return;
        }


        if (savedForecast) {

          setFirebaseForecast(
            savedForecast
          );

        } else {

          // No Firebase document yet.
          // Keep router forecast if available.

          setFirebaseForecast(null);
        }

      } catch (error) {

        console.error(
          "Failed to load forecast from Firebase:",
          error
        );


        if (!cancelled) {

          setForecastError(
            error?.message ||
            "Unable to load forecast from Firebase."
          );
        }

      } finally {

        if (!cancelled) {

          setForecastLoading(false);
        }
      }
    };


    loadForecast();


    return () => {
      cancelled = true;
    };

  }, [
    forecastDate,
    mealType,
  ]);


  // =========================================================
  // SOURCE OF TRUTH
  // =========================================================
  //
  // Firebase wins when available.
  //
  // Router state is used immediately while Firebase loads.
  // =========================================================

  const forecast =
    firebaseForecast ||
    routerForecast ||
    null;


  // =========================================================
  // FORECAST VALUES
  // =========================================================

  const predictedMeals =
    Number(
      forecast?.predicted_meals ??
      forecast?.predictedMeals ??
      0
    );


  const recommendedCooking =
    Number(
      forecast?.recommended_cooking ??
      forecast?.recommendedCooking ??
      Math.round(
        predictedMeals * 1.05
      )
    );


  const ingredients =
    forecast?.ingredients || {};


  const weather =
    forecast?.weather || null;


  const historicalRecords =
    forecast?.historical_records ??
    forecast?.historicalRecords ??
    0;


  // =========================================================
  // INGREDIENTS
  // =========================================================

  const ingredientEntries =
    Object.entries(
      ingredients
    );


  // =========================================================
  // CHECKLIST
  // =========================================================

  const toggleItem = (
    ingredient
  ) => {

    setCheckedItems(
      (previous) => ({
        ...previous,

        [ingredient]:
          !previous[ingredient],
      })
    );
  };


  // =========================================================
  // PROGRESS
  // =========================================================

  const completedCount =
    ingredientEntries.filter(
      ([ingredient]) =>
        checkedItems[ingredient]
    ).length;


  const progress =
    ingredientEntries.length > 0
      ? Math.round(
          (
            completedCount /
            ingredientEntries.length
          ) * 100
        )
      : 0;


  // =========================================================
  // TOTAL INGREDIENT WEIGHT
  // =========================================================

  const totalIngredientWeight =
    useMemo(() => {

      return ingredientEntries.reduce(
        (
          total,
          [, quantity]
        ) =>
          total +
          Number(quantity || 0),
        0
      );

    }, [ingredientEntries]);


  // =========================================================
  // STATUS
  // =========================================================

  const preparationStatus =
    progress === 100
      ? "READY FOR SERVICE"
      : progress >= 50
      ? "PREPARATION IN PROGRESS"
      : progress > 0
      ? "KITCHEN ACTIVE"
      : "READY TO START";


  // =========================================================
  // REFRESH FIREBASE FORECAST
  // =========================================================

  const refreshForecast =
    async () => {

      try {

        setForecastLoading(true);

        setForecastError("");


        const savedForecast =
          await getPrediction(
            forecastDate,
            mealType
          );


        if (savedForecast) {

          setFirebaseForecast(
            savedForecast
          );

          // Reset checklist when forecast
          // changes to a newly generated plan.

          setCheckedItems({});
        }

      } catch (error) {

        console.error(
          "Forecast refresh error:",
          error
        );


        setForecastError(
          error?.message ||
          "Unable to refresh forecast."
        );

      } finally {

        setForecastLoading(false);
      }
    };


  // =========================================================
  // NAVIGATION TO MEAL OPERATIONS
  // =========================================================

  const goToMealOperations = () => {

    navigate(
      "/meal-operations",
      {
        state: {
          forecast: {

            ...(forecast || {}),

            // Always send normalized values.

            predicted_meals:
              predictedMeals,

            recommended_cooking:
              recommendedCooking,

            ingredients,

            meal_type:
              mealType,

            date:
              forecastDate,

            weather,

            historical_records:
              historicalRecords,
          },
        },
      }
    );
  };


  // =========================================================
  // RESET CHECKLIST
  // =========================================================

  const resetChecklist = () => {
    setCheckedItems({});
  };


  // =========================================================
  // NO FORECAST
  // =========================================================

  if (
    !forecastLoading &&
    !forecast
  ) {

    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          background:
            "#f4f8f6",
        }}
      >

        <div
          style={{
            width: "100%",
            maxWidth: "520px",
            padding: "40px",
            borderRadius: "24px",
            background: "#ffffff",
            textAlign: "center",
            boxShadow:
              "0 20px 60px rgba(20,60,45,0.08)",
          }}
        >

          <ChefHat
            size={44}
            style={{
              margin: "0 auto",
              color: "#10b981",
            }}
          />

          <h2
            style={{
              marginTop: "18px",
              fontSize: "24px",
              fontWeight: 700,
              color: "#17352c",
            }}
          >
            No forecast found
          </h2>

          <p
            style={{
              marginTop: "10px",
              color: "#71827c",
            }}
          >
            Generate a forecast first to
            create the preparation plan.
          </p>

          <button
            onClick={() =>
              navigate("/forecast")
            }
            style={{
              marginTop: "24px",
              padding:
                "12px 22px",
              border: "none",
              borderRadius: "12px",
              background:
                "#10b981",
              color: "#ffffff",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Go to Forecast
          </button>

        </div>

      </div>
    );
  }


  // =========================================================
  // RENDER
  // =========================================================

  return (

    <div className="preparation-page">


      {/* ===================================================
          AMBIENT BACKGROUND
          =================================================== */}

      <div className="prep-background">

        <div className="prep-grid" />

        <div className="prep-glow prep-glow-one" />

        <div className="prep-glow prep-glow-two" />

        <div className="prep-particle prep-particle-one" />

        <div className="prep-particle prep-particle-two" />

        <div className="prep-particle prep-particle-three" />

        <div className="prep-particle prep-particle-four" />

      </div>


      {/* ===================================================
          HEADER
          =================================================== */}

      <header className="prep-header">

        <div className="prep-header-inner">


          {/* LEFT */}

          <div className="prep-header-left">

            <button
              className="prep-back-button"
              onClick={() =>
                navigate("/forecast")
              }
            >

              <ArrowLeft size={16} />

              <span>
                Back to Forecast
              </span>

            </button>


            <div className="prep-brand">

              <div className="prep-brand-icon">

                <ChefHat size={19} />

              </div>

              <div>

                <strong>
                  ReFeed
                </strong>

                <span>
                  Kitchen Intelligence
                </span>

              </div>

            </div>

          </div>


          {/* RIGHT */}

          <div className="prep-header-right">

            <div className="prep-live-status">

              <span />

              AI OPERATIONS ONLINE

            </div>


            <button
              className="prep-reset-button"
              onClick={
                refreshForecast
              }
              disabled={
                forecastLoading
              }
            >

              {forecastLoading ? (
                <Loader2
                  size={13}
                  className="animate-spin"
                />
              ) : (
                <RefreshCw
                  size={13}
                />
              )}

              {forecastLoading
                ? "Loading..."
                : "Refresh"}

            </button>


            <button
              className="prep-reset-button"
              onClick={
                resetChecklist
              }
            >

              <RefreshCw
                size={13}
              />

              Reset

            </button>

          </div>

        </div>

      </header>


      {/* ===================================================
          MAIN
          =================================================== */}

      <main className="prep-main">


        {/* =================================================
            FIREBASE STATUS
            ================================================= */}

        {forecastError && (

          <div
            style={{
              marginBottom: "18px",
              padding:
                "12px 16px",
              borderRadius: "12px",
              background:
                "#fff7ed",
              border:
                "1px solid #fed7aa",
              color:
                "#9a3412",
              fontSize: "13px",
            }}
          >
            Firebase forecast refresh:
            {" "}
            {forecastError}
          </div>

        )}


        {/* =================================================
            DATA SOURCE STATUS
            ================================================= */}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent:
              "space-between",
            gap: "12px",
            marginBottom: "16px",
            padding:
              "10px 14px",
            borderRadius: "12px",
            background:
              "rgba(255,255,255,0.72)",
            border:
              "1px solid rgba(16,185,129,0.12)",
            fontSize: "12px",
          }}
        >

          <span
            style={{
              color:
                "#526861",
            }}
          >

            Forecast source:

            {" "}

            <strong
              style={{
                color:
                  firebaseForecast
                    ? "#059669"
                    : "#64748b",
              }}
            >
              {firebaseForecast
                ? "Firebase"
                : "Forecast result"}
            </strong>

          </span>


          <span
            style={{
              color:
                "#64748b",
            }}
          >
            {mealType}
            {" · "}
            {formatDate(
              forecastDate
            )}
          </span>

        </div>


        {/* =================================================
            TOP HERO
            ================================================= */}

        <section className="prep-hero">


          {/* HERO CONTENT */}

          <div className="prep-hero-content">

            <div className="prep-eyebrow">

              <span />

              STEP 03 · PREPARATION

            </div>


            <h1>

              Turn the forecast

              <br />

              into a{" "}

              <em>
                kitchen plan.
              </em>

            </h1>


            <p>

              ReFeed has converted the
              AI demand prediction into
              precise cooking quantities.
              Prepare the ingredients,
              confirm readiness, then
              move directly into meal
              operations.

            </p>


            <div className="prep-hero-tags">

              <HeroTag
                icon={
                  <Users size={13} />
                }
                label="Demand"
                value={`${formatNumber(
                  predictedMeals
                )} meals`}
              />


              <HeroTag
                icon={
                  <ChefHat size={13} />
                }
                label="Cooking"
                value={`${formatNumber(
                  recommendedCooking
                )} meals`}
              />


              <HeroTag
                icon={
                  <Package size={13} />
                }
                label="Ingredients"
                value={`${ingredientEntries.length} items`}
              />

            </div>

          </div>


          {/* 3D CORE */}

          <div className="prep-hero-visual">

            <div className="prep-orbit prep-orbit-one" />

            <div className="prep-orbit prep-orbit-two" />

            <div className="prep-orbit prep-orbit-three" />


            <div className="prep-core-shadow" />


            <div className="prep-ai-core">

              <div className="prep-core-inner">

                <BrainCircuit
                  size={39}
                />

              </div>

              <span>
                AI
              </span>

              <strong>
                KITCHEN
              </strong>

            </div>


            <FloatingIngredient
              className="prep-float-rice"
              name="RICE"
              quantity={
                ingredients.Rice != null
                  ? `${formatQuantity(
                      ingredients.Rice
                    )} kg`
                  : "READY"
              }
              icon={
                <Leaf size={14} />
              }
            />


            <FloatingIngredient
              className="prep-float-dal"
              name="DAL"
              quantity={
                ingredients.Dal != null
                  ? `${formatQuantity(
                      ingredients.Dal
                    )} kg`
                  : "READY"
              }
              icon={
                <Package size={14} />
              }
            />


            <FloatingIngredient
              className="prep-float-veg"
              name="VEGETABLES"
              quantity={
                ingredients.Vegetables != null
                  ? `${formatQuantity(
                      ingredients.Vegetables
                    )} kg`
                  : "READY"
              }
              icon={
                <Utensils size={14} />
              }
            />

          </div>

        </section>


        {/* =================================================
            OPERATION PIPELINE
            ================================================= */}

        <section className="prep-pipeline">

          <PipelineNode
            number="01"
            title="Forecast"
            status="DONE"
            completed
            icon={
              <BrainCircuit
                size={15}
              />
            }
          />

          <PipelineConnector active />

          <PipelineNode
            number="02"
            title="Preparation"
            status="ACTIVE"
            active
            icon={
              <ChefHat
                size={15}
              />
            }
          />

          <PipelineConnector />

          <PipelineNode
            number="03"
            title="Meal Operations"
            status="NEXT"
            icon={
              <Utensils
                size={15}
              />
            }
          />

          <PipelineConnector />

          <PipelineNode
            number="04"
            title="Food Rescue"
            status="LATER"
            icon={
              <Leaf
                size={15}
              />
            }
          />

          <PipelineConnector />

          <PipelineNode
            number="05"
            title="Impact"
            status="LATER"
            icon={
              <Zap
                size={15}
              />
            }
          />

        </section>


        {/* =================================================
            SUMMARY CARDS
            ================================================= */}

        <section className="prep-summary-grid">

          <SummaryCard
            icon={
              <Utensils
                size={18}
              />
            }
            label="MEAL SERVICE"
            value={mealType}
            description={formatDate(
              forecastDate
            )}
          />


          <SummaryCard
            icon={
              <Users
                size={18}
              />
            }
            label="PREDICTED DEMAND"
            value={`${formatNumber(
              predictedMeals
            )}`}
            description="Meals expected"
          />


          <SummaryCard
            icon={
              <ChefHat
                size={18}
              />
            }
            label="COOKING TARGET"
            value={`${formatNumber(
              recommendedCooking
            )}`}
            description="Includes 5% safety buffer"
            highlighted
          />


          <SummaryCard
            icon={
              <Package
                size={18}
              />
            }
            label="TOTAL INGREDIENTS"
            value={`${formatQuantity(
              totalIngredientWeight
            )} kg`}
            description={`${ingredientEntries.length} ingredient types`}
          />

        </section>


        {/* =================================================
            MAIN WORKSPACE
            ================================================= */}

        <section className="prep-workspace">


          {/* =================================================
              INGREDIENT COMMAND TABLE
              ================================================= */}

          <div className="prep-card ingredient-command-card">

            <CardHeading
              eyebrow="KITCHEN INVENTORY"
              title="Ingredient requirements"
              description="Confirm each ingredient as it becomes ready for preparation."
              icon={
                <Package
                  size={17}
                />
              }
            />


            <div className="ingredient-table-header">

              <span>
                INGREDIENT
              </span>

              <span>
                REQUIRED
              </span>

              <span>
                STATUS
              </span>

              <span>
                ACTION
              </span>

            </div>


            <div className="ingredient-list">

              {ingredientEntries.map(
                (
                  [
                    ingredient,
                    quantity,
                  ],
                  index
                ) => {

                  const completed =
                    Boolean(
                      checkedItems[
                        ingredient
                      ]
                    );


                  return (

                    <IngredientRow
                      key={ingredient}
                      index={index}
                      ingredient={
                        ingredient
                      }
                      quantity={
                        quantity
                      }
                      completed={
                        completed
                      }
                      onToggle={() =>
                        toggleItem(
                          ingredient
                        )
                      }
                    />

                  );

                }
              )}

            </div>


            {ingredientEntries.length ===
              0 && (

              <div
                style={{
                  padding:
                    "40px 20px",
                  textAlign:
                    "center",
                  color:
                    "#71827c",
                }}
              >
                No ingredient data was
                returned by the forecast.
              </div>

            )}


            {/* TABLE FOOTER */}

            <div className="ingredient-footer">

              <div>

                <div className="footer-status-icon">

                  <CheckCircle2
                    size={15}
                  />

                </div>

                <div>

                  <span>
                    KITCHEN CHECK
                  </span>

                  <strong>

                    {completedCount} of{" "}

                    {ingredientEntries.length}{" "}

                    ingredients ready

                  </strong>

                </div>

              </div>


              <span className="footer-percentage">

                {progress}%

              </span>

            </div>

          </div>


          {/* =================================================
              PREPARATION CONTROL
              ================================================= */}

          <div className="prep-card control-card">

            <CardHeading
              eyebrow="PREPARATION CONTROL"
              title="Kitchen readiness"
              description="Track the preparation state before service."
              icon={
                <GaugeIcon />
              }
            />


            {/* PROGRESS RING */}

            <div className="prep-progress-area">

              <ProgressRing
                progress={progress}
              />


              <div className="progress-copy">

                <span>
                  CURRENT STATUS
                </span>

                <h3>
                  {preparationStatus}
                </h3>

                <p>

                  {progress === 100

                    ? "All ingredient requirements have been confirmed. The kitchen is ready for meal operations."

                    : `${ingredientEntries.length - completedCount} ingredient${
                        ingredientEntries.length -
                          completedCount ===
                        1
                          ? ""
                          : "s"
                      } still require${
                        ingredientEntries.length -
                          completedCount ===
                        1
                          ? "s"
                          : ""
                      } preparation.`}

                </p>

              </div>

            </div>


            {/* PROGRESS BAR */}

            <div className="large-progress">

              <div className="large-progress-label">

                <span>
                  PREPARATION PROGRESS
                </span>

                <strong>

                  {completedCount}/
                  {
                    ingredientEntries.length
                  }

                </strong>

              </div>


              <div className="large-progress-track">

                <div
                  className="large-progress-fill"
                  style={{
                    width:
                      `${progress}%`,
                  }}
                >

                  <span />

                </div>

              </div>

            </div>


            {/* QUICK CHECKS */}

            <div className="quick-checks">

              <QuickCheck
                icon={
                  <Check
                    size={12}
                  />
                }
                title="Demand verified"
                description={`${formatNumber(
                  predictedMeals
                )} meals predicted`}
              />


              <QuickCheck
                icon={
                  <Check
                    size={12}
                  />
                }
                title="Cooking target"
                description={`${formatNumber(
                  recommendedCooking
                )} meals`}
              />


              <QuickCheck
                icon={
                  <Check
                    size={12}
                  />
                }
                title="Safety buffer"
                description="5% included"
              />

            </div>


            {/* NEXT ACTION */}

            <div className="prep-next-action">

              <div className="next-action-glow" />

              <div className="next-action-content">

                <div className="next-action-icon">

                  <Utensils
                    size={19}
                  />

                </div>

                <div>

                  <span>
                    NEXT OPERATION
                  </span>

                  <strong>
                    Meal Operations
                  </strong>

                  <p>
                    Record cooked and served meals
                    after preparation is complete.
                  </p>

                </div>

              </div>


              <button
                className="continue-operation-button"
                onClick={
                  goToMealOperations
                }
              >

                Continue to Meal Operations

                <ArrowRight
                  size={16}
                />

              </button>

            </div>

          </div>

        </section>


        {/* =================================================
            INTELLIGENCE STRIP
            ================================================= */}

        <section className="prep-intelligence">

          <div className="intelligence-title">

            <div className="intelligence-icon">

              <Sparkles
                size={16}
              />

            </div>

            <div>

              <span>
                AI PREPARATION INTELLIGENCE
              </span>

              <strong>
                Why this plan?
              </strong>

            </div>

          </div>


          <IntelligenceMetric
            label="Predicted demand"
            value={`${formatNumber(
              predictedMeals
            )} meals`}
            icon={
              <Users
                size={14}
              />
            }
          />


          <IntelligenceMetric
            label="Cooking buffer"
            value="+5%"
            icon={
              <ChefHat
                size={14}
              />
            }
          />


          <IntelligenceMetric
            label="Ingredient load"
            value={`${formatQuantity(
              totalIngredientWeight
            )} kg`}
            icon={
              <Package
                size={14}
              />
            }
          />


          <IntelligenceMetric
            label="Historical records"
            value={
              historicalRecords
                ? formatNumber(
                    historicalRecords
                  )
                : "Available"
            }
            icon={
              <Database
                size={14}
              />
            }
          />

        </section>


        {/* =================================================
            WEATHER / CONTEXT
            ================================================= */}

        <section className="prep-context-grid">

          <div className="prep-context-card">

            <div className="context-card-icon">

              <CloudRain
                size={17}
              />

            </div>

            <div>

              <span>
                WEATHER CONTEXT
              </span>

              <strong>

                {weather?.temperature != null
                  ? `${Number(
                      weather.temperature
                    ).toFixed(0)}°C`
                  : "Forecast context"}

              </strong>

              <p>

                {weather

                  ? `${Number(
                      weather.rainfallMm || 0
                    ).toFixed(
                      1
                    )} mm rainfall · ${
                      weather.description ||
                      "Weather signal supplied"
                    }`

                  : "Weather context was supplied to the forecast engine."}

              </p>

            </div>

          </div>


          <div className="prep-context-card">

            <div className="context-card-icon">

              <Thermometer
                size={17}
              />

            </div>

            <div>

              <span>
                SERVICE CONTEXT
              </span>

              <strong>
                {mealType} Service
              </strong>

              <p>
                {formatDate(
                  forecastDate
                )}
              </p>

            </div>

          </div>

        </section>


        {/* =================================================
            WORKFLOW FOOTER
            ================================================= */}

        <section className="prep-workflow-footer">

          <div className="workflow-footer-copy">

            <div className="workflow-footer-eyebrow">

              <span />

              REFEED OPERATIONS

            </div>

            <h2>
              Predict → Prepare → Serve → Rescue
            </h2>

            <p>
              Preparation is the bridge between
              AI demand intelligence and real-world
              food service operations.
            </p>

          </div>


          <div className="workflow-footer-actions">

            <button
              className="view-forecast-button"
              onClick={() =>
                navigate("/forecast")
              }
            >

              <ArrowLeft
                size={14}
              />

              View Forecast

            </button>


            <button
              className="footer-next-button"
              onClick={
                goToMealOperations
              }
            >

              Meal Operations

              <ArrowRight
                size={15}
              />

            </button>

          </div>

        </section>


      </main>

    </div>
  );
}


// =========================================================
// COMPONENTS
// =========================================================

function HeroTag({
  icon,
  label,
  value,
}) {

  return (

    <div className="prep-hero-tag">

      <div className="hero-tag-icon">
        {icon}
      </div>

      <div>

        <span>
          {label}
        </span>

        <strong>
          {value}
        </strong>

      </div>

    </div>
  );
}


// =========================================================

function FloatingIngredient({
  className,
  name,
  quantity,
  icon,
}) {

  return (

    <div
      className={`prep-floating-card ${className}`}
    >

      <div className="floating-icon">
        {icon}
      </div>

      <div>

        <span>
          {name}
        </span>

        <strong>
          {quantity}
        </strong>

      </div>

    </div>
  );
}


// =========================================================

function PipelineNode({
  number,
  title,
  status,
  icon,
  completed = false,
  active = false,
}) {

  return (

    <div
      className={`pipeline-node ${
        completed
          ? "completed"
          : ""
      } ${
        active
          ? "active"
          : ""
      }`}
    >

      <div className="pipeline-node-icon">

        {completed ? (
          <Check size={14} />
        ) : (
          icon
        )}

      </div>

      <div>

        <span>
          {number}
        </span>

        <strong>
          {title}
        </strong>

        <small>
          {status}
        </small>

      </div>

    </div>
  );
}


// =========================================================

function PipelineConnector({
  active = false,
}) {

  return (

    <div
      className={`pipeline-connector ${
        active
          ? "active"
          : ""
      }`}
    />

  );
}


// =========================================================

function SummaryCard({
  icon,
  label,
  value,
  description,
  highlighted = false,
}) {

  return (

    <div
      className={`prep-summary-card ${
        highlighted
          ? "highlighted"
          : ""
      }`}
    >

      <div className="summary-card-top">

        <div className="summary-card-icon">
          {icon}
        </div>

        <span>
          {label}
        </span>

      </div>

      <strong>
        {value}
      </strong>

      <small>
        {description}
      </small>

    </div>
  );
}


// =========================================================

function CardHeading({
  eyebrow,
  title,
  description,
  icon,
}) {

  return (

    <div className="prep-card-heading">

      <div className="card-heading-icon">
        {icon}
      </div>

      <div>

        <span>
          {eyebrow}
        </span>

        <h2>
          {title}
        </h2>

        <p>
          {description}
        </p>

      </div>

    </div>
  );
}


// =========================================================

function IngredientRow({
  ingredient,
  quantity,
  completed,
  onToggle,
  index,
}) {

  return (

    <div
      className={`ingredient-row ${
        completed
          ? "completed"
          : ""
      }`}
    >

      <div className="ingredient-name">

        <div className="ingredient-number">

          {String(
            index + 1
          ).padStart(
            2,
            "0"
          )}

        </div>

        <div className="ingredient-symbol">

          <Utensils
            size={14}
          />

        </div>

        <div>

          <strong>
            {ingredient}
          </strong>

          <span>
            Kitchen requirement
          </span>

        </div>

      </div>


      <div className="ingredient-quantity">

        <strong>
          {formatQuantity(
            quantity
          )}
        </strong>

        <span>
          kg
        </span>

      </div>


      <div className="ingredient-status">

        <span
          className={
            completed
              ? "status-ready"
              : "status-pending"
          }
        >

          <span />

          {completed
            ? "READY"
            : "PENDING"}

        </span>

      </div>


      <button
        className={`ingredient-action ${
          completed
            ? "ready"
            : ""
        }`}
        onClick={
          onToggle
        }
      >

        {completed ? (
          <>
            <Check
              size={13}
            />

            Ready
          </>
        ) : (
          <>
            <CheckCircle2
              size={13}
            />

            Mark Ready
          </>
        )}

      </button>

    </div>
  );
}


// =========================================================

function ProgressRing({
  progress,
}) {

  const radius = 52;

  const circumference =
    2 *
    Math.PI *
    radius;

  const offset =
    circumference -
    (progress / 100) *
      circumference;


  return (

    <div className="progress-ring-wrapper">

      <svg
        className="progress-ring"
        width="140"
        height="140"
        viewBox="0 0 140 140"
      >

        <circle
          className="progress-ring-bg"
          cx="70"
          cy="70"
          r={radius}
        />

        <circle
          className="progress-ring-value"
          cx="70"
          cy="70"
          r={radius}
          strokeDasharray={
            circumference
          }
          strokeDashoffset={
            offset
          }
        />

      </svg>


      <div className="progress-ring-content">

        <strong>

          {progress}

          <span>
            %
          </span>

        </strong>

        <small>
          READY
        </small>

      </div>

    </div>
  );
}


// =========================================================

function QuickCheck({
  icon,
  title,
  description,
}) {

  return (

    <div className="quick-check">

      <div className="quick-check-icon">
        {icon}
      </div>

      <div>

        <strong>
          {title}
        </strong>

        <span>
          {description}
        </span>

      </div>

    </div>
  );
}


// =========================================================

function IntelligenceMetric({
  icon,
  label,
  value,
}) {

  return (

    <div className="intelligence-metric">

      <div className="intelligence-metric-icon">
        {icon}
      </div>

      <div>

        <span>
          {label}
        </span>

        <strong>
          {value}
        </strong>

      </div>

    </div>
  );
}


// =========================================================

function GaugeIcon() {

  return (

    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >

      <path
        d="M4.93 19.07a10 10 0 1 1 14.14 0"
      />

      <path
        d="M12 12l4-4"
      />

      <path
        d="M12 22v-2"
      />

    </svg>
  );
}