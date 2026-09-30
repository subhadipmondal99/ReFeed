const ML_API_URL =
  import.meta.env.VITE_ML_API_URL || "http://127.0.0.1:8000";

/**
 * Generate a meal-demand prediction using the XGBoost ML API.
 *
 * @param {Object} params
 * @param {string} params.date - Forecast date, e.g. "2026-10-01"
 * @param {string} params.mealType - "Lunch" or "Dinner"
 * @param {string} params.dayType - "regular", "exam", or "holiday"
 * @param {number} params.temperature - Temperature in Celsius
 * @param {number} params.rainfallMm - Rainfall in millimeters
 * @param {number} params.campusPopulation - Campus population
 * @param {number} params.isFestival - 0 or 1
 *
 * @returns {Promise<Object>} ML prediction response
 */
export const predictMealDemand = async ({
  date,
  mealType,
  dayType = "regular",
  temperature = 28,
  rainfallMm = 0,
  campusPopulation = 1000,
  isFestival = 0,
}) => {
  // -----------------------------------------
  // Validate required input
  // -----------------------------------------

  if (!date) {
    throw new Error("Forecast date is required.");
  }

  if (!mealType) {
    throw new Error("Meal type is required.");
  }

  // -----------------------------------------
  // Prepare request data
  // -----------------------------------------

  const requestData = {
    date,
    meal_type: mealType,
    day_type: dayType,

    temperature: Number(temperature),
    rainfall_mm: Number(rainfallMm),

    campus_population: Number(campusPopulation),
    is_festival: Number(isFestival),

    // ---------------------------------------
    // Temporary historical-demand features
    // ---------------------------------------
    // These will later come from Firebase
    // meal history / historical CSV.
    //
    // DO NOT remove them yet because the
    // FastAPI model currently requires them.
    // ---------------------------------------

    lag_1: 700,
    lag_7: 700,
    lag_14: 700,

    rolling_7: 700,
    rolling_14: 700,
    rolling_30: 700,
  };

  console.log("Sending request to ML API:", requestData);

  // -----------------------------------------
  // Call FastAPI
  // -----------------------------------------

  let response;

  try {
    response = await fetch(`${ML_API_URL}/predict`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(requestData),
    });
  } catch (error) {
    console.error("ML API connection error:", error);

    throw new Error(
      "Cannot connect to the ML API. Make sure FastAPI is running on port 8000."
    );
  }

  // -----------------------------------------
  // Handle API error
  // -----------------------------------------

  if (!response.ok) {
    const message = await response.text();

    console.error(
      "ML API returned an error:",
      response.status,
      message
    );

    throw new Error(
      message ||
        `ML API request failed with status ${response.status}.`
    );
  }

  // -----------------------------------------
  // Read JSON response
  // -----------------------------------------

  const result = await response.json();

  console.log("ML API response:", result);

  // -----------------------------------------
  // Validate ML response
  // -----------------------------------------

  if (!result || result.success !== true) {
    throw new Error(
      "The ML API returned an invalid prediction response."
    );
  }

  if (
    typeof result.predicted_meals !== "number"
  ) {
    throw new Error(
      "The ML API response does not contain predicted meal data."
    );
  }

  // -----------------------------------------
  // Return result to Forecast.jsx
  // -----------------------------------------

  return result;
};