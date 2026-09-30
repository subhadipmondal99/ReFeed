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
  CalendarDays,
  CheckCircle2,
  ChefHat,
  CloudRain,
  CloudSun,
  Database,
  Loader2,
  LogOut,
  RefreshCw,
  Sparkles,
  Sun,
  Thermometer,
  Utensils,
  Users,
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

  return number.toLocaleString(
    "en-IN"
  );
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

const getDayTypeLabel = (
  dayType
) => {
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
      <CloudRain size={22} />
    );
  }

  if (category === "hot") {
    return (
      <Sun size={22} />
    );
  }

  if (category === "cold") {
    return (
      <CloudSun size={22} />
    );
  }

  return (
    <CloudSun size={22} />
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
     DATA REFRESH
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
    setPredictionError("");
    setPredictionSaved(false);
    setPredictionSaveError("");
  };

  /* =======================================================
     LOAD WEATHER
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

    const loadHistory =
      async () => {
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

      const getRolling =
        (windowSize) => {
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
              (
                sum,
                value
              ) =>
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
              (
                sum,
                value
              ) =>
                sum + value,
              0
            ) /
            demand.length
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

        minimum:
          demand.length
            ? Math.min(
                ...demand
              )
            : null,

        maximum:
          demand.length
            ? Math.max(
                ...demand
              )
            : null,

        lag_1:
          getLag(1),

        lag_7:
          getLag(7),

        lag_14:
          getLag(14),

        rolling_7:
          getRolling(7),

        rolling_14:
          getRolling(14),

        rolling_30:
          getRolling(30),

        oldestDate:
          sorted.length
            ? sorted[0].date
            : null,

        latestDate:
          sorted.length
            ? sorted[
                sorted.length - 1
              ].date
            : null,
      };
    }, [history]);

  /* =======================================================
     FEATURE READINESS
     ======================================================= */

  const featureReadiness =
    useMemo(() => {
      const total =
        historicalStats.totalRecords;

      return {
        hasHistory:
          total > 0,

        hasSeven:
          total >= 7,

        hasFourteen:
          total >= 14,

        hasThirty:
          total >= 30,
      };
    }, [historicalStats]);

  /* =======================================================
     CAN GENERATE
     ======================================================= */

  const canGenerate =
    Boolean(date) &&
    Boolean(mealType) &&
    Number(campusPopulation) >
      0 &&
    !weatherLoading &&
    !historyLoading &&
    !predictionLoading;

  /* =======================================================
     GENERATE FORECAST
     ======================================================= */

  const handleGenerateForecast =
    async () => {
      setPredictionError("");
      setPredictionSaveError("");
      setPredictionSaved(false);
      setPrediction(null);

      if (!date) {
        setPredictionError(
          "Please select a forecast date."
        );
        return;
      }

      if (!mealType) {
        setPredictionError(
          "Please select a meal type."
        );
        return;
      }

      const population =
        Number(
          campusPopulation
        );

      if (
        !Number.isFinite(
          population
        ) ||
        population <= 0
      ) {
        setPredictionError(
          "Campus population must be greater than zero."
        );
        return;
      }

      if (!weather) {
        setPredictionError(
          "Weather data is not available yet. Please wait or refresh the data."
        );
        return;
      }

      try {
        setPredictionLoading(true);

        /* --------------------------------------------------
           STEP 1
           Call XGBoost API
           -------------------------------------------------- */

        const result =
          await getForecastPrediction({
            date,
            mealType,
            dayType,

            campusPopulation:
              population,

            isFestival:
              isFestival ? 1 : 0,

            temperature:
              weather.temperature ??
              weather.maxTemperature ??
              28,

            rainfallMm:
              weather.rainfallMm ??
              0,

            history,
          });

        setPrediction(result);

        /* --------------------------------------------------
           STEP 2
           Save prediction to Firebase
           -------------------------------------------------- */

        try {
          setPredictionSaving(true);

          await savePrediction({
            date,
            mealType,
            dayType,

            campusPopulation:
              population,

            isFestival:
              isFestival ? 1 : 0,

            weather,

            predictedMeals:
              result.predicted_meals,

            recommendedCooking:
              result.recommended_cooking,

            ingredients:
              result.ingredients ||
              {},

            historicalRecords:
              result.historical_records ??
              history.length,

            historicalFeatures:
              result.historical_features ||
              {},

            model:
              result.model ||
              "XGBoost",
          });

          setPredictionSaved(
            true
          );
        } catch (saveError) {
          console.error(
            "Prediction save error:",
            saveError
          );

          setPredictionSaveError(
            saveError?.message ||
              "Prediction was generated, but Firebase could not save it."
          );
        } finally {
          setPredictionSaving(
            false
          );
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
        setPredictionLoading(
          false
        );
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
                ),

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

  const handleReset =
    () => {
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

  const handleRefresh =
    () => {
      setRefreshKey(
        (value) =>
          value + 1
      );
    };

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <div className="forecast-page">

      {/* ===================================================
          HEADER
          =================================================== */}

      <header className="forecast-header">
        <div className="forecast-header-inner">

          <button
            className="forecast-back-button"
            onClick={() =>
              navigate(
                "/dashboard"
              )
            }
          >
            <ArrowLeft size={16} />
            Dashboard
          </button>

          <div className="forecast-brand">
            <div className="forecast-brand-icon">
              <BrainCircuit
                size={23}
              />
            </div>

            <div>
              <h1>
                AI Demand Forecast
              </h1>

              <p>
                Predict campus meal
                demand with real
                operational data.
              </p>
            </div>
          </div>

          <div className="forecast-header-actions">

            <button
              className="forecast-refresh-button"
              onClick={
                handleRefresh
              }
              disabled={
                weatherLoading ||
                historyLoading
              }
            >
              <RefreshCw
                size={15}
                className={
                  weatherLoading ||
                  historyLoading
                    ? "spin"
                    : ""
                }
              />

              Refresh
            </button>

            <button
              className="forecast-reset-button"
              onClick={
                handleReset
              }
            >
              Reset
            </button>

            <button
              className="forecast-logout-button"
              onClick={() =>
                navigate(
                  "/login"
                )
              }
            >
              <LogOut size={15} />
              Logout
            </button>

          </div>
        </div>
      </header>

      <main className="forecast-container">

        {/* =================================================
            HERO
            ================================================= */}

        <section className="forecast-hero">

          <div>
            <div className="forecast-eyebrow">
              REFEED · PREDICT
            </div>

            <h2>
              Forecast tomorrow's
              meal demand.
            </h2>

            <p>
              Combine historical
              meal operations,
              academic-day
              information and live
              weather to create a
              practical cooking
              target.
            </p>
          </div>

          <div className="forecast-ai-badge">
            <Sparkles size={16} />
            XGBoost AI Model
          </div>

        </section>

        {/* =================================================
            WORKFLOW
            ================================================= */}

        <section className="forecast-workflow">

          <WorkflowStep
            number="01"
            title="Configure"
            active
          />

          <WorkflowLine />

          <WorkflowStep
            number="02"
            title="Predict"
          />

          <WorkflowLine />

          <WorkflowStep
            number="03"
            title="Prepare"
          />

          <WorkflowLine />

          <WorkflowStep
            number="04"
            title="Rescue"
          />

        </section>

        {/* =================================================
            ERROR
            ================================================= */}

        {(predictionError ||
          weatherError ||
          historyError) && (
          <div className="forecast-error">

            <AlertTriangle
              size={19}
            />

            <div>
              <strong>
                Forecast data issue
              </strong>

              <p>
                {predictionError ||
                  weatherError ||
                  historyError}
              </p>
            </div>

          </div>
        )}

        {/* =================================================
            STEP 1 CONFIGURATION
            ================================================= */}

        <section className="forecast-panel">

          <div className="forecast-panel-header">

            <div className="section-number">
              01
            </div>

            <div>
              <span>
                INPUTS
              </span>

              <h3>
                Forecast Configuration
              </h3>

              <p>
                Select the meal and
                campus conditions.
              </p>
            </div>

          </div>

          <div className="forecast-input-grid">

            <div className="forecast-field">

              <label>
                <CalendarDays
                  size={15}
                />

                Forecast Date
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

            </div>

            <div className="forecast-field">

              <label>
                <Utensils
                  size={15}
                />

                Meal Type
              </label>

              <select
                value={mealType}
                onChange={(event) => {
                  setMealType(
                    event.target.value
                  );
                  resetPrediction();
                }}
              >
                <option value="Lunch">
                  Lunch
                </option>

                <option value="Dinner">
                  Dinner
                </option>
              </select>

            </div>

            <div className="forecast-field">

              <label>
                <CalendarDays
                  size={15}
                />

                Day Type
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

            </div>

            <div className="forecast-field">

              <label>
                <Users size={15} />

                Campus Population
              </label>

              <input
                type="number"
                min="1"
                value={
                  campusPopulation
                }
                onChange={(event) => {
                  setCampusPopulation(
                    event.target.value
                  );
                  resetPrediction();
                }}
              />

            </div>

          </div>

          <label className="festival-toggle">

            <input
              type="checkbox"
              checked={isFestival}
              onChange={(event) => {
                setIsFestival(
                  event.target.checked
                );
                resetPrediction();
              }}
            />

            <span className="custom-checkbox">
              {isFestival && (
                <CheckCircle2
                  size={14}
                />
              )}
            </span>

            <span>
              Festival / special
              campus event
            </span>

          </label>

        </section>

        {/* =================================================
            WEATHER + HISTORY
            ================================================= */}

        <section className="forecast-info-grid">

          {/* WEATHER */}

          <div className="forecast-info-card">

            <div className="info-card-header">

              <div className="info-card-icon weather-icon">
                {getWeatherIcon(
                  weather?.category
                )}
              </div>

              <div>
                <span>
                  OPEN-METEO
                </span>

                <h3>
                  Weather Conditions
                </h3>
              </div>

            </div>

            {weatherLoading ? (
              <LoadingBox
                text="Loading weather..."
              />
            ) : weatherError ? (
              <MiniError
                text={weatherError}
              />
            ) : weather ? (
              <div className="weather-content">

                <div className="weather-main">

                  <strong>
                    {Math.round(
                      Number(
                        weather.temperature
                      )
                    )}
                    °C
                  </strong>

                  <span>
                    {weather.description}
                  </span>

                </div>

                <div className="weather-stats">

                  <div>
                    <Thermometer
                      size={14}
                    />

                    <span>
                      {Math.round(
                        Number(
                          weather.minTemperature
                        )
                      )}
                      °C –{" "}
                      {Math.round(
                        Number(
                          weather.maxTemperature
                        )
                      )}
                      °C
                    </span>
                  </div>

                  <div>
                    <CloudRain
                      size={14}
                    />

                    <span>
                      {formatDecimal(
                        weather.rainfallMm,
                        1
                      )}{" "}
                      mm rain
                    </span>
                  </div>

                  <div>
                    {getWeatherIcon(
                      weather.category
                    )}

                    <span>
                      {weather.category ||
                        "normal"}
                    </span>
                  </div>

                </div>

              </div>
            ) : (
              <div className="forecast-empty-small">
                Select a date to
                load weather.
              </div>
            )}

          </div>

          {/* HISTORY */}

          <div className="forecast-info-card">

            <div className="info-card-header">

              <div className="info-card-icon history-icon">
                <Database
                  size={20}
                />
              </div>

              <div>
                <span>
                  FIREBASE
                </span>

                <h3>
                  Historical Demand
                </h3>
              </div>

            </div>

            {historyLoading ? (
              <LoadingBox
                text="Loading meal history..."
              />
            ) : historyError ? (
              <MiniError
                text={historyError}
              />
            ) : (
              <>

                <div className="history-summary">

                  <div>
                    <strong>
                      {formatNumber(
                        historicalStats.totalRecords
                      )}
                    </strong>

                    <span>
                      {mealType}
                      {" "}
                      records
                    </span>
                  </div>

                  <div>
                    <strong>
                      {historicalStats.average !==
                      null
                        ? formatNumber(
                            Math.round(
                              historicalStats.average
                            )
                          )
                        : "—"}
                    </strong>

                    <span>
                      average demand
                    </span>
                  </div>

                </div>

                <div className="history-feature-grid">

                  <HistoryFeature
                    label="Lag 1"
                    value={
                      historicalStats.lag_1
                    }
                  />

                  <HistoryFeature
                    label="Lag 7"
                    value={
                      historicalStats.lag_7
                    }
                  />

                  <HistoryFeature
                    label="Lag 14"
                    value={
                      historicalStats.lag_14
                    }
                  />

                  <HistoryFeature
                    label="Rolling 7"
                    value={
                      historicalStats.rolling_7
                    }
                  />

                  <HistoryFeature
                    label="Rolling 14"
                    value={
                      historicalStats.rolling_14
                    }
                  />

                  <HistoryFeature
                    label="Rolling 30"
                    value={
                      historicalStats.rolling_30
                    }
                  />

                </div>

              </>
            )}

          </div>

        </section>

        {/* =================================================
            DATA READINESS
            ================================================= */}

        <section className="feature-status-card">

          <div className="feature-status-left">

            <div
              className={`feature-status-icon ${
                featureReadiness.hasThirty
                  ? "ready"
                  : featureReadiness.hasHistory
                  ? "partial"
                  : "empty"
              }`}
            >
              {featureReadiness.hasThirty ? (
                <CheckCircle2
                  size={20}
                />
              ) : featureReadiness.hasHistory ? (
                <Database
                  size={20}
                />
              ) : (
                <AlertTriangle
                  size={20}
                />
              )}
            </div>

            <div>

              <strong>
                Historical feature
                readiness
              </strong>

              <p>
                {featureReadiness.hasThirty
                  ? "30+ historical records are available. The model has enough history for all lag and rolling windows."
                  : featureReadiness.hasHistory
                  ? `${historicalStats.totalRecords} historical records are available. Missing longer windows will use the ML service fallback values.`
                  : "No historical records were found. The ML service will use its fallback feature values."}
              </p>

            </div>

          </div>

          <div
            className={`feature-status-pill ${
              featureReadiness.hasThirty
                ? "ready"
                : featureReadiness.hasHistory
                ? "partial"
                : "empty"
            }`}
          >
            {featureReadiness.hasThirty
              ? "Ready"
              : featureReadiness.hasHistory
              ? "Partial Data"
              : "No History"}
          </div>

        </section>

        {/* =================================================
            STEP 2 GENERATE
            ================================================= */}

        <section className="generate-section">

          <div className="generate-content">

            <div className="section-number dark">
              02
            </div>

            <div>
              <span>
                AI PREDICTION
              </span>

              <h3>
                Generate Demand Forecast
              </h3>

              <p>
                XGBoost combines
                calendar, weather and
                historical demand
                features.
              </p>
            </div>

          </div>

          <button
            className="generate-button"
            onClick={
              handleGenerateForecast
            }
            disabled={!canGenerate}
          >
            {predictionLoading ? (
              <>
                <Loader2
                  size={19}
                  className="spin"
                />

                Generating...
              </>
            ) : (
              <>
                <Sparkles size={19} />

                Generate AI Forecast
              </>
            )}
          </button>

        </section>

        {/* =================================================
            PREDICTION RESULT
            ================================================= */}

        {prediction && (
          <section className="prediction-result">

            <div className="prediction-result-header">

              <div>

                <span className="forecast-eyebrow">
                  STEP 03 · AI RESULT
                </span>

                <h3>
                  {mealType} demand
                  forecast
                </h3>

                <p>
                  {date} ·{" "}
                  {getDayTypeLabel(
                    dayType
                  )}
                </p>

              </div>

              <div className="prediction-result-status">

                <div className="prediction-success">
                  <CheckCircle2
                    size={16}
                  />

                  Forecast Ready
                </div>

                {predictionSaving && (
                  <div className="prediction-save-status saving">
                    <Loader2
                      size={14}
                      className="spin"
                    />

                    Saving to Firebase
                  </div>
                )}

                {predictionSaved && (
                  <div className="prediction-save-status saved">
                    <CheckCircle2
                      size={14}
                    />

                    Saved to Firebase
                  </div>
                )}

                {predictionSaveError && (
                  <div className="prediction-save-status save-error">
                    <AlertTriangle
                      size={14}
                    />

                    Save failed
                  </div>
                )}

              </div>

            </div>

            {/* SAVE WARNING */}

            {predictionSaveError && (
              <div className="save-warning">

                <AlertTriangle
                  size={17}
                />

                <div>
                  <strong>
                    Forecast generated
                  </strong>

                  <p>
                    {predictionSaveError}
                  </p>
                </div>

              </div>
            )}

            {/* MAIN NUMBERS */}

            <div className="prediction-main-grid">

              <div className="prediction-number-card primary">

                <div className="prediction-number-icon">
                  <Users size={22} />
                </div>

                <span>
                  Predicted Meals
                </span>

                <strong>
                  {formatNumber(
                    prediction.predicted_meals
                  )}
                </strong>

                <small>
                  Expected student
                  demand
                </small>

              </div>

              <div className="prediction-number-card recommended">

                <div className="prediction-number-icon">
                  <ChefHat size={22} />
                </div>

                <span>
                  Recommended Cooking
                </span>

                <strong>
                  {formatNumber(
                    prediction.recommended_cooking ||
                      prediction.predicted_meals
                  )}
                </strong>

                <small>
                  Includes 5%
                  preparation buffer
                </small>

              </div>

            </div>

            {/* CONTEXT */}

            <div className="prediction-context">

              <ContextItem
                icon={getWeatherIcon(
                  weather?.category
                )}
                label="Weather"
                value={`${Math.round(
                  Number(
                    weather?.temperature ??
                      0
                  )
                )}°C`}
              />

              <ContextItem
                icon={
                  <Database
                    size={17}
                  />
                }
                label="History"
                value={`${formatNumber(
                  history.length
                )} records`}
              />

              <ContextItem
                icon={
                  <CalendarDays
                    size={17}
                  />
                }
                label="Day Type"
                value={getDayTypeLabel(
                  dayType
                )}
              />

              <ContextItem
                icon={
                  <Users
                    size={17}
                  />
                }
                label="Population"
                value={formatNumber(
                  campusPopulation
                )}
              />

            </div>

            {/* INGREDIENTS */}

            <div className="ingredients-section">

              <div className="result-section-heading">

                <div className="result-heading-icon">
                  <Utensils
                    size={17}
                  />
                </div>

                <div>
                  <h4>
                    Ingredient Requirement
                  </h4>

                  <p>
                    Estimated quantities
                    for the recommended
                    cooking amount.
                  </p>
                </div>

              </div>

              <div className="ingredients-grid">

                {Object.entries(
                  prediction.ingredients ||
                    {}
                ).length > 0 ? (
                  Object.entries(
                    prediction.ingredients ||
                      {}
                  ).map(
                    (
                      [
                        ingredient,
                        amount,
                      ]
                    ) => (
                      <div
                        className="ingredient-item"
                        key={ingredient}
                      >

                        <div className="ingredient-icon">
                          <Utensils
                            size={15}
                          />
                        </div>

                        <div>
                          <span>
                            {ingredient}
                          </span>

                          <strong>
                            {formatDecimal(
                              amount,
                              2
                            )}{" "}
                            kg
                          </strong>
                        </div>

                      </div>
                    )
                  )
                ) : (
                  <div className="forecast-empty-small">
                    No ingredient data
                    was returned by
                    the ML API.
                  </div>
                )}

              </div>

            </div>

            {/* FEATURES */}

            <div className="used-features-section">

              <div className="result-section-heading">

                <div className="result-heading-icon">
                  <Database
                    size={17}
                  />
                </div>

                <div>
                  <h4>
                    Historical Features
                    Used
                  </h4>

                  <p>
                    Values supplied to
                    the XGBoost
                    prediction pipeline.
                  </p>
                </div>

              </div>

              <div className="used-features-grid">

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

            {/* MODEL */}

            <div className="model-information">

              <div className="model-information-left">

                <div className="model-icon">
                  <BrainCircuit
                    size={18}
                  />
                </div>

                <div>
                  <strong>
                    {prediction.model ||
                      "XGBoost"}
                  </strong>

                  <p>
                    Prediction generated
                    by the ReFeed ML
                    API.
                  </p>
                </div>

              </div>

              <div className="model-info-badge">
                <CheckCircle2
                  size={14}
                />

                API Connected
              </div>

            </div>

            {/* ACTIONS */}

            <div className="prediction-actions">

              <button
                className="secondary-forecast-button"
                onClick={() => {
                  resetPrediction();
                  window.scrollTo({
                    top: 0,
                    behavior:
                      "smooth",
                  });
                }}
              >
                <RefreshCw
                  size={16}
                />

                Modify Forecast
              </button>

              <button
                className="continue-button"
                onClick={
                  handleContinuePreparation
                }
              >
                Continue to Preparation

                <ArrowRight
                  size={17}
                />
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

              <div className="empty-state-icon">
                <BrainCircuit
                  size={28}
                />
              </div>

              <span>
                READY
              </span>

              <h3>
                Generate your first
                forecast
              </h3>

              <p>
                Configure the meal
                details, check the
                weather and run the
                XGBoost model.
              </p>

              <div className="empty-pipeline">

                <PipelineStep
                  number="1"
                  title="History"
                />

                <span>
                  →
                </span>

                <PipelineStep
                  number="2"
                  title="Weather"
                />

                <span>
                  →
                </span>

                <PipelineStep
                  number="3"
                  title="XGBoost"
                />

                <span>
                  →
                </span>

                <PipelineStep
                  number="4"
                  title="Preparation"
                />

              </div>

            </section>
          )}

        {/* =================================================
            FOOTER NAVIGATION
            ================================================= */}

        <div className="forecast-bottom-navigation">

          <button
            onClick={() =>
              navigate(
                "/dashboard"
              )
            }
          >
            <ArrowLeft
              size={15}
            />

            Back to Dashboard
          </button>

          {prediction && (
            <button
              className="bottom-primary"
              onClick={
                handleContinuePreparation
              }
            >
              Continue to Preparation

              <ArrowRight
                size={15}
              />
            </button>
          )}

        </div>

      </main>
    </div>
  );
}

/* =========================================================
   SMALL COMPONENTS
   ========================================================= */

function LoadingBox({
  text,
}) {
  return (
    <div className="forecast-loading-small">
      <Loader2
        size={18}
        className="spin"
      />

      {text}
    </div>
  );
}

function MiniError({
  text,
}) {
  return (
    <div className="forecast-mini-error">
      <AlertTriangle
        size={17}
      />

      <span>
        {text}
      </span>
    </div>
  );
}

function HistoryFeature({
  label,
  value,
}) {
  const number =
    Number(value);

  return (
    <div className="history-feature">

      <span>
        {label}
      </span>

      <strong>
        {Number.isFinite(number)
          ? Math.round(number)
          : "—"}
      </strong>

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
    <div className="used-feature">

      <span>
        {label}
      </span>

      <strong>
        {Number.isFinite(number)
          ? Math.round(number)
          : "Fallback"}
      </strong>

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

      <div className="context-item-icon">
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

function WorkflowStep({
  number,
  title,
  active = false,
}) {
  return (
    <div
      className={`workflow-step ${
        active ? "active" : ""
      }`}
    >
      <span>
        {number}
      </span>

      <strong>
        {title}
      </strong>
    </div>
  );
}

function WorkflowLine() {
  return (
    <div className="workflow-line" />
  );
}

function PipelineStep({
  number,
  title,
}) {
  return (
    <div className="pipeline-step">

      <span>
        {number}
      </span>

      <strong>
        {title}
      </strong>

    </div>
  );
}