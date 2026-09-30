const ML_API_URL =
  import.meta.env.VITE_ML_API_URL ||
  "http://127.0.0.1:8000";

/*
|--------------------------------------------------------------------------
| Utility
|--------------------------------------------------------------------------
*/

const toNumber = (value, fallback = 0) => {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
};

const sortHistory = (history = []) => {
  return [...history]
    .filter(
      (record) =>
        record &&
        record.date &&
        Number.isFinite(
          Number(record.actual_headcount)
        )
    )
    .sort((a, b) =>
      String(a.date).localeCompare(
        String(b.date)
      )
    );
};

/*
|--------------------------------------------------------------------------
| Historical Feature Calculation
|--------------------------------------------------------------------------
|
| These features match the features used when the
| XGBoost model was trained.
|
*/

export const calculateHistoricalFeatures = (
  history = []
) => {
  const sortedHistory = sortHistory(history);

  const demand = sortedHistory.map((record) =>
    Number(record.actual_headcount)
  );

  const getLag = (daysBack, fallback = 700) => {
    if (demand.length < daysBack) {
      return fallback;
    }

    return demand[demand.length - daysBack];
  };

  const getRollingAverage = (
    window,
    fallback = 700
  ) => {
    if (demand.length === 0) {
      return fallback;
    }

    const values = demand.slice(-window);

    if (values.length === 0) {
      return fallback;
    }

    const total = values.reduce(
      (sum, value) => sum + value,
      0
    );

    return total / values.length;
  };

  return {
    lag_1: getLag(1),
    lag_7: getLag(7),
    lag_14: getLag(14),

    rolling_7: getRollingAverage(7),
    rolling_14: getRollingAverage(14),
    rolling_30: getRollingAverage(30),
  };
};

/*
|--------------------------------------------------------------------------
| Prepare Prediction Request
|--------------------------------------------------------------------------
*/

export const prepareForecastRequest = ({
  date,
  mealType,
  dayType = "regular",
  temperature = 28,
  rainfallMm = 0,
  campusPopulation = 1000,
  isFestival = 0,
  history = [],
}) => {
  if (!date) {
    throw new Error(
      "Forecast date is required."
    );
  }

  if (!mealType) {
    throw new Error(
      "Meal type is required."
    );
  }

  const historicalFeatures =
    calculateHistoricalFeatures(history);

  return {
    date,

    meal_type: mealType,

    day_type: dayType,

    temperature: toNumber(
      temperature,
      28
    ),

    rainfall_mm: toNumber(
      rainfallMm,
      0
    ),

    campus_population: Math.max(
      0,
      Math.round(
        toNumber(
          campusPopulation,
          1000
        )
      )
    ),

    is_festival:
      Number(isFestival) === 1 ? 1 : 0,

    lag_1: toNumber(
      historicalFeatures.lag_1,
      700
    ),

    lag_7: toNumber(
      historicalFeatures.lag_7,
      700
    ),

    lag_14: toNumber(
      historicalFeatures.lag_14,
      700
    ),

    rolling_7: toNumber(
      historicalFeatures.rolling_7,
      700
    ),

    rolling_14: toNumber(
      historicalFeatures.rolling_14,
      700
    ),

    rolling_30: toNumber(
      historicalFeatures.rolling_30,
      700
    ),
  };
};

/*
|--------------------------------------------------------------------------
| Call ML API
|--------------------------------------------------------------------------
*/

export const getForecastPrediction = async ({
  date,
  mealType,
  dayType = "regular",
  temperature = 28,
  rainfallMm = 0,
  campusPopulation = 1000,
  isFestival = 0,
  history = [],
}) => {
  const requestBody =
    prepareForecastRequest({
      date,
      mealType,
      dayType,
      temperature,
      rainfallMm,
      campusPopulation,
      isFestival,
      history,
    });

  console.log(
    "ReFeed ML request:",
    requestBody
  );

  let response;

  try {
    response = await fetch(
      `${ML_API_URL}/predict`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(
          requestBody
        ),
      }
    );
  } catch (error) {
    console.error(
      "ML API connection error:",
      error
    );

    throw new Error(
      "Unable to connect to the ReFeed ML API. Please check whether the ML service is running."
    );
  }

  let data;

  try {
    data = await response.json();
  } catch (error) {
    console.error(
      "Invalid ML API response:",
      error
    );

    throw new Error(
      "The ML API returned an invalid response."
    );
  }

  if (!response.ok) {
    console.error(
      "ML API error:",
      response.status,
      data
    );

    throw new Error(
      data?.detail ||
        data?.message ||
        `ML API request failed with status ${response.status}.`
    );
  }

  if (
    data?.success === false
  ) {
    throw new Error(
      data?.message ||
        "The ML model could not generate a prediction."
    );
  }

  const predictedMeals = Math.max(
    0,
    Math.round(
      toNumber(
        data?.predicted_meals,
        0
      )
    )
  );

  const recommendedCooking = Math.max(
    0,
    Math.round(
      toNumber(
        data?.recommended_cooking,
        predictedMeals * 1.05
      )
    )
  );

  return {
    ...data,

    success: true,

    date,

    meal_type: mealType,

    predicted_meals: predictedMeals,

    recommended_cooking:
      recommendedCooking,

    ingredients:
      data?.ingredients || {},

    model:
      data?.model || "XGBoost",

    historical_features:
      calculateHistoricalFeatures(
        history
      ),

    historical_records:
      Array.isArray(history)
        ? history.length
        : 0,
  };
};

/*
|--------------------------------------------------------------------------
| Health Check
|--------------------------------------------------------------------------
*/

export const checkMLApiHealth = async () => {
  try {
    const response = await fetch(
      `${ML_API_URL}/health`
    );

    if (!response.ok) {
      return {
        healthy: false,
        message:
          "ML API health check failed.",
      };
    }

    const data =
      await response.json();

    return {
      healthy:
        data?.status ===
        "healthy",

      ...data,
    };
  } catch (error) {
    console.error(
      "ML API health error:",
      error
    );

    return {
      healthy: false,
      message:
        "Unable to connect to ML API.",
    };
  }
};

/*
|--------------------------------------------------------------------------
| API URL
|--------------------------------------------------------------------------
*/

export const getMLApiUrl = () =>
  ML_API_URL;