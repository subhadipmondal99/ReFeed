import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  Check,
  CheckCircle2,
  ChefHat,
  CloudRain,
  CloudSun,
  Database,
  Gauge,
  Leaf,
  Loader2,
  LogOut,
  RefreshCw,
  Sparkles,
  Sun,
  Thermometer,
  Users,
  Utensils,
  Zap,
} from "lucide-react";

import {
  getWeatherForDate,
} from "../services/weatherService";

import {
  getHistoricalDemandBeforeDate,
} from "../services/mealHistoryService";

import {
  getForecastPrediction,
} from "../services/mlService";

import {
  savePrediction,
} from "../services/predictionService";

import {
  logoutUser,
} from "../firebase/auth";

import "./Forecast.css";


/* =========================================================
   CONSTANTS
   ========================================================= */

const DEFAULT_POPULATION = 1000;

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

const getDayTypeLabel = (dayType) => {
  const labels = {
    regular: "Regular Day",
    exam: "Exam Day",
    holiday: "Holiday",
  };

  return (
    labels[dayType] ||
    "Regular Day"
  );
};

const getDateLabel = (date) => {
  if (!date) {
    return "";
  }

  const parsed = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
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


/* =========================================================
   WEATHER ICON
   ========================================================= */

const getWeatherIcon = (
  category
) => {
  if (
    category === "rain" ||
    category === "storm"
  ) {
    return (
      <CloudRain
        size={22}
      />
    );
  }

  if (category === "hot") {
    return (
      <Sun
        size={22}
      />
    );
  }

  if (category === "cold") {
    return (
      <CloudSun
        size={22}
      />
    );
  }

  return (
    <CloudSun
      size={22}
    />
  );
};


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
     FORECAST
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
     FIREBASE SAVE
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
     REFRESH
     ======================================================= */

  const [
    refreshKey,
    setRefreshKey,
  ] = useState(0);


  /* =======================================================
     RESET PREDICTION ONLY
     ======================================================= */

  const resetPrediction = () => {
    setPrediction(null);
    setPredictionError("");
    setPredictionSaved(false);
    setPredictionSaveError("");
  };


  /* =======================================================
     LOAD WEATHER
     ======================================================= */

  useEffect(() => {
    let cancelled = false;

    const loadWeather = async () => {
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

        if (!cancelled) {
          setWeather(result);
        }
      } catch (error) {
        console.error(
          "Weather loading error:",
          error
        );

        if (!cancelled) {
          setWeather(null);

          setWeatherError(
            error?.message ||
              "Unable to load weather information."
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
  }, [date, refreshKey]);


  /* =======================================================
     LOAD FIREBASE HISTORY
     ======================================================= */

  useEffect(() => {
    let cancelled = false;

    const loadHistory = async () => {
      if (!date || !mealType) {
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

        if (!cancelled) {
          setHistory(
            Array.isArray(records)
              ? records
              : []
          );
        }
      } catch (error) {
        console.error(
          "Meal history loading error:",
          error
        );

        if (!cancelled) {
          setHistory([]);

          setHistoryError(
            error?.message ||
              "Unable to load historical meal data."
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
     HISTORICAL FEATURES
     ======================================================= */

  const historicalStats =
    useMemo(() => {
      const sorted =
        [...history]
          .filter(
            (record) =>
              record &&
              record.date &&
              Number.isFinite(
                Number(
                  record.actual_headcount
                )
              )
          )
          .sort((a, b) =>
            String(a.date).localeCompare(
              String(b.date)
            )
          );

      const demand =
        sorted.map(
          (record) =>
            Number(
              record.actual_headcount
            )
        );

      const getLag = (
        daysBack
      ) => {
        if (
          demand.length <
          daysBack
        ) {
          return null;
        }

        return demand[
          demand.length -
            daysBack
        ];
      };

      const getRolling = (
        windowSize
      ) => {
        if (
          demand.length === 0
        ) {
          return null;
        }

        const values =
          demand.slice(
            -windowSize
          );

        if (
          values.length === 0
        ) {
          return null;
        }

        const total =
          values.reduce(
            (sum, value) =>
              sum + value,
            0
          );

        return (
          total /
          values.length
        );
      };

      const average =
        demand.length
          ? demand.reduce(
              (sum, value) =>
                sum + value,
              0
            ) / demand.length
          : null;

      return {
        totalRecords:
          sorted.length,

        latestDemand:
          demand.length
            ? demand[
                demand.length - 1
              ]
            : null,

        average,

        lag_1: getLag(1),
        lag_7: getLag(7),
        lag_14: getLag(14),

        rolling_7:
          getRolling(7),

        rolling_14:
          getRolling(14),

        rolling_30:
          getRolling(30),
      };
    }, [history]);


  /* =======================================================
     DATA READINESS
     ======================================================= */

  const readiness = useMemo(() => {
    const historyReady =
      history.length >= 30;

    const weatherReady =
      Boolean(weather);

    const populationReady =
      Number(campusPopulation) > 0;

    return {
      historyReady,
      weatherReady,
      populationReady,
      ready:
        historyReady &&
        weatherReady &&
        populationReady,
    };
  }, [
    history,
    weather,
    campusPopulation,
  ]);


  /* =======================================================
     GENERATE FORECAST
     ======================================================= */

  const handleGenerateForecast =
    async () => {
      setPredictionError("");
      setPredictionSaveError("");
      setPredictionSaved(false);

      if (!date) {
        setPredictionError(
          "Please select a forecast date."
        );

        return;
      }

      if (
        Number(campusPopulation) <= 0
      ) {
        setPredictionError(
          "Campus population must be greater than zero."
        );

        return;
      }

      try {
        setPredictionLoading(true);

        const result =
          await getForecastPrediction({
            date,
            mealType,
            dayType,

            temperature:
              weather?.temperature ?? 28,

            rainfallMm:
              weather?.rainfallMm ?? 0,

            campusPopulation:
              Number(campusPopulation),

            isFestival:
              isFestival ? 1 : 0,

            history,
          });

        setPrediction(result);


        /* -------------------------------------------------
           SAVE PREDICTION TO FIREBASE
           ------------------------------------------------- */

        try {
          setPredictionSaving(true);

          await savePrediction({
            date,

            mealType,

            dayType,

            campusPopulation:
              Number(campusPopulation) ||
              DEFAULT_POPULATION,

            isFestival:
              isFestival ? 1 : 0,

            weather,

            predictedMeals:
              result.predicted_meals,

            recommendedCooking:
              result.recommended_cooking,

            ingredients:
              result.ingredients || {},

            historicalRecords:
              result.historical_records ??
              history.length,

            historicalFeatures:
              result.historical_features ||
              historicalStats,

            model:
              result.model ||
              "XGBoost",
          });

          setPredictionSaved(true);
        } catch (saveError) {
          console.error(
            "Prediction Firebase save error:",
            saveError
          );

          setPredictionSaveError(
            saveError?.message ||
              "Prediction generated, but it could not be saved to Firebase."
          );
        } finally {
          setPredictionSaving(false);
        }
      } catch (error) {
        console.error(
          "Forecast generation error:",
          error
        );

        setPredictionError(
          error?.message ||
            "Unable to generate forecast."
        );

        setPrediction(null);
      } finally {
        setPredictionLoading(false);
      }
    };


  /* =======================================================
     CONTINUE TO PREPARATION
     ======================================================= */

  const handleContinuePreparation =
    () => {
      if (!prediction) {
        return;
      }

      navigate(
        "/preparation",
        {
          state: {
            forecast: {
              date,

              mealType,

              dayType,

              campusPopulation:
                Number(
                  campusPopulation
                ) ||
                DEFAULT_POPULATION,

              predictedMeals:
                Number(
                  prediction.predicted_meals
                ),

              recommendedCooking:
                Number(
                  prediction.recommended_cooking ||
                    prediction.predicted_meals
                ),

              ingredients:
                prediction.ingredients ||
                {},

              weather,

              historicalRecords:
                prediction.historical_records ??
                history.length,

              historicalFeatures:
                prediction.historical_features ||
                {},
            },
          },
        }
      );
    };


  /* =======================================================
     RESET ALL
     ======================================================= */

  const handleReset = () => {
    setDate(getTomorrow());

    setMealType("Lunch");

    setDayType("regular");

    setCampusPopulation(
      DEFAULT_POPULATION
    );

    setIsFestival(false);

    setWeather(null);

    setHistory([]);

    setPrediction(null);

    setWeatherError("");

    setHistoryError("");

    setPredictionError("");

    setPredictionSaveError("");

    setPredictionSaved(false);
  };


  /* =======================================================
     REFRESH
     ======================================================= */

  const handleRefresh = () => {
    setRefreshKey(
      (value) => value + 1
    );
  };


  /* =======================================================
     LOGOUT
     ======================================================= */

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate("/login");
    } catch (error) {
      console.error(
        "Logout error:",
        error
      );

      navigate("/login");
    }
  };


  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <div className="forecast-page">

      {/* =================================================
          HEADER
          ================================================= */}

      <header className="forecast-header">

        <div className="forecast-header-inner">

          <div className="forecast-header-left">

            <button
              className="forecast-back-button"
              onClick={() =>
                navigate("/dashboard")
              }
            >
              <ArrowLeft
                size={16}
              />

              <span>
                Dashboard
              </span>
            </button>


            <div className="forecast-brand">

              <div className="forecast-brand-icon">
                <BrainCircuit
                  size={21}
                />
              </div>

              <div>
                <h1>
                  ReFeed
                </h1>

                <p>
                  AI Demand Intelligence
                </p>
              </div>

            </div>

          </div>


          <div className="forecast-header-actions">

            <button
              className="forecast-icon-button"
              onClick={handleRefresh}
              title="Refresh data"
            >
              <RefreshCw
                size={16}
              />
            </button>

            <button
              className="forecast-reset-button"
              onClick={handleReset}
            >
              Reset
            </button>

            <button
              className="forecast-logout-button"
              onClick={handleLogout}
            >
              <LogOut
                size={15}
              />

              Logout
            </button>

          </div>

        </div>

      </header>


      {/* =================================================
          MAIN
          ================================================= */}

      <main className="forecast-main">


        {/* =================================================
            HERO
            ================================================= */}

        <section className="forecast-hero">

          <div className="forecast-hero-content">

            <div className="forecast-eyebrow">

              <span className="eyebrow-dot" />

              REFEED AI OPERATIONS

            </div>


            <h2>
              Predict demand.
              <br />

              <span>
                Prepare smarter.
              </span>
            </h2>


            <p>
              Generate an AI-powered campus
              meal forecast using historical
              demand, academic context and
              weather signals.
            </p>


            <div className="forecast-hero-meta">

              <HeroMeta
                icon={
                  <Database
                    size={14}
                  />
                }
                label="Historical Data"
                value={
                  historyLoading
                    ? "Loading..."
                    : `${formatNumber(history.length)} records`
                }
              />

              <HeroMeta
                icon={
                  <CloudSun
                    size={14}
                  />
                }
                label="Weather"
                value={
                  weatherLoading
                    ? "Updating..."
                    : weather
                    ? "Connected"
                    : "Waiting"
                }
              />

              <HeroMeta
                icon={
                  <BrainCircuit
                    size={14}
                  />
                }
                label="Model"
                value="XGBoost"
              />

            </div>

          </div>


          <div className="forecast-hero-visual">

            <div className="hero-orbit orbit-one" />
            <div className="hero-orbit orbit-two" />

            <div className="hero-core">

              <div className="hero-core-ring">

                <BrainCircuit
                  size={39}
                />

              </div>

              <span>
                AI
              </span>

              <strong>
                FORECAST
              </strong>

            </div>


            <div className="hero-floating-card hero-card-demand">

              <Users
                size={14}
              />

              <div>
                <span>
                  DEMAND
                </span>

                <strong>
                  {history.length
                    ? formatNumber(
                        historicalStats.average
                      )
                    : "--"}
                </strong>
              </div>

            </div>


            <div className="hero-floating-card hero-card-weather">

              <Thermometer
                size={14}
              />

              <div>
                <span>
                  WEATHER
                </span>

                <strong>
                  {weather
                    ? `${formatDecimal(
                        weather.temperature,
                        0
                      )}°C`
                    : "--"}
                </strong>
              </div>

            </div>

          </div>

        </section>


        {/* =================================================
            OPERATIONS WORKFLOW
            ================================================= */}

        <section className="forecast-workflow">

          <div className="workflow-heading">

            <span>
              OPERATIONS PIPELINE
            </span>

            <p>
              Predict → Prepare → Serve → Rescue
            </p>

          </div>


          <div className="workflow-track">

            <WorkflowStep
              number="01"
              title="Configure"
              active={!prediction}
              completed={Boolean(prediction)}
              icon={
                <Gauge
                  size={15}
                />
              }
            />

            <WorkflowLine
              active={Boolean(prediction)}
            />

            <WorkflowStep
              number="02"
              title="Predict"
              active={
                predictionLoading
              }
              completed={Boolean(prediction)}
              icon={
                prediction ? (
                  <Check size={15} />
                ) : (
                  <BrainCircuit
                    size={15}
                  />
                )
              }
            />

            <WorkflowLine
              active={Boolean(prediction)}
            />

            <WorkflowStep
              number="03"
              title="Prepare"
              active={Boolean(prediction)}
              icon={
                <ChefHat
                  size={15}
                />
              }
            />

            <WorkflowLine />

            <WorkflowStep
              number="04"
              title="Serve"
              icon={
                <Utensils
                  size={15}
                />
              }
            />

            <WorkflowLine />

            <WorkflowStep
              number="05"
              title="Rescue"
              icon={
                <Leaf
                  size={15}
                />
              }
            />

          </div>

        </section>


        {/* =================================================
            CONFIGURATION AREA
            ================================================= */}

        <section className="forecast-config-grid">


          {/* -----------------------------------------------
              CONFIGURATION
              ----------------------------------------------- */}

          <div className="forecast-panel forecast-config-panel">

            <PanelHeader
              number="01"
              eyebrow="FORECAST CONFIGURATION"
              title="Configure demand inputs"
              description="Set the operating context for the prediction."
              icon={
                <Gauge
                  size={18}
                />
              }
            />


            <div className="forecast-form-grid">


              {/* DATE */}

              <div className="forecast-field">

                <label>
                  Forecast date
                </label>

                <input
                  type="date"
                  value={date}
                  min={getToday()}
                  onChange={(event) => {
                    setDate(
                      event.target.value
                    );

                    resetPrediction();
                  }}
                />

                <small>
                  {getDateLabel(date)}
                </small>

              </div>


              {/* MEAL TYPE */}

              <div className="forecast-field">

                <label>
                  Meal service
                </label>

                <div className="segmented-control">

                  <button
                    type="button"
                    className={
                      mealType === "Lunch"
                        ? "active"
                        : ""
                    }
                    onClick={() => {
                      setMealType("Lunch");
                      resetPrediction();
                    }}
                  >
                    Lunch
                  </button>

                  <button
                    type="button"
                    className={
                      mealType === "Dinner"
                        ? "active"
                        : ""
                    }
                    onClick={() => {
                      setMealType("Dinner");
                      resetPrediction();
                    }}
                  >
                    Dinner
                  </button>

                </div>

                <small>
                  Select the meal period to forecast.
                </small>

              </div>


              {/* DAY TYPE */}

              <div className="forecast-field">

                <label>
                  Day context
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
                    Regular Day
                  </option>

                  <option value="exam">
                    Exam Day
                  </option>

                  <option value="holiday">
                    Holiday
                  </option>
                </select>

                <small>
                  Academic context influences demand.
                </small>

              </div>


              {/* POPULATION */}

              <div className="forecast-field">

                <label>
                  Campus population
                </label>

                <div className="input-with-icon">

                  <Users
                    size={15}
                  />

                  <input
                    type="number"
                    min="1"
                    value={campusPopulation}
                    onChange={(event) => {
                      setCampusPopulation(
                        event.target.value
                      );

                      resetPrediction();
                    }}
                  />

                  <span>
                    people
                  </span>

                </div>

                <small>
                  Estimated students and staff on campus.
                </small>

              </div>


              {/* FESTIVAL */}

              <div className="forecast-field festival-field">

                <label>
                  Special event
                </label>

                <button
                  type="button"
                  className={`festival-toggle ${
                    isFestival
                      ? "active"
                      : ""
                  }`}
                  onClick={() => {
                    setIsFestival(
                      (value) =>
                        !value
                    );

                    resetPrediction();
                  }}
                >

                  <span className="toggle-track">

                    <span className="toggle-thumb" />

                  </span>

                  <span>
                    Festival / special event
                  </span>

                </button>

                <small>
                  Enable when a festival or major event may change demand.
                </small>

              </div>

            </div>

          </div>


          {/* -----------------------------------------------
              WEATHER
              ----------------------------------------------- */}

          <div className="forecast-panel forecast-weather-panel">

            <PanelHeader
              number="02"
              eyebrow="LIVE CONTEXT"
              title="Weather intelligence"
              description="Weather data is supplied to the prediction pipeline."
              icon={
                <CloudSun
                  size={18}
                />
              }
            />


            {weatherLoading ? (

              <div className="forecast-loading-card">

                <Loader2
                  size={22}
                  className="spin"
                />

                <div>
                  <strong>
                    Fetching weather
                  </strong>

                  <span>
                    Updating Open-Meteo conditions...
                  </span>
                </div>

              </div>

            ) : weatherError ? (

              <div className="forecast-inline-error">

                <AlertTriangle
                  size={17}
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

              <div className="weather-main-card">

                <div className="weather-icon-large">

                  {getWeatherIcon(
                    weather.category
                  )}

                </div>

                <div className="weather-temperature">

                  <span>
                    TEMPERATURE
                  </span>

                  <strong>
                    {formatDecimal(
                      weather.temperature,
                      0
                    )}
                    °C
                  </strong>

                  <small>
                    {weather.description ||
                      "Current forecast"}
                  </small>

                </div>


                <div className="weather-stat">

                  <span>
                    RAINFALL
                  </span>

                  <strong>
                    {formatDecimal(
                      weather.rainfallMm,
                      1
                    )}
                    <small>
                      mm
                    </small>
                  </strong>

                </div>

              </div>

            ) : (

              <div className="forecast-empty-mini">

                <CloudSun
                  size={22}
                />

                <span>
                  Weather data will appear here.
                </span>

              </div>

            )}

          </div>

        </section>


        {/* =================================================
            DATA READINESS
            ================================================= */}

        <section className="readiness-section">

          <div className="readiness-header">

            <div>

              <span>
                MODEL READINESS
              </span>

              <h3>
                Prediction context
              </h3>

            </div>

            <div
              className={`readiness-badge ${
                readiness.ready
                  ? "ready"
                  : ""
              }`}
            >
              <span />

              {readiness.ready
                ? "READY"
                : "PARTIAL"}
            </div>

          </div>


          <div className="readiness-grid">

            <ReadinessItem
              icon={
                <Database
                  size={15}
                />
              }
              label="Historical demand"
              value={
                historyLoading
                  ? "Loading..."
                  : `${formatNumber(
                      history.length
                    )} records`
              }
              ready={
                readiness.historyReady
              }
              note={
                readiness.historyReady
                  ? "Sufficient history available"
                  : "Model fallback will be used if needed"
              }
            />

            <ReadinessItem
              icon={
                <CloudSun
                  size={15}
                />
              }
              label="Weather signal"
              value={
                weather
                  ? "Connected"
                  : "Unavailable"
              }
              ready={
                readiness.weatherReady
              }
              note={
                weather
                  ? `${formatDecimal(
                      weather.temperature,
                      0
                    )}°C · ${formatDecimal(
                      weather.rainfallMm,
                      1
                    )} mm rain`
                  : "Prediction can use fallback weather values"
              }
            />

            <ReadinessItem
              icon={
                <Users
                  size={15}
                />
              }
              label="Campus population"
              value={`${formatNumber(
                campusPopulation
              )}`}
              ready={
                readiness.populationReady
              }
              note="Population context supplied to model"
            />

            <ReadinessItem
              icon={
                <Zap
                  size={15}
                />
              }
              label="Forecast engine"
              value="XGBoost"
              ready
              note="Deployed ReFeed ML API"
            />

          </div>

        </section>


        {/* =================================================
            ERRORS
            ================================================= */}

        {predictionError && (

          <section className="forecast-error">

            <AlertTriangle
              size={19}
            />

            <div>

              <strong>
                Forecast generation failed
              </strong>

              <p>
                {predictionError}
              </p>

            </div>

          </section>

        )}


        {/* =================================================
            GENERATE BUTTON
            ================================================= */}

        {!prediction && !predictionLoading && (

          <section className="generate-panel">

            <div className="generate-icon">

              <Sparkles
                size={22}
              />

            </div>

            <div className="generate-copy">

              <span>
                READY FOR AI PREDICTION
              </span>

              <h3>
                Generate tomorrow's meal demand
              </h3>

              <p>
                ReFeed will combine historical demand,
                weather, meal type and campus context
                to calculate the recommended cooking target.
              </p>

            </div>


            <button
              className="generate-button"
              onClick={
                handleGenerateForecast
              }
            >

              <BrainCircuit
                size={17}
              />

              Generate AI Forecast

              <ArrowRight
                size={16}
              />

            </button>

          </section>

        )}


        {/* =================================================
            LOADING
            ================================================= */}

        {predictionLoading && (

          <section className="prediction-loading">

            <div className="prediction-loader-core">

              <BrainCircuit
                size={27}
              />

            </div>

            <div>

              <span>
                REFEED AI ENGINE
              </span>

              <h3>
                Analyzing demand patterns...
              </h3>

              <p>
                Processing historical demand,
                weather and operational context.
              </p>

            </div>

            <Loader2
              size={21}
              className="spin"
            />

          </section>

        )}


        {/* =================================================
            PREDICTION RESULT
            ================================================= */}

        {prediction && !predictionLoading && (

          <section className="prediction-result">


            {/* ---------------------------------------------
                RESULT HEADER
                --------------------------------------------- */}

            <div className="prediction-result-header">

              <div>

                <div className="result-label">

                  <span className="result-live-dot" />

                  AI PREDICTION READY

                </div>

                <h3>
                  {mealType} demand forecast
                </h3>

                <p>
                  {getDateLabel(date)}
                  {" · "}
                  {getDayTypeLabel(
                    dayType
                  )}
                </p>

              </div>


              <div className="result-status-stack">

                <div className="prediction-success">

                  <CheckCircle2
                    size={15}
                  />

                  Forecast Ready

                </div>

                {predictionSaving && (

                  <div className="prediction-save-status saving">

                    <Loader2
                      size={13}
                      className="spin"
                    />

                    Saving to Firebase...

                  </div>

                )}

                {predictionSaved && (

                  <div className="prediction-save-status saved">

                    <CheckCircle2
                      size={13}
                    />

                    Saved to Firebase

                  </div>

                )}

              </div>

            </div>


            {/* ---------------------------------------------
                SAVE ERROR
                --------------------------------------------- */}

            {predictionSaveError && (

              <div className="forecast-save-warning">

                <AlertTriangle
                  size={16}
                />

                <div>

                  <strong>
                    Forecast generated successfully
                  </strong>

                  <p>
                    {predictionSaveError}
                  </p>

                </div>

              </div>

            )}


            {/* ---------------------------------------------
                MAIN NUMBERS
                --------------------------------------------- */}

            <div className="prediction-main-grid">

              <PredictionNumberCard
                icon={
                  <Users
                    size={21}
                  />
                }
                label="Predicted meals"
                value={
                  formatNumber(
                    prediction.predicted_meals
                  )
                }
                accent="primary"
                description="Expected meal demand"
              />

              <PredictionNumberCard
                icon={
                  <ChefHat
                    size={21}
                  />
                }
                label="Cooking target"
                value={
                  formatNumber(
                    prediction.recommended_cooking ||
                      prediction.predicted_meals
                  )
                }
                accent="secondary"
                description="Includes 5% preparation buffer"
              />

              <PredictionNumberCard
                icon={
                  <Leaf
                    size={21}
                  />
                }
                label="Ingredients"
                value={
                  formatNumber(
                    Object.keys(
                      prediction.ingredients ||
                        {}
                    ).length
                  )
                }
                accent="tertiary"
                description="Items calculated for preparation"
              />

            </div>


            {/* ---------------------------------------------
                CONTEXT STRIP
                --------------------------------------------- */}

            <div className="prediction-context">

              <ContextItem
                label="Weather"
                value={
                  weather
                    ? `${formatDecimal(
                        weather.temperature,
                        0
                      )}°C`
                    : "Fallback"
                }
                icon={
                  <Thermometer
                    size={15}
                  />
                }
              />

              <ContextItem
                label="Rainfall"
                value={
                  weather
                    ? `${formatDecimal(
                        weather.rainfallMm,
                        1
                      )} mm`
                    : "0 mm"
                }
                icon={
                  <CloudRain
                    size={15}
                  />
                }
              />

              <ContextItem
                label="Population"
                value={
                  formatNumber(
                    campusPopulation
                  )
                }
                icon={
                  <Users
                    size={15}
                  />
                }
              />

              <ContextItem
                label="History"
                value={
                  `${formatNumber(
                    prediction.historical_records ??
                      history.length
                  )} records`
                }
                icon={
                  <Database
                    size={15}
                  />
                }
              />

            </div>


            {/* ---------------------------------------------
                INGREDIENTS
                --------------------------------------------- */}

            <div className="result-section">

              <div className="result-section-heading">

                <div>

                  <span>
                    PREPARATION INPUT
                  </span>

                  <h4>
                    Ingredient requirements
                  </h4>

                </div>

                <ChefHat
                  size={17}
                />

              </div>


              <div className="ingredients-grid">

                {Object.entries(
                  prediction.ingredients ||
                    {}
                ).map(
                  ([
                    ingredient,
                    quantity,
                  ]) => (

                    <div
                      className="ingredient-item"
                      key={ingredient}
                    >

                      <div className="ingredient-icon">
                        <Utensils
                          size={14}
                        />
                      </div>

                      <div>

                        <strong>
                          {ingredient}
                        </strong>

                        <span>
                          {formatDecimal(
                            quantity,
                            2
                          )} kg
                        </span>

                      </div>

                    </div>

                  )
                )}

              </div>

            </div>


            {/* ---------------------------------------------
                HISTORICAL FEATURES
                --------------------------------------------- */}

            <div className="result-section">

              <div className="result-section-heading">

                <div>

                  <span>
                    MODEL SIGNALS
                  </span>

                  <h4>
                    Historical features used
                  </h4>

                </div>

                <Database
                  size={17}
                />

              </div>


              <div className="feature-grid">

                <FeatureValue
                  label="Lag 1"
                  value={
                    prediction
                      .historical_features
                      ?.lag_1
                  }
                />

                <FeatureValue
                  label="Lag 7"
                  value={
                    prediction
                      .historical_features
                      ?.lag_7
                  }
                />

                <FeatureValue
                  label="Lag 14"
                  value={
                    prediction
                      .historical_features
                      ?.lag_14
                  }
                />

                <FeatureValue
                  label="Rolling 7"
                  value={
                    prediction
                      .historical_features
                      ?.rolling_7
                  }
                />

                <FeatureValue
                  label="Rolling 14"
                  value={
                    prediction
                      .historical_features
                      ?.rolling_14
                  }
                />

                <FeatureValue
                  label="Rolling 30"
                  value={
                    prediction
                      .historical_features
                      ?.rolling_30
                  }
                />

              </div>

            </div>


            {/* ---------------------------------------------
                MODEL INFORMATION
                --------------------------------------------- */}

            <div className="model-information">

              <div className="model-information-left">

                <div className="model-icon">
                  <BrainCircuit
                    size={17}
                  />
                </div>

                <div>

                  <strong>
                    {prediction.model ||
                      "XGBoost"}
                  </strong>

                  <p>
                    Prediction generated through the
                    deployed ReFeed ML API.
                  </p>

                </div>

              </div>


              <div className="model-api-badge">

                <span />

                API Connected

              </div>

            </div>


            {/* =================================================
                IMPORTANT NEXT ACTION
                ================================================= */}

            <div className="next-action-panel">

              <div className="next-action-glow" />


              <div className="next-action-header">

                <div className="next-action-title">

                  <div className="next-action-check">

                    <CheckCircle2
                      size={18}
                    />

                  </div>

                  <div>

                    <span>
                      REFEED AI OPERATIONS
                    </span>

                    <h4>
                      Forecast successfully generated
                    </h4>

                    <p>
                      Your demand forecast is ready.
                      Now convert it into a practical
                      kitchen preparation plan.
                    </p>

                  </div>

                </div>


                <div className="next-action-ready">

                  <span />

                  READY

                </div>

              </div>


              {/* ---------------------------------------------
                  COMPLETION CHECKLIST
                  --------------------------------------------- */}

              <div className="next-checklist">

                <NextCheck
                  text="Demand calculated"
                />

                <NextCheck
                  text="Weather analyzed"
                />

                <NextCheck
                  text="Historical demand analyzed"
                />

                <NextCheck
                  text="Ingredient quantities calculated"
                />

              </div>


              {/* ---------------------------------------------
                  NEXT ACTION CARD
                  --------------------------------------------- */}

              <div className="next-action-card">

                <div className="next-action-card-info">

                  <div className="next-action-card-icon">

                    <ChefHat
                      size={21}
                    />

                  </div>

                  <div>

                    <span>
                      NEXT ACTION
                    </span>

                    <h5>
                      Create Preparation Plan
                    </h5>

                    <p>
                      Convert the forecast into cooking
                      quantities and ingredient requirements.
                    </p>

                  </div>

                </div>


                <div className="next-action-stats">

                  <MiniStat
                    value={
                      formatNumber(
                        prediction.predicted_meals
                      )
                    }
                    label="predicted meals"
                  />

                  <MiniStat
                    value={
                      formatNumber(
                        prediction.recommended_cooking ||
                          prediction.predicted_meals
                      )
                    }
                    label="cooking target"
                  />

                  <MiniStat
                    value={
                      formatNumber(
                        Object.keys(
                          prediction.ingredients ||
                            {}
                        ).length
                      )
                    }
                    label="ingredients"
                  />

                </div>


                <button
                  className="next-action-button"
                  onClick={
                    handleContinuePreparation
                  }
                >

                  <ChefHat
                    size={17}
                  />

                  <span>
                    Create Preparation Plan
                  </span>

                  <ArrowRight
                    size={17}
                  />

                </button>

              </div>


              {/* ---------------------------------------------
                  MODIFY
                  --------------------------------------------- */}

              <button
                className="modify-forecast-button"
                onClick={() => {
                  resetPrediction();

                  window.scrollTo({
                    top: 0,
                    behavior: "smooth",
                  });
                }}
              >

                <RefreshCw
                  size={13}
                />

                Modify Forecast

              </button>

            </div>

          </section>

        )}


        {/* =================================================
            EMPTY STATE
            ================================================= */}

        {!prediction &&
          !predictionLoading && (

            <section className="forecast-empty-state">

              <div className="empty-state-core">

                <BrainCircuit
                  size={27}
                />

              </div>

              <div className="empty-state-content">

                <span>
                  AI FORECAST ENGINE
                </span>

                <h3>
                  Ready to generate your forecast
                </h3>

                <p>
                  Configure the meal details above and
                  ReFeed will combine history, weather
                  and campus context to predict demand.
                </p>

              </div>


              <div className="empty-pipeline">

                <PipelineStep
                  number="1"
                  title="History"
                />

                <div className="pipeline-arrow">
                  →
                </div>

                <PipelineStep
                  number="2"
                  title="Weather"
                />

                <div className="pipeline-arrow">
                  →
                </div>

                <PipelineStep
                  number="3"
                  title="XGBoost"
                />

                <div className="pipeline-arrow">
                  →
                </div>

                <PipelineStep
                  number="4"
                  title="Forecast"
                />

              </div>

            </section>

          )}


        {/* =================================================
            BOTTOM NAVIGATION
            ================================================= */}

        <section className="forecast-bottom-navigation">

          <button
            onClick={() =>
              navigate("/dashboard")
            }
          >
            <ArrowLeft
              size={14}
            />

            Dashboard
          </button>

          <button
            className={
              prediction
                ? "active"
                : ""
            }
            onClick={() =>
              window.scrollTo({
                top: 0,
                behavior: "smooth",
              })
            }
          >
            <BrainCircuit
              size={14}
            />

            Forecast
          </button>

          <button
            onClick={() =>
              prediction
                ? handleContinuePreparation()
                : navigate("/preparation")
            }
          >
            <ChefHat
              size={14}
            />

            Preparation

            <ArrowRight
              size={13}
            />
          </button>

        </section>

      </main>

    </div>
  );
}


/* =========================================================
   SMALL COMPONENTS
   ========================================================= */

function HeroMeta({
  icon,
  label,
  value,
}) {
  return (
    <div className="hero-meta-item">

      <div className="hero-meta-icon">
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


function PanelHeader({
  number,
  eyebrow,
  title,
  description,
  icon,
}) {
  return (
    <div className="panel-header">

      <div className="panel-number">
        {number}
      </div>

      <div className="panel-header-icon">
        {icon}
      </div>

      <div className="panel-header-copy">

        <span>
          {eyebrow}
        </span>

        <h3>
          {title}
        </h3>

        <p>
          {description}
        </p>

      </div>

    </div>
  );
}


function WorkflowStep({
  number,
  title,
  icon,
  active = false,
  completed = false,
}) {
  return (
    <div
      className={`workflow-step ${
        active
          ? "active"
          : ""
      } ${
        completed
          ? "completed"
          : ""
      }`}
    >

      <div className="workflow-step-icon">
        {icon}
      </div>

      <div>

        <span>
          STEP {number}
        </span>

        <strong>
          {title}
        </strong>

        {active && (
          <small>
            NEXT
          </small>
        )}

        {completed && !active && (
          <small className="done">
            DONE
          </small>
        )}

      </div>

    </div>
  );
}


function WorkflowLine({
  active = false,
}) {
  return (
    <div
      className={`workflow-line ${
        active
          ? "active"
          : ""
      }`}
    />
  );
}


function ReadinessItem({
  icon,
  label,
  value,
  ready,
  note,
}) {
  return (
    <div
      className={`readiness-item ${
        ready
          ? "ready"
          : ""
      }`}
    >

      <div className="readiness-item-icon">
        {icon}
      </div>

      <div className="readiness-item-copy">

        <span>
          {label}
        </span>

        <strong>
          {value}
        </strong>

        <small>
          {note}
        </small>

      </div>

      <div className="readiness-check">

        {ready ? (
          <Check
            size={12}
          />
        ) : (
          <span />
        )}

      </div>

    </div>
  );
}


function PredictionNumberCard({
  icon,
  label,
  value,
  description,
  accent,
}) {
  return (
    <div
      className={`prediction-number-card ${accent}`}
    >

      <div className="prediction-number-top">

        <div className="prediction-number-icon">
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


function ContextItem({
  icon,
  label,
  value,
}) {
  return (
    <div className="context-item">

      <div className="context-icon">
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


function FeatureValue({
  label,
  value,
}) {
  const number =
    Number(value);

  return (
    <div className="feature-value">

      <span>
        {label}
      </span>

      <strong>
        {Number.isFinite(number)
          ? formatDecimal(
              number,
              1
            )
          : "--"}
      </strong>

    </div>
  );
}


function NextCheck({
  text,
}) {
  return (
    <div className="next-check">

      <div>
        <Check
          size={11}
        />
      </div>

      <span>
        {text}
      </span>

    </div>
  );
}


function MiniStat({
  value,
  label,
}) {
  return (
    <div className="mini-stat">

      <strong>
        {value}
      </strong>

      <span>
        {label}
      </span>

    </div>
  );
}


function PipelineStep({
  number,
  title,
}) {
  return (
    <div className="pipeline-step">

      <div>
        {number}
      </div>

      <span>
        {title}
      </span>

    </div>
  );
}