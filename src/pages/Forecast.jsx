import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  CalendarDays,
  Check,
  CheckCircle2,
  ChefHat,
  CloudRain,
  CloudSun,
  Database,
  Droplets,
  Info,
  Leaf,
  Loader2,
  LogOut,
  RefreshCw,
  Sparkles,
  Sun,
  Thermometer,
  Users,
  Utensils,
  WandSparkles,
  Wind,
  X,
} from "lucide-react";

import { getWeatherForDate } from "../services/weatherService";
import { getHistoricalDemandBeforeDate } from "../services/mealHistoryService";
import { getForecastPrediction } from "../services/mlService";

import {
  savePrediction,
  getLatestPrediction,
} from "../services/predictionService";

import { logoutUser } from "../firebase/auth";

import "./Forecast.css";


/* =========================================================
   CONSTANTS
   ========================================================= */

const DEFAULT_POPULATION = 1000;


/* =========================================================
   DATE HELPERS
   ========================================================= */

const getToday = () => {
  return new Date()
    .toISOString()
    .split("T")[0];
};

const getTomorrow = () => {
  const date = new Date();

  date.setDate(
    date.getDate() + 1
  );

  return date
    .toISOString()
    .split("T")[0];
};


/* =========================================================
   SAFE VALUE HELPERS
   ========================================================= */

/*
  Very important:
  Firebase may contain old explanation objects such as:

  {
    summary: "...",
    recommendation: "..."
  }

  React cannot render the entire object directly.

  This helper safely converts any value into something
  React can display.
*/

const safeText = (
  value,
  fallback = ""
) => {
  if (
    value === null ||
    value === undefined
  ) {
    return fallback;
  }

  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    return String(value);
  }

  if (typeof value === "object") {
    return (
      value.summary ||
      value.recommendation ||
      value.description ||
      fallback
    );
  }

  return fallback;
};


const normalizeExplanation = (
  explanation,
  fallback = ""
) => {
  if (!explanation) {
    return {
      summary: fallback,
      recommendation: "",
    };
  }

  if (
    typeof explanation === "string"
  ) {
    return {
      summary: explanation,
      recommendation: "",
    };
  }

  if (
    typeof explanation === "object"
  ) {
    return {
      summary: safeText(
        explanation.summary,
        fallback
      ),
      recommendation: safeText(
        explanation.recommendation,
        ""
      ),
    };
  }

  return {
    summary: fallback,
    recommendation: "",
  };
};


/* =========================================================
   FORMATTERS
   ========================================================= */

const formatNumber = (value) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "0";
  }

  return number.toLocaleString("en-IN");
};


const formatDecimal = (
  value,
  decimals = 1
) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "0";
  }

  return number.toFixed(decimals);
};


const formatDate = (date) => {
  if (!date) {
    return "";
  }

  const parsed = new Date(
    `${date}T00:00:00`
  );

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


const getDayTypeLabel = (
  dayType
) => {
  const labels = {
    regular: "Regular class day",
    exam: "Exam day",
    holiday: "Holiday",
  };

  return (
    labels[dayType] ||
    "Regular class day"
  );
};


/* =========================================================
   WEATHER
   ========================================================= */

const getWeatherIcon = (
  category
) => {
  const value = String(
    category || ""
  ).toLowerCase();

  if (
    value === "rain" ||
    value === "storm"
  ) {
    return (
      <CloudRain size={30} />
    );
  }

  if (value === "hot") {
    return (
      <Sun size={30} />
    );
  }

  return (
    <CloudSun size={30} />
  );
};


/* =========================================================
   SMALL COMPONENTS
   ========================================================= */

function SectionHeader({
  number,
  title,
  description,
  icon,
}) {
  return (
    <div className="forecast-section-header">

      <div className="section-icon">
        {icon}
      </div>

      <div className="section-header-text">

        <span>
          {number}
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


function LoadingBox({
  title,
  description,
}) {
  return (
    <div className="forecast-loading">

      <div className="loading-icon">
        <Loader2
          size={22}
          className="spin"
        />
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


/* =========================================================
   MAIN COMPONENT
   ========================================================= */

export default function Forecast() {

  const navigate =
    useNavigate();


  /* =======================================================
     INPUTS
     ======================================================= */

  const [date, setDate] =
    useState(getTomorrow());

  const [mealType, setMealType] =
    useState("Lunch");

  const [dayType, setDayType] =
    useState("regular");

  const [
    campusPopulation,
    setCampusPopulation,
  ] = useState(
    DEFAULT_POPULATION
  );

  const [
    isFestival,
    setIsFestival,
  ] = useState(false);


  /* =======================================================
     WEATHER
     ======================================================= */

  const [weather, setWeather] =
    useState(null);

  const [
    weatherLoading,
    setWeatherLoading,
  ] = useState(false);

  const [
    weatherError,
    setWeatherError,
  ] = useState("");


  /* =======================================================
     HISTORY
     ======================================================= */

  const [history, setHistory] =
    useState([]);

  const [
    historyLoading,
    setHistoryLoading,
  ] = useState(false);

  const [
    historyError,
    setHistoryError,
  ] = useState("");


  /* =======================================================
     PREDICTION
     ======================================================= */

  const [
    prediction,
    setPrediction,
  ] = useState(null);

  const [
    predictionLoading,
    setPredictionLoading,
  ] = useState(false);

  const [
    predictionError,
    setPredictionError,
  ] = useState("");


  /* =======================================================
     SAVE
     ======================================================= */

  const [
    predictionSaving,
    setPredictionSaving,
  ] = useState(false);

  const [
    predictionSaved,
    setPredictionSaved,
  ] = useState(false);

  const [
    predictionSaveError,
    setPredictionSaveError,
  ] = useState("");


  /* =======================================================
     RESTORE
     ======================================================= */

  const [
    restoredFromDatabase,
    setRestoredFromDatabase,
  ] = useState(false);

  const [
    restoring,
    setRestoring,
  ] = useState(true);


  /* =======================================================
     REFRESH
     ======================================================= */

  const [
    refreshKey,
    setRefreshKey,
  ] = useState(0);


  /* =======================================================
     RESET PREDICTION
     ======================================================= */

  const resetPrediction = () => {
    setPrediction(null);
    setPredictionSaved(false);
    setPredictionError("");
    setPredictionSaveError("");
    setRestoredFromDatabase(false);
  };


  /* =======================================================
     RESTORE SAVED FORECAST
     ======================================================= */

  useEffect(() => {

    let cancelled = false;

    const restore = async () => {

      try {

        setRestoring(true);

        const saved =
          await getLatestPrediction();

        if (
          cancelled ||
          !saved
        ) {
          return;
        }


        const safeExplanation =
          normalizeExplanation(
            saved.explanation,
            "This forecast was created using previous meal demand and campus conditions."
          );


        const restored = {
          ...saved,

          explanation:
            safeExplanation,

          ingredients:
            saved.ingredients &&
              typeof saved.ingredients ===
              "object"
              ? saved.ingredients
              : {},
        };


        if (cancelled) {
          return;
        }


        setDate(
          saved.date ||
          getTomorrow()
        );

        setMealType(
          saved.meal_type ||
          "Lunch"
        );

        setDayType(
          saved.day_type ||
          "regular"
        );

        setCampusPopulation(
          Number(
            saved.campus_population
          ) ||
          DEFAULT_POPULATION
        );

        setIsFestival(
          Number(
            saved.is_festival
          ) === 1
        );

        setPrediction(
          restored
        );

        setPredictionSaved(
          true
        );

        setRestoredFromDatabase(
          true
        );

      } catch (error) {

        console.error(
          "Could not restore saved forecast:",
          error
        );

      } finally {

        if (!cancelled) {
          setRestoring(false);
        }

      }
    };


    restore();


    return () => {
      cancelled = true;
    };

  }, []);


  /* =======================================================
     WEATHER
     ======================================================= */

  useEffect(() => {

    let cancelled = false;

    const loadWeather =
      async () => {

        if (!date) {
          return;
        }

        try {

          setWeatherLoading(true);
          setWeatherError("");

          const result =
            await getWeatherForDate(
              date
            );

          if (
            !cancelled
          ) {

            setWeather(
              result
            );

          }

        } catch (error) {

          console.error(
            "Weather error:",
            error
          );

          if (
            !cancelled
          ) {

            setWeather(null);

            setWeatherError(
              error?.message ||
              "Weather information could not be loaded."
            );

          }

        } finally {

          if (!cancelled) {
            setWeatherLoading(false);
          }

        }
      };


    loadWeather();


    return () => {
      cancelled = true;
    };

  }, [
    date,
    refreshKey,
  ]);


  /* =======================================================
     HISTORY
     ======================================================= */

  useEffect(() => {

    let cancelled = false;

    const loadHistory =
      async () => {

        if (
          !date ||
          !mealType
        ) {
          return;
        }

        try {

          setHistoryLoading(true);
          setHistoryError("");

          const records =
            await getHistoricalDemandBeforeDate(
              mealType,
              date,
              1000
            );

          if (
            !cancelled
          ) {

            setHistory(
              Array.isArray(records)
                ? records
                : []
            );

          }

        } catch (error) {

          console.error(
            "History error:",
            error
          );

          if (
            !cancelled
          ) {

            setHistory([]);

            setHistoryError(
              error?.message ||
              "Previous meal records could not be loaded."
            );

          }

        } finally {

          if (!cancelled) {
            setHistoryLoading(false);
          }

        }

      };


    loadHistory();


    return () => {
      cancelled = true;
    };

  }, [
    date,
    mealType,
    refreshKey,
  ]);


  /* =======================================================
     HISTORY STATISTICS
     ======================================================= */

  const statistics =
    useMemo(() => {

      const records =
        history
          .filter(
            (item) =>
              item &&
              item.date &&
              Number.isFinite(
                Number(
                  item.actual_headcount
                )
              )
          )
          .sort(
            (a, b) =>
              String(a.date)
                .localeCompare(
                  String(b.date)
                )
          );


      const values =
        records.map(
          (item) =>
            Number(
              item.actual_headcount
            )
        );


      const average =
        values.length
          ? values.reduce(
            (sum, value) =>
              sum + value,
            0
          ) /
          values.length
          : null;


      const rolling =
        (window) => {

          if (
            !values.length
          ) {
            return null;
          }

          const slice =
            values.slice(
              -window
            );

          return (
            slice.reduce(
              (sum, value) =>
                sum + value,
              0
            ) /
            slice.length
          );

        };


      const first =
        values[0];

      const last =
        values[
        values.length - 1
        ];


      let trend = 0;


      if (
        Number.isFinite(
          first
        ) &&
        Number.isFinite(
          last
        ) &&
        first !== 0
      ) {

        trend =
          ((last - first) /
            first) *
          100;

      }


      return {

        records,

        count:
          values.length,

        average,

        recentAverage:
          rolling(7),

        average14:
          rolling(14),

        average30:
          rolling(30),

        yesterday:
          values.length >= 1
            ? values[
            values.length - 1
            ]
            : null,

        sevenDaysAgo:
          values.length >= 7
            ? values[
            values.length - 7
            ]
            : null,

        fourteenDaysAgo:
          values.length >= 14
            ? values[
            values.length - 14
            ]
            : null,

        trend,

      };

    }, [history]);


  /* =======================================================
     EXPLANATION
     ======================================================= */

  const createExplanation =
    (result) => {

      const predicted =
        Number(
          result?.predicted_meals
        ) || 0;


      const recent =
        Number(
          statistics.recentAverage
        );


      const messages = [];


      if (
        Number.isFinite(
          recent
        ) &&
        recent > 0
      ) {

        const difference =
          ((predicted - recent) /
            recent) *
          100;


        if (
          difference > 5
        ) {

          messages.push(
            `Expected demand is about ${Math.round(
              difference
            )}% higher than the recent 7-day average.`
          );

        } else if (
          difference < -5
        ) {

          messages.push(
            `Expected demand is about ${Math.round(
              Math.abs(difference)
            )}% lower than the recent 7-day average.`
          );

        } else {

          messages.push(
            "Expected demand is close to the recent 7-day average."
          );

        }

      }


      if (
        dayType === "exam"
      ) {

        messages.push(
          "Exam-day activity has been included because campus attendance can change."
        );

      }


      if (
        dayType === "holiday"
      ) {

        messages.push(
          "Holiday conditions have been included because normal campus attendance may be lower."
        );

      }


      if (
        isFestival
      ) {

        messages.push(
          "The special event setting has been included because it may change normal meal demand."
        );

      }


      messages.push(
        `${formatNumber(
          Number(campusPopulation) || 0
        )} students are expected on campus.`
      );


      return messages.join(
        " "
      );

    };


  /* =======================================================
     GENERATE FORECAST
     ======================================================= */

  const generateForecast =
    async () => {

      setPredictionError("");
      setPredictionSaveError("");
      setPredictionSaved(false);
      setRestoredFromDatabase(false);


      try {

        setPredictionLoading(
          true
        );


        const result =
          await getForecastPrediction({
            date,
            mealType,
            dayType,
            campusPopulation:
              Number(
                campusPopulation
              ) ||
              DEFAULT_POPULATION,
            isFestival:
              isFestival ? 1 : 0,
            temperature:
              Number(
                weather?.temperature
              ) || 28,
            rainfallMm:
              Number(
                weather?.rainfallMm
              ) || 0,
            history,
          });


        const explanation =
          createExplanation(
            result
          );


        const cleanResult = {
          ...result,

          explanation: {
            summary:
              explanation,

            recommendation:
              `Prepare around ${formatNumber(
                result?.recommended_cooking
              )} meals including the safety buffer.`,
          },
        };


        setPrediction(
          cleanResult
        );


        /* ---------------------------------------------
           SAVE TO FIREBASE
           --------------------------------------------- */

        try {

          setPredictionSaving(
            true
          );


          await savePrediction({
            date,
            mealType,
            dayType,
            campusPopulation:
              Number(
                campusPopulation
              ) ||
              DEFAULT_POPULATION,
            isFestival:
              isFestival ? 1 : 0,
            weather,

            predictedMeals:
              result?.predicted_meals,

            recommendedCooking:
              result?.recommended_cooking,

            ingredients:
              result?.ingredients || {},

            historicalRecords:
              history.length,

            historicalFeatures:
              result?.historical_features ||
              {},

            model:
              result?.model ||
              "XGBoost",

            explanation: {
              summary:
                explanation,

              recommendation:
                `Prepare around ${formatNumber(
                  result?.recommended_cooking
                )} meals including the safety buffer.`,
            },
          });


          setPredictionSaved(
            true
          );


        } catch (error) {

          console.error(
            "Firebase save error:",
            error
          );

          setPrediction(
            null
          );

          setPredictionSaveError(
            error?.message ||
            "The prediction was generated but could not be saved."
          );

        } finally {

          setPredictionSaving(
            false
          );

        }

      } catch (error) {

        console.error(
          "Prediction error:",
          error
        );

        setPrediction(null);

        setPredictionError(
          error?.message ||
          "The AI could not generate a forecast."
        );

      } finally {

        setPredictionLoading(
          false
        );

      }

    };


  /* =======================================================
     LOGOUT
     ======================================================= */

  const logout = async () => {

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


  /* =======================================================
     REFRESH
     ======================================================= */

  const refresh = () => {

    setRefreshKey(
      (value) => value + 1
    );

  };


  /* =======================================================
     PREPARATION
     ======================================================= */

  const continueToPreparation =
    () => {

      if (!prediction) {
        return;
      }

      navigate(
        "/preparation",
        {
          state: {
            forecast:
              prediction,

            date,

            mealType,
          },
        }
      );

    };


  /* =======================================================
     RESTORING SCREEN
     ======================================================= */

  if (restoring) {

    return (
      <div className="forecast-page forecast-startup">

        <div className="startup-card">

          <div className="startup-logo">
            <Leaf size={27} />
          </div>

          <Loader2
            size={22}
            className="spin"
          />

          <strong>
            Loading your meal forecast
          </strong>

          <span>
            Restoring your saved ReFeed data...
          </span>

        </div>

      </div>
    );

  }


  /* =======================================================
     PAGE
     ======================================================= */

  return (

    <div className="forecast-page">

      {/* BACKGROUND */}

      <div
        className="forecast-background"
        aria-hidden="true"
      >
        <div className="background-glow glow-left" />
        <div className="background-glow glow-right" />
      </div>


      {/* ===================================================
          NAVIGATION
          =================================================== */}

      <header className="forecast-navbar">

        <div className="nav-left">

          <button
            type="button"
            className="nav-back"
            onClick={() =>
              navigate(
                "/dashboard"
              )
            }
          >
            <ArrowLeft size={18} />
          </button>


          <div className="brand">

            <div className="brand-logo">
              <Leaf size={18} />
            </div>

            <div>
              <strong>
                ReFeed
              </strong>

              <span>
                Smart Meal Planning
              </span>
            </div>

          </div>

        </div>


        <div className="nav-right">

          <div className="ai-status">
            <span />
            AI forecasting active
          </div>


          <button
            type="button"
            className="nav-refresh"
            onClick={refresh}
            title="Refresh"
          >
            <RefreshCw
              size={17}
              className={
                weatherLoading ||
                  historyLoading
                  ? "spin"
                  : ""
              }
            />
          </button>


          <button
            type="button"
            className="nav-logout"
            onClick={logout}
          >
            <LogOut size={16} />
            <span>
              Sign out
            </span>
          </button>

        </div>

      </header>


      {/* ===================================================
          CONTENT
          =================================================== */}

      <main className="forecast-content">


        {/* HERO */}

        <section className="forecast-hero">

          <div className="hero-copy">

            <div className="hero-label">
              <Sparkles size={14} />
              AI-POWERED MEAL FORECAST
            </div>


            <h1>
              Know how much food
              <span>your campus needs.</span>
            </h1>


            <p>
              ReFeed combines previous meal demand,
              campus attendance, calendar information
              and weather conditions to estimate how
              many meals your canteen should prepare.
            </p>


            <div className="hero-actions">

              <a
                href="#forecast-settings"
                className="hero-button"
              >
                Start planning
                <ArrowRight size={17} />
              </a>


              <div className="hero-safe">
                <CheckCircle2 size={16} />
                Forecasts are saved automatically
              </div>

            </div>

          </div>


          <div className="hero-visual">

            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />

            <div className="ai-circle">

              <BrainCircuit
                size={39}
              />

              <strong>
                AI
              </strong>

              <span>
                XGBoost
              </span>

            </div>


            <div className="floating-card card-one">

              <Users size={17} />

              <div>
                <span>
                  Student demand
                </span>

                <strong>
                  Analysed
                </strong>
              </div>

            </div>


            <div className="floating-card card-two">

              <CloudSun size={17} />

              <div>
                <span>
                  Weather
                </span>

                <strong>
                  Included
                </strong>
              </div>

            </div>


            <div className="floating-card card-three">

              <CheckCircle2 size={16} />

              Forecast saved

            </div>

          </div>

        </section>


        {/* RESTORED */}

        {restoredFromDatabase && (
          <div className="restored-banner">

            <div className="restored-icon">
              <Database size={18} />
            </div>

            <div>

              <strong>
                Saved forecast restored
              </strong>

              <span>
                We loaded your previous forecast from Firebase.
              </span>

            </div>

            <button
              type="button"
              onClick={() => {
                setPrediction(null);
                setPredictionSaved(false);
                setRestoredFromDatabase(false);
              }}
            >
              <X size={17} />
            </button>

          </div>
        )}


        {/* PROCESS */}

        <div className="forecast-process">

          <div className="process-item active">
            <span>1</span>

            <div>
              <strong>
                Choose the day
              </strong>

              <small>
                Date and meal
              </small>
            </div>
          </div>


          <div className="process-arrow">
            <ArrowRight size={15} />
          </div>


          <div className="process-item">
            <span>2</span>

            <div>
              <strong>
                Understand the day
              </strong>

              <small>
                Weather and history
              </small>
            </div>
          </div>


          <div className="process-arrow">
            <ArrowRight size={15} />
          </div>


          <div className="process-item">
            <span>3</span>

            <div>
              <strong>
                Predict meals
              </strong>

              <small>
                XGBoost forecast
              </small>
            </div>
          </div>


          <div className="process-arrow">
            <ArrowRight size={15} />
          </div>


          <div className="process-item">
            <span>4</span>

            <div>
              <strong>
                Prepare food
              </strong>

              <small>
                Cooking quantities
              </small>
            </div>
          </div>

        </div>


        {/* =================================================
            SETTINGS + WEATHER
            ================================================= */}

        <section
          id="forecast-settings"
          className="top-grid"
        >


          {/* SETTINGS */}

          <div className="forecast-card">

            <SectionHeader
              number="01"
              title="Plan the meal"
              description="Tell ReFeed about the day you want to plan."
              icon={
                <CalendarDays size={19} />
              }
            />


            <div className="form">

              <div className="field">

                <label>
                  Which day are you planning for?
                </label>

                <div className="input-box">

                  <CalendarDays
                    size={18}
                  />

                  <input
                    type="date"
                    min={getToday()}
                    value={date}
                    onChange={(event) => {
                      setDate(
                        event.target.value
                      );
                      resetPrediction();
                    }}
                  />

                </div>

                <small>
                  {formatDate(date)}
                </small>

              </div>


              <div className="field">

                <label>
                  Which meal?
                </label>

                <div className="meal-buttons">

                  <button
                    type="button"
                    className={
                      mealType ===
                        "Lunch"
                        ? "meal-button selected"
                        : "meal-button"
                    }
                    onClick={() => {
                      setMealType(
                        "Lunch"
                      );
                      resetPrediction();
                    }}
                  >

                    <Utensils
                      size={18}
                    />

                    <div>
                      <strong>
                        Lunch
                      </strong>

                      <span>
                        Midday meal
                      </span>
                    </div>

                    {mealType ===
                      "Lunch" && (
                        <Check
                          size={16}
                        />
                      )}

                  </button>


                  <button
                    type="button"
                    className={
                      mealType ===
                        "Dinner"
                        ? "meal-button selected"
                        : "meal-button"
                    }
                    onClick={() => {
                      setMealType(
                        "Dinner"
                      );
                      resetPrediction();
                    }}
                  >

                    <ChefHat
                      size={18}
                    />

                    <div>
                      <strong>
                        Dinner
                      </strong>

                      <span>
                        Evening meal
                      </span>
                    </div>

                    {mealType ===
                      "Dinner" && (
                        <Check
                          size={16}
                        />
                      )}

                  </button>

                </div>

              </div>


              <div className="two-fields">

                <div className="field">

                  <label>
                    What kind of day?
                  </label>

                  <select
                    value={dayType}
                    onChange={(event) => {
                      setDayType(
                        event.target.value
                      );
                      resetPrediction();
                    }}
                  >

                    <option value="regular">
                      Regular class day
                    </option>

                    <option value="exam">
                      Exam day
                    </option>

                    <option value="holiday">
                      Holiday
                    </option>

                  </select>

                </div>


                <div className="field">

                  <label>
                    Students expected
                  </label>

                  <div className="input-box">

                    <Users
                      size={17}
                    />

                    <input
                      type="number"
                      min="0"
                      value={
                        campusPopulation
                      }
                      onChange={(event) => {
                        setCampusPopulation(
                          Math.max(
                            0,
                            Number(
                              event.target.value
                            ) || 0
                          )
                        );

                        resetPrediction();
                      }}
                    />

                  </div>

                </div>

              </div>


              <div className="special-event">

                <div className="special-event-copy">

                  <div className="special-icon">
                    <Sparkles
                      size={17}
                    />
                  </div>

                  <div>

                    <strong>
                      Special event or festival
                    </strong>

                    <span>
                      Include this if something unusual
                      may change normal attendance.
                    </span>

                  </div>

                </div>


                <button
                  type="button"
                  className={
                    isFestival
                      ? "switch active"
                      : "switch"
                  }
                  onClick={() => {
                    setIsFestival(
                      (value) =>
                        !value
                    );

                    resetPrediction();
                  }}
                  aria-label="Toggle special event"
                >
                  <span />
                </button>

              </div>

            </div>

          </div>


          {/* WEATHER */}

          <div className="forecast-card">

            <SectionHeader
              number="02"
              title="Weather conditions"
              description="Weather is included because it can affect campus meal demand."
              icon={
                <CloudSun size={19} />
              }
            />


            {weatherLoading ? (

              <LoadingBox
                title="Checking weather"
                description="Getting weather information for the selected date."
              />

            ) : weatherError ? (

              <div className="error-box">

                <AlertCircle
                  size={20}
                />

                <div>

                  <strong>
                    Weather unavailable
                  </strong>

                  <span>
                    {weatherError}
                  </span>

                </div>

              </div>

            ) : weather ? (

              <div className="weather-box">

                <div className="weather-main">

                  <div className="weather-icon">
                    {getWeatherIcon(
                      weather.category
                    )}
                  </div>

                  <div>

                    <span>
                      Expected temperature
                    </span>

                    <strong>
                      {formatDecimal(
                        weather.temperature,
                        0
                      )}
                      °C
                    </strong>

                    <small>
                      {safeText(
                        weather.description,
                        "Weather conditions"
                      )}
                    </small>

                  </div>

                </div>


                <div className="weather-stats">

                  <div>

                    <Droplets
                      size={16}
                    />

                    <span>
                      Rainfall
                    </span>

                    <strong>
                      {formatDecimal(
                        weather.rainfallMm,
                        1
                      )}{" "}
                      mm
                    </strong>

                  </div>


                  <div>

                    <Thermometer
                      size={16}
                    />

                    <span>
                      Temperature
                    </span>

                    <strong>
                      {formatDecimal(
                        weather.temperature,
                        0
                      )}
                      °C
                    </strong>

                  </div>


                  <div>

                    <Wind
                      size={16}
                    />

                    <span>
                      Used by AI
                    </span>

                    <strong>
                      Yes
                    </strong>

                  </div>

                </div>


                <div className="weather-note">

                  <Info size={14} />

                  Weather information is automatically
                  sent to the prediction model.

                </div>

              </div>

            ) : (

              <div className="empty-box">
                Weather information will appear here.
              </div>

            )}

          </div>

        </section>


        {/* =================================================
            HISTORY
            ================================================= */}

        <section className="forecast-card history-card">

          <SectionHeader
            number="03"
            title="Previous meal demand"
            description="ReFeed looks at your saved meal records to understand the usual demand pattern."
            icon={
              <Database size={19} />
            }
          />


          {historyLoading ? (

            <LoadingBox
              title="Loading previous meals"
              description="Checking your saved canteen records."
            />

          ) : historyError ? (

            <div className="error-box">

              <AlertCircle
                size={20}
              />

              <div>

                <strong>
                  Meal history unavailable
                </strong>

                <span>
                  {historyError}
                </span>

              </div>

            </div>

          ) : statistics.count === 0 ? (

            <div className="empty-box large">

              <Database
                size={25}
              />

              <strong>
                No previous meal records
              </strong>

              <span>
                ReFeed will use its fallback values.
                As more canteen records are stored,
                future forecasts can use them.
              </span>

            </div>

          ) : (

            <>

              <div className="history-grid">

                <div className="history-stat">

                  <span>
                    Saved records
                  </span>

                  <strong>
                    {formatNumber(
                      statistics.count
                    )}
                  </strong>

                  <small>
                    meal records
                  </small>

                </div>


                <div className="history-stat">

                  <span>
                    Recent 7-day average
                  </span>

                  <strong>
                    {formatNumber(
                      Math.round(
                        statistics.recentAverage
                      )
                    )}
                  </strong>

                  <small>
                    meals per day
                  </small>

                </div>


                <div className="history-stat">

                  <span>
                    Overall average
                  </span>

                  <strong>
                    {formatNumber(
                      Math.round(
                        statistics.average
                      )
                    )}
                  </strong>

                  <small>
                    meals per recorded day
                  </small>

                </div>


                <div className="history-stat">

                  <span>
                    Demand trend
                  </span>

                  <strong>
                    {statistics.count >
                      1
                      ? `${statistics.trend >=
                        0
                        ? "+"
                        : ""
                      }${formatDecimal(
                        statistics.trend,
                        0
                      )}%`
                      : "—"}
                  </strong>

                  <small>
                    across records
                  </small>

                </div>

              </div>


              <div className="history-recent">

                <div>
                  <span>
                    Yesterday
                  </span>

                  <strong>
                    {statistics.yesterday !==
                      null
                      ? `${formatNumber(
                        statistics.yesterday
                      )} meals`
                      : "Not available"}
                  </strong>
                </div>


                <div>
                  <span>
                    7 days ago
                  </span>

                  <strong>
                    {statistics.sevenDaysAgo !==
                      null
                      ? `${formatNumber(
                        statistics.sevenDaysAgo
                      )} meals`
                      : "Not available"}
                  </strong>
                </div>


                <div>
                  <span>
                    14 days ago
                  </span>

                  <strong>
                    {statistics.fourteenDaysAgo !==
                      null
                      ? `${formatNumber(
                        statistics.fourteenDaysAgo
                      )} meals`
                      : "Not available"}
                  </strong>
                </div>


                <div>
                  <span>
                    Last 30 days
                  </span>

                  <strong>
                    {statistics.average30 !==
                      null
                      ? `${formatNumber(
                        Math.round(
                          statistics.average30
                        )
                      )} average`
                      : "Not available"}
                  </strong>
                </div>

              </div>

            </>

          )}

        </section>


        {/* =================================================
            ERROR
            ================================================= */}

        {predictionError && (

          <div className="main-error">

            <AlertCircle
              size={21}
            />

            <div>

              <strong>
                Forecast could not be generated
              </strong>

              <span>
                {predictionError}
              </span>

            </div>

          </div>

        )}


        {predictionSaveError && (

          <div className="main-error save-error">

            <Database
              size={21}
            />

            <div>

              <strong>
                Forecast was not saved
              </strong>

              <span>
                {predictionSaveError}
              </span>

            </div>

          </div>

        )}


        {/* =================================================
            GENERATE
            ================================================= */}

        {!prediction && (

          <section className="generate-section">

            <div className="generate-copy">

              <div className="generate-icon">
                <WandSparkles
                  size={24}
                />
              </div>

              <div>

                <span>
                  READY TO PREDICT
                </span>

                <h2>
                  Find out how many meals to prepare
                </h2>

                <p>
                  ReFeed will analyse the information above,
                  run the XGBoost model and save the result
                  to your Firebase database.
                </p>

              </div>

            </div>


            <button
              type="button"
              className="generate-button"
              disabled={
                predictionLoading ||
                predictionSaving
              }
              onClick={
                generateForecast
              }
            >

              {predictionLoading ? (

                <>
                  <Loader2
                    size={19}
                    className="spin"
                  />

                  Analysing demand...
                </>

              ) : predictionSaving ? (

                <>
                  <Database
                    size={19}
                  />

                  Saving forecast...

                </>

              ) : (

                <>
                  Predict meal demand
                  <ArrowRight
                    size={18}
                  />
                </>

              )}

            </button>

          </section>

        )}


        {/* =================================================
            RESULT
            ================================================= */}

        {prediction && (

          <section className="result-section">

            <div className="result-heading">

              <div>

                <div className="result-label">

                  <CheckCircle2
                    size={15}
                  />

                  FORECAST READY

                </div>


                <h2>
                  Your {mealType.toLowerCase()} plan
                  for {formatDate(date)}
                </h2>


                <p>
                  ReFeed has estimated the number
                  of meals your canteen should prepare.
                </p>

              </div>


              {predictionSaved && (

                <div className="saved-badge">

                  <CheckCircle2
                    size={17}
                  />

                  <div>

                    <strong>
                      Saved successfully
                    </strong>

                    <span>
                      Stored in Firebase
                    </span>

                  </div>

                </div>

              )}

            </div>


            {/* MAIN NUMBERS */}

            <div className="result-numbers">

              <div className="expected-card">

                <div className="result-card-label">

                  <Users size={19} />

                  Expected meals

                </div>


                <strong>
                  {formatNumber(
                    prediction.predicted_meals
                  )}
                </strong>


                <span>
                  students are expected to eat
                  {` ${mealType.toLowerCase()}`}
                </span>


                <div className="result-explanation-mini">

                  <BrainCircuit
                    size={14}
                  />

                  Based on previous demand,
                  weather and campus conditions.

                </div>

              </div>


              <div className="prepare-card">

                <div className="result-card-label">

                  <ChefHat size={19} />

                  Meals to prepare

                </div>


                <strong>
                  {formatNumber(
                    prediction.recommended_cooking
                  )}
                </strong>


                <span>
                  meals including a small safety buffer
                </span>


                <div className="buffer-badge">
                  +5% preparation buffer
                </div>

              </div>

            </div>


            {/* INGREDIENTS */}

            <div className="result-panel">

              <div className="result-panel-title">

                <div>

                  <span>
                    KITCHEN PREPARATION
                  </span>

                  <h3>
                    Suggested ingredients
                  </h3>

                </div>

                <ChefHat size={20} />

              </div>


              <div className="ingredient-grid">

                {Object.entries(
                  prediction.ingredients || {}
                ).map(
                  ([name, quantity]) => (

                    <div
                      className="ingredient"
                      key={name}
                    >

                      <div className="ingredient-icon">
                        <Leaf size={16} />
                      </div>

                      <div>

                        <span>
                          {safeText(
                            name,
                            "Ingredient"
                          )}
                        </span>

                        <strong>
                          {formatDecimal(
                            quantity,
                            2
                          )} kg
                        </strong>

                      </div>

                    </div>

                  )
                )}

              </div>

            </div>


            {/* EXPLANATION */}

            <div className="insight-grid">

              <div className="insight-card">

                <div className="insight-icon">
                  <BrainCircuit
                    size={19}
                  />
                </div>

                <div>

                  <span>
                    WHY THIS FORECAST?
                  </span>

                  <h3>
                    What ReFeed found
                  </h3>

                  <p>
                    {safeText(
                      prediction
                        ?.explanation
                        ?.summary,
                      "The forecast combines previous meal demand, campus attendance, calendar information and weather."
                    )}
                  </p>


                  {safeText(
                    prediction
                      ?.explanation
                      ?.recommendation
                  ) && (

                      <div className="recommendation">

                        <CheckCircle2
                          size={15}
                        />

                        <span>
                          {safeText(
                            prediction
                              ?.explanation
                              ?.recommendation
                          )}
                        </span>

                      </div>

                    )}

                </div>

              </div>


              <div className="insight-card">

                <div className="insight-icon blue">
                  <Database size={19} />
                </div>

                <div>

                  <span>
                    INFORMATION USED
                  </span>

                  <h3>
                    What the AI considered
                  </h3>


                  <div className="used-list">

                    <div>
                      <Check size={14} />
                      {formatNumber(
                        prediction.historical_records ||
                        statistics.count
                      )}{" "}
                      previous meal records
                    </div>


                    <div>
                      <Check size={14} />
                      {getDayTypeLabel(
                        dayType
                      )}
                    </div>


                    <div>
                      <Check size={14} />
                      Weather conditions
                    </div>


                    <div>
                      <Check size={14} />
                      {formatNumber(
                        Number(
                          campusPopulation
                        ) || 0
                      )}{" "}
                      expected students
                    </div>


                    {isFestival && (

                      <div>
                        <Check size={14} />
                        Special event included
                      </div>

                    )}

                  </div>

                </div>

              </div>

            </div>


            {/* ACTIONS */}

            <div className="result-actions">

              <button
                type="button"
                className="secondary-button"
                onClick={() => {

                  setPrediction(null);
                  setPredictionSaved(false);
                  setRestoredFromDatabase(
                    false
                  );

                  window.scrollTo({
                    top: 0,
                    behavior: "smooth",
                  });

                }}
              >
                <RefreshCw size={16} />
                Make another forecast
              </button>


              <button
                type="button"
                className="primary-button"
                onClick={
                  continueToPreparation
                }
              >
                Continue to preparation
                <ArrowRight size={17} />
              </button>

            </div>

          </section>

        )}


        {/* FOOTER */}

        <footer className="forecast-footer">

          <div className="footer-brand">

            <div className="brand-logo small">
              <Leaf size={15} />
            </div>

            <div>

              <strong>
                ReFeed
              </strong>

              <span>
                Predict wisely. Prepare responsibly.
              </span>

            </div>

          </div>


          <div className="footer-flow">
            Predict
            <ArrowRight size={12} />
            Prepare
            <ArrowRight size={12} />
            Serve
            <ArrowRight size={12} />
            Rescue
            <ArrowRight size={12} />
            Measure impact
          </div>

        </footer>

      </main>

    </div>
  );
}