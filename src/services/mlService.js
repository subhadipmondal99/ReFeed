const ML_API_URL =
  import.meta.env.VITE_ML_API_URL || "http://127.0.0.1:8000";

export const predictMealDemand = async ({
  date,
  mealType,
  dayType,
  temperature,
  rainfallMm,
  campusPopulation,
  isFestival,
}) => {
  try {
    const response = await fetch(`${ML_API_URL}/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        date,
        meal_type: mealType,
        day_type: dayType,
        temperature,
        rainfall_mm: rainfallMm,
        campus_population: campusPopulation,
        is_festival: isFestival,

        // Historical demand features
        // Currently using demo values.
        lag_1: 700,
        lag_7: 700,
        lag_14: 700,
        rolling_7: 700,
        rolling_14: 700,
        rolling_30: 700,
      }),
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || "ML API request failed");
    }

    return await response.json();
  } catch (error) {
    console.error("ML API Error:", error);

    if (error instanceof TypeError) {
      throw new Error(
        "Cannot connect to the ML prediction server."
      );
    }

    throw error;
  }
};