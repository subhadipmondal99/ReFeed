import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CloudRain,
  CloudSun,
  Droplets,
  LogOut,
  RefreshCw,
  Sparkles,
  Sun,
  Thermometer,
  Utensils,
  Waves,
  Wheat,
  Wind,
  XCircle,
} from "lucide-react";

import { predictMealDemand } from "../services/mlService";
import { getWeatherForDate } from "../services/weatherService";
import { logoutUser } from "../firebase/auth";

import "./Forecast.css";


// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

const getTodayDate = () => {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};


const formatDate = (dateString) => {
  if (!dateString) return "";

  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};


const getWeatherIcon = (category) => {
  if (category === "rain" || category === "storm") {
    return <CloudRain size={28} />;
  }

  if (category === "hot") {
    return <Sun size={28} />;
  }

  if (category === "cold") {
    return <CloudSun size={28} />;
  }

  return <CloudSun size={28} />;
};


const getWeatherLabel = (category) => {
  switch (category) {
    case "rain":
      return "Rainy";
    case "storm":
      return "Storm";
    case "hot":
      return "Hot";
    case "cold":
      return "Cold";
    default:
      return "Normal";
  }
};


const formatNumber = (value) => {
  if (value === undefined || value === null || Number.isNaN(Number(value))) {
    return "—";
  }

  return Number(value).toLocaleString("en-IN");
};


// ------------------------------------------------------------
// Component
// ------------------------------------------------------------

export default function Forecast() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    date: getTodayDate(),
    mealType: "lunch",
    dayType: "regular",
  });

  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState("");

  const [forecast, setForecast] = useState(null);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [forecastError, setForecastError] = useState("");

  // ----------------------------------------------------------
  // Load weather whenever date changes
  // ----------------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    const loadWeather = async () => {
      if (!formData.date) return;

      setWeatherLoading(true);
      setWeatherError("");

      try {
        const result = await getWeatherForDate(formData.date);

        if (!cancelled) {
          setWeather(result);
        }
      } catch (error) {
        console.error("Weather loading failed:", error);

        if (!cancelled) {
          setWeather(null);
          setWeatherError(
            error?.message || "Unable to load weather information."
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
  }, [formData.date]);


  // ----------------------------------------------------------
  // Form change
  // ----------------------------------------------------------

  const handleChange = (field, value) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));

    setForecastError("");
  };


  // ----------------------------------------------------------
  // Refresh weather
  // ----------------------------------------------------------

  const handleRefreshWeather = async () => {
    if (!formData.date) return;

    setWeatherLoading(true);
    setWeatherError("");

    try {
      const result = await getWeatherForDate(formData.date);
      setWeather(result);
    } catch (error) {
      console.error(error);

      setWeather(null);
      setWeatherError(
        error?.message || "Unable to refresh weather information."
      );
    } finally {
      setWeatherLoading(false);
    }
  };


  // ----------------------------------------------------------
  // Generate forecast
  // ----------------------------------------------------------

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.date) {
      setForecastError("Please select a forecast date.");
      return;
    }

    if (!weather) {
      setForecastError(
        "Weather information is not available yet. Please wait or refresh."
      );
      return;
    }

    setForecastLoading(true);
    setForecastError("");

    try {
      const result = await predictMealDemand({
        date: formData.date,
        mealType:
          formData.mealType.charAt(0).toUpperCase() +
          formData.mealType.slice(1),
        dayType: formData.dayType,

        // Open-Meteo weather
        temperature: weather.temperature,
        rainfallMm: weather.rainfallMm,

        // Current demo campus population.
        // Later this can come from Firebase.
        campusPopulation: 1000,

        isFestival: 0,
      });

      setForecast(result);
    } catch (error) {
      console.error("Forecast failed:", error);

      setForecastError(
        error?.message ||
          "Unable to generate forecast. Make sure the ML API is running."
      );
    } finally {
      setForecastLoading(false);
    }
  };


  // ----------------------------------------------------------
  // Logout
  // ----------------------------------------------------------

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };


  // ----------------------------------------------------------
  // Derived values
  // ----------------------------------------------------------

  const predictedMeals = forecast?.predicted_meals ?? null;
  const recommendedCooking = forecast?.recommended_cooking ?? null;

  const ingredients = forecast?.ingredients || {};

  const ingredientEntries = [
    {
      name: "Rice",
      value: ingredients.Rice,
      icon: Wheat,
    },
    {
      name: "Dal",
      value: ingredients.Dal,
      icon: Utensils,
    },
    {
      name: "Vegetables",
      value: ingredients.Vegetables,
      icon: Sparkles,
    },
    {
      name: "Oil",
      value: ingredients.Oil,
      icon: Droplets,
    },
    {
      name: "Flour",
      value: ingredients.Flour,
      icon: Wheat,
    },
    {
      name: "Spices",
      value: ingredients.Spices,
      icon: Sparkles,
    },
  ];


  // ----------------------------------------------------------
  // UI
  // ----------------------------------------------------------

  return (
    <div className="forecast-page">

      {/* =====================================================
          TOP NAVIGATION
      ====================================================== */}

      <header className="forecast-header">
        <div className="forecast-header-inner">

          <Link to="/dashboard" className="forecast-brand">
            <div className="forecast-brand-icon">
              <Utensils size={20} />
            </div>

            <div>
              <div className="forecast-brand-name">
                MealRescue
              </div>

              <div className="forecast-brand-subtitle">
                Canteen Intelligence
              </div>
            </div>
          </Link>


          <div className="forecast-header-actions">

            <Link
              to="/dashboard"
              className="forecast-dashboard-link"
            >
              <ArrowLeft size={17} />
              Dashboard
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="forecast-logout-button"
            >
              <LogOut size={17} />
              Logout
            </button>

          </div>

        </div>
      </header>


      {/* =====================================================
          MAIN PAGE
      ====================================================== */}

      <main className="forecast-main">

        <div className="forecast-container">

          {/* =================================================
              PAGE TITLE
          ================================================== */}

          <section className="forecast-heading">

            <div className="forecast-heading-left">

              <div className="forecast-eyebrow">
                <Sparkles size={15} />
                AI-Powered Demand Planning
              </div>

              <h1>
                Demand Forecast
              </h1>

              <p>
                Predict canteen meal demand using historical patterns,
                academic schedules and live weather conditions.
              </p>

            </div>

            <div className="forecast-engine-badge">
              <span className="status-dot" />
              XGBoost Engine Ready
            </div>

          </section>


          {/* =================================================
              MAIN GRID
          ================================================== */}

          <section className="forecast-grid">

            {/* =================================================
                LEFT — FORECAST FORM
            ================================================== */}

            <div className="forecast-card">

              <div className="forecast-card-header">

                <div className="forecast-card-icon">
                  <CalendarDays size={21} />
                </div>

                <div>
                  <h2>
                    Forecast Configuration
                  </h2>

                  <p>
                    Select the day and meal you want to predict.
                  </p>
                </div>

              </div>


              <form
                onSubmit={handleSubmit}
                className="forecast-form"
              >

                {/* DATE */}

                <div className="forecast-field">

                  <label htmlFor="forecast-date">
                    Forecast Date
                  </label>

                  <div className="forecast-input-wrapper">

                    <CalendarDays size={18} />

                    <input
                      id="forecast-date"
                      type="date"
                      value={formData.date}
                      onChange={(event) =>
                        handleChange("date", event.target.value)
                      }
                      required
                    />

                  </div>

                  {formData.date && (
                    <span className="forecast-field-help">
                      {formatDate(formData.date)}
                    </span>
                  )}

                </div>


                {/* MEAL TYPE */}

                <div className="forecast-field">

                  <label>
                    Meal Type
                  </label>

                  <div className="meal-type-grid">

                    <label
                      className={`meal-option ${
                        formData.mealType === "lunch"
                          ? "meal-option-active"
                          : ""
                      }`}
                    >

                      <input
                        type="radio"
                        name="mealType"
                        value="lunch"
                        checked={formData.mealType === "lunch"}
                        onChange={(event) =>
                          handleChange(
                            "mealType",
                            event.target.value
                          )
                        }
                      />

                      <div className="meal-option-content">

                        <Utensils size={21} />

                        <div>
                          <strong>Lunch</strong>
                          <span>Midday meal</span>
                        </div>

                      </div>

                    </label>


                    <label
                      className={`meal-option ${
                        formData.mealType === "dinner"
                          ? "meal-option-active"
                          : ""
                      }`}
                    >

                      <input
                        type="radio"
                        name="mealType"
                        value="dinner"
                        checked={formData.mealType === "dinner"}
                        onChange={(event) =>
                          handleChange(
                            "mealType",
                            event.target.value
                          )
                        }
                      />

                      <div className="meal-option-content">

                        <Utensils size={21} />

                        <div>
                          <strong>Dinner</strong>
                          <span>Evening meal</span>
                        </div>

                      </div>

                    </label>

                  </div>

                </div>


                {/* DAY TYPE */}

                <div className="forecast-field">

                  <label htmlFor="day-type">
                    Academic Day Type
                  </label>

                  <select
                    id="day-type"
                    value={formData.dayType}
                    onChange={(event) =>
                      handleChange(
                        "dayType",
                        event.target.value
                      )
                    }
                  >

                    <option value="regular">
                      Regular Class Day
                    </option>

                    <option value="exam">
                      Examination Day
                    </option>

                    <option value="holiday">
                      Holiday
                    </option>

                  </select>

                </div>


                {/* =================================================
                    WEATHER
                ================================================== */}

                <div className="weather-card">

                  <div className="weather-card-top">

                    <div className="weather-title">

                      <div className="weather-icon">
                        {weatherLoading ? (
                          <RefreshCw
                            size={25}
                            className="spin"
                          />
                        ) : (
                          getWeatherIcon(weather?.category)
                        )}
                      </div>

                      <div>

                        <div className="weather-title-row">

                          <h3>
                            Campus Weather
                          </h3>

                          <span className="automatic-badge">
                            Automatic
                          </span>

                        </div>

                        <p>
                          Open-Meteo live forecast
                        </p>

                      </div>

                    </div>


                    <button
                      type="button"
                      onClick={handleRefreshWeather}
                      disabled={weatherLoading}
                      className="weather-refresh-button"
                      title="Refresh weather"
                    >
                      <RefreshCw
                        size={17}
                        className={
                          weatherLoading ? "spin" : ""
                        }
                      />
                    </button>

                  </div>


                  {weatherLoading && (

                    <div className="weather-loading">

                      <RefreshCw
                        size={19}
                        className="spin"
                      />

                      <span>
                        Loading weather data...
                      </span>

                    </div>

                  )}


                  {!weatherLoading && weatherError && (

                    <div className="weather-error">

                      <XCircle size={19} />

                      <div>

                        <strong>
                          Weather unavailable
                        </strong>

                        <span>
                          {weatherError}
                        </span>

                      </div>

                    </div>

                  )}


                  {!weatherLoading &&
                    !weatherError &&
                    weather && (

                    <>

                      <div className="weather-main">

                        <div className="weather-temperature">

                          <strong>
                            {Math.round(weather.temperature)}
                            <span>°C</span>
                          </strong>

                          <span>
                            {weather.description}
                          </span>

                        </div>

                        <div className="weather-category">
                          {getWeatherLabel(weather.category)}
                        </div>

                      </div>


                      <div className="weather-stats">

                        <div className="weather-stat">

                          <Thermometer size={17} />

                          <div>
                            <span>Min Temp</span>
                            <strong>
                              {Math.round(weather.minTemperature)}°C
                            </strong>
                          </div>

                        </div>


                        <div className="weather-stat">

                          <Sun size={17} />

                          <div>
                            <span>Max Temp</span>
                            <strong>
                              {Math.round(weather.maxTemperature)}°C
                            </strong>
                          </div>

                        </div>


                        <div className="weather-stat">

                          <CloudRain size={17} />

                          <div>
                            <span>Rain</span>
                            <strong>
                              {weather.rainfallMm.toFixed(1)} mm
                            </strong>
                          </div>

                        </div>


                        <div className="weather-stat">

                          <Droplets size={17} />

                          <div>
                            <span>Precipitation</span>
                            <strong>
                              {weather.precipitationMm.toFixed(1)} mm
                            </strong>
                          </div>

                        </div>

                      </div>


                      <div className="weather-source">

                        <Waves size={14} />

                        Weather source: Open-Meteo

                      </div>

                    </>

                  )}

                </div>


                {/* ERROR */}

                {forecastError && (

                  <div className="forecast-error">

                    <XCircle size={20} />

                    <div>

                      <strong>
                        Forecast could not be generated
                      </strong>

                      <span>
                        {forecastError}
                      </span>

                    </div>

                  </div>

                )}


                {/* BUTTON */}

                <button
                  type="submit"
                  disabled={
                    forecastLoading ||
                    weatherLoading ||
                    !weather
                  }
                  className="generate-button"
                >

                  {forecastLoading ? (
                    <>
                      <RefreshCw
                        size={19}
                        className="spin"
                      />

                      Generating Forecast...
                    </>
                  ) : (
                    <>
                      <Sparkles size={19} />

                      Generate AI Forecast

                      <ArrowRight size={18} />
                    </>
                  )}

                </button>

              </form>

            </div>


            {/* =================================================
                RIGHT — RESULT
            ================================================== */}

            <div className="forecast-result-card">

              {!forecast && !forecastLoading && (

                <div className="forecast-empty">

                  <div className="forecast-empty-icon">
                    <Sparkles size={32} />
                  </div>

                  <h2>
                    Your Forecast Will Appear Here
                  </h2>

                  <p>
                    Select a date, meal type and academic day.
                    Then generate a forecast to see predicted
                    demand and recommended cooking quantity.
                  </p>

                  <div className="forecast-empty-points">

                    <div>
                      <CheckCircle2 size={17} />
                      Historical demand
                    </div>

                    <div>
                      <CheckCircle2 size={17} />
                      Academic calendar
                    </div>

                    <div>
                      <CheckCircle2 size={17} />
                      Live weather
                    </div>

                    <div>
                      <CheckCircle2 size={17} />
                      XGBoost prediction
                    </div>

                  </div>

                </div>

              )}


              {forecastLoading && (

                <div className="forecast-empty">

                  <div className="forecast-loading-icon">
                    <RefreshCw
                      size={32}
                      className="spin"
                    />
                  </div>

                  <h2>
                    Generating Forecast
                  </h2>

                  <p>
                    The XGBoost model is processing the selected
                    date, meal type and weather conditions.
                  </p>

                  <div className="loading-line" />
                  <div className="loading-line short" />

                </div>

              )}


              {forecast && !forecastLoading && (

                <div className="forecast-result-content">

                  {/* RESULT HEADER */}

                  <div className="result-header">

                    <div>

                      <div className="result-success">
                        <CheckCircle2 size={17} />
                        Forecast generated successfully
                      </div>

                      <h2>
                        {forecast.meal_type} Demand
                      </h2>

                      <p>
                        {formatDate(forecast.date)}
                      </p>

                    </div>

                    <div className="result-model">
                      <Sparkles size={15} />
                      XGBoost
                    </div>

                  </div>


                  {/* BIG PREDICTION */}

                  <div className="prediction-box">

                    <div className="prediction-label">
                      Predicted Meals
                    </div>

                    <div className="prediction-number">
                      {formatNumber(predictedMeals)}
                    </div>

                    <div className="prediction-description">
                      Estimated students expected to take this meal
                    </div>

                  </div>


                  {/* RECOMMENDED */}

                  <div className="recommendation-box">

                    <div className="recommendation-icon">
                      <Utensils size={21} />
                    </div>

                    <div className="recommendation-text">

                      <span>
                        Recommended Cooking Quantity
                      </span>

                      <strong>
                        {formatNumber(recommendedCooking)} meals
                      </strong>

                    </div>

                    <div className="recommendation-buffer">
                      +5%
                    </div>

                  </div>


                  {/* WEATHER INPUT USED */}

                  {weather && (

                    <div className="result-weather">

                      <div className="result-weather-title">
                        <CloudSun size={18} />

                        Weather used by model
                      </div>

                      <div className="result-weather-values">

                        <span>
                          {Math.round(weather.temperature)}°C
                        </span>

                        <span>
                          {weather.description}
                        </span>

                        <span>
                          Rain {weather.rainfallMm.toFixed(1)} mm
                        </span>

                      </div>

                    </div>

                  )}

                </div>

              )}

            </div>

          </section>


          {/* =================================================
              INGREDIENT PLAN
          ================================================== */}

          {forecast && !forecastLoading && (

            <section className="ingredients-section">

              <div className="section-heading">

                <div>

                  <div className="section-eyebrow">
                    <Wheat size={15} />
                    Preparation Plan
                  </div>

                  <h2>
                    Ingredient Requirements
                  </h2>

                  <p>
                    Estimated quantities based on the recommended
                    cooking quantity with a 3% ingredient buffer.
                  </p>

                </div>

                <div className="ingredient-meal-count">
                  <Utensils size={16} />

                  {formatNumber(recommendedCooking)} meals

                </div>

              </div>


              <div className="ingredient-grid">

                {ingredientEntries.map((ingredient) => {

                  const Icon = ingredient.icon;

                  return (

                    <div
                      key={ingredient.name}
                      className="ingredient-card"
                    >

                      <div className="ingredient-icon">
                        <Icon size={20} />
                      </div>

                      <div className="ingredient-info">

                        <span>
                          {ingredient.name}
                        </span>

                        <strong>
                          {ingredient.value !== undefined
                            ? `${ingredient.value} kg`
                            : "—"}
                        </strong>

                      </div>

                    </div>

                  );

                })}

              </div>

            </section>

          )}


          {/* =================================================
              HOW IT WORKS
          ================================================== */}

          <section className="how-section">

            <div className="section-heading">

              <div>

                <div className="section-eyebrow">
                  <Sparkles size={15} />
                  Forecast Pipeline
                </div>

                <h2>
                  How the prediction works
                </h2>

              </div>

            </div>


            <div className="pipeline-grid">

              <PipelineStep
                number="01"
                title="Calendar"
                description="Date, weekday and academic day type."
                icon={CalendarDays}
              />

              <PipelineArrow />

              <PipelineStep
                number="02"
                title="Weather"
                description="Temperature, rain and precipitation."
                icon={CloudRain}
              />

              <PipelineArrow />

              <PipelineStep
                number="03"
                title="ML Model"
                description="XGBoost estimates expected demand."
                icon={Sparkles}
              />

              <PipelineArrow />

              <PipelineStep
                number="04"
                title="Preparation"
                description="Recommended cooking and ingredients."
                icon={Utensils}
              />

            </div>

          </section>


          {/* =================================================
              MODEL NOTE
          ================================================== */}

          <section className="model-note">

            <div className="model-note-icon">
              <Wind size={21} />
            </div>

            <div>

              <strong>
                Forecast Engine
              </strong>

              <p>
                This page sends the selected date, meal type,
                academic day type and Open-Meteo weather data
                to the XGBoost ML API.
              </p>

            </div>

          </section>

        </div>

      </main>

    </div>
  );
}


// ------------------------------------------------------------
// Pipeline Step
// ------------------------------------------------------------

function PipelineStep({
  number,
  title,
  description,
  icon: Icon,
}) {
  return (
    <div className="pipeline-step">

      <div className="pipeline-number">
        {number}
      </div>

      <div className="pipeline-icon">
        <Icon size={21} />
      </div>

      <div>

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


// ------------------------------------------------------------
// Pipeline Arrow
// ------------------------------------------------------------

function PipelineArrow() {
  return (
    <div className="pipeline-arrow">
      <ArrowRight size={20} />
    </div>
  );
}