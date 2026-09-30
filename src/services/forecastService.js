const DEMO_MEAL_HISTORY = [
  {
    date: "2026-09-29",
    mealType: "lunch",
    served: 690,
  },
  {
    date: "2026-09-28",
    mealType: "lunch",
    served: 710,
  },
  {
    date: "2026-09-27",
    mealType: "lunch",
    served: 720,
  },
  {
    date: "2026-09-26",
    mealType: "lunch",
    served: 680,
  },
  {
    date: "2026-09-25",
    mealType: "lunch",
    served: 705,
  },

  {
    date: "2026-09-29",
    mealType: "dinner",
    served: 650,
  },
  {
    date: "2026-09-28",
    mealType: "dinner",
    served: 670,
  },
  {
    date: "2026-09-27",
    mealType: "dinner",
    served: 640,
  },
];

/*
|--------------------------------------------------------------------------
| Calculate Forecast
|--------------------------------------------------------------------------
*/

export const calculateForecast = ({
  historicalMeals = DEMO_MEAL_HISTORY,
  dayType = "regular",
  weather = "normal",
  mealType = "lunch",
}) => {
  const relevantMeals =
    historicalMeals.filter(
      (meal) =>
        meal.mealType === mealType
    );

  if (!relevantMeals.length) {
    return 100;
  }

  const total = relevantMeals.reduce(
    (sum, meal) =>
      sum + Number(meal.served || 0),
    0
  );

  let prediction =
    total / relevantMeals.length;

  /*
  |--------------------------------------------------------------------------
  | Day adjustments
  |--------------------------------------------------------------------------
  */

  if (dayType === "holiday") {
    prediction *= 0.35;
  }

  if (dayType === "exam") {
    prediction *= 0.75;
  }

  /*
  |--------------------------------------------------------------------------
  | Weather adjustments
  |--------------------------------------------------------------------------
  */

  if (weather === "rain") {
    prediction *= 0.85;
  }

  if (weather === "hot") {
    prediction *= 0.90;
  }

  return Math.max(
    0,
    Math.round(prediction)
  );
};

/*
|--------------------------------------------------------------------------
| Generate Forecast Object
|--------------------------------------------------------------------------
*/

export const generateForecast = ({
  date,
  mealType,
  dayType,
  weather,
  historicalMeals = DEMO_MEAL_HISTORY,
}) => {
  const predictedMeals =
    calculateForecast({
      historicalMeals,
      dayType,
      weather,
      mealType,
    });

  return {
    date,
    mealType,
    dayType,
    weather,
    predictedMeals,
    generatedAt:
      new Date().toISOString(),
  };
};

/*
|--------------------------------------------------------------------------
| Save Forecast
|--------------------------------------------------------------------------
*/

export const savePrediction = async ({
  db,
  forecast,
  userId,
}) => {
  if (!db) {
    throw new Error(
      "Firebase database is not available."
    );
  }

  const {
    collection,
    addDoc,
    serverTimestamp,
  } = await import("firebase/firestore");

  const ref = await addDoc(
    collection(db, "predictions"),
    {
      ...forecast,
      userId: userId || null,
      createdAt: serverTimestamp(),
    }
  );

  return ref.id;
};