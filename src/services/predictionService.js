import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase/auth";

const PREDICTIONS_COLLECTION = "predictions";


// ============================================================
// CREATE STABLE FIRESTORE DOCUMENT ID
// ============================================================
//
// Same date + same meal type = same document.
//
// Example:
// 2026-10-02 + Lunch
// => 2026-10-02_lunch
//
// Therefore generating the forecast again replaces/updates
// the previous forecast instead of creating a duplicate.
// ============================================================

const createPredictionId = (
  date,
  mealType
) => {
  const safeDate = String(date)
    .trim()
    .replace(/[^0-9-]/g, "");

  const safeMealType = String(mealType)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  return `${safeDate}_${safeMealType}`;
};


// ============================================================
// SAVE / UPDATE PREDICTION
// ============================================================

export const savePrediction = async ({
  date,
  mealType,
  dayType = "regular",
  campusPopulation = 1000,
  isFestival = 0,

  weather = null,

  predictedMeals,
  recommendedCooking,

  ingredients = {},

  historicalRecords = 0,
  historicalFeatures = {},

  model = "XGBoost",
}) => {

  // ----------------------------------------------------------
  // VALIDATION
  // ----------------------------------------------------------

  if (!date) {
    throw new Error(
      "Prediction date is required."
    );
  }

  if (!mealType) {
    throw new Error(
      "Meal type is required."
    );
  }

  if (
    predictedMeals === undefined ||
    predictedMeals === null ||
    !Number.isFinite(
      Number(predictedMeals)
    )
  ) {
    throw new Error(
      "Valid predicted meal count is required."
    );
  }


  // ----------------------------------------------------------
  // NORMALIZE VALUES
  // ----------------------------------------------------------

  const normalizedPredictedMeals =
    Math.max(
      0,
      Math.round(
        Number(predictedMeals)
      )
    );


  const normalizedRecommendedCooking =
    Math.max(
      0,
      Math.round(
        Number(
          recommendedCooking ??
          normalizedPredictedMeals * 1.05
        )
      )
    );


  // ----------------------------------------------------------
  // STABLE DOCUMENT ID
  // ----------------------------------------------------------

  const predictionId =
    createPredictionId(
      date,
      mealType
    );


  const predictionRef = doc(
    db,
    PREDICTIONS_COLLECTION,
    predictionId
  );


  // ----------------------------------------------------------
  // FIRESTORE DATA
  // ----------------------------------------------------------

  const predictionRecord = {

    id: predictionId,

    date,

    meal_type: mealType,

    day_type: dayType,

    campus_population:
      Number(campusPopulation) || 0,

    is_festival:
      Number(isFestival) === 1
        ? 1
        : 0,


    // --------------------------------------------------------
    // ML RESULT
    // --------------------------------------------------------

    predicted_meals:
      normalizedPredictedMeals,

    recommended_cooking:
      normalizedRecommendedCooking,


    // --------------------------------------------------------
    // INGREDIENTS
    // --------------------------------------------------------

    ingredients:
      ingredients || {},


    // --------------------------------------------------------
    // WEATHER
    // --------------------------------------------------------

    weather: weather
      ? {
          temperature:
            Number(
              weather.temperature ?? 0
            ),

          maxTemperature:
            Number(
              weather.maxTemperature ?? 0
            ),

          minTemperature:
            Number(
              weather.minTemperature ?? 0
            ),

          rainfallMm:
            Number(
              weather.rainfallMm ?? 0
            ),

          precipitationMm:
            Number(
              weather.precipitationMm ?? 0
            ),

          weatherCode:
            Number(
              weather.weatherCode ?? 0
            ),

          description:
            weather.description || "",

          category:
            weather.category || "",
        }
      : null,


    // --------------------------------------------------------
    // HISTORICAL ML FEATURES
    // --------------------------------------------------------

    historical_records:
      Number(historicalRecords) || 0,

    historical_features: {

      lag_1:
        historicalFeatures?.lag_1 ?? null,

      lag_7:
        historicalFeatures?.lag_7 ?? null,

      lag_14:
        historicalFeatures?.lag_14 ?? null,

      rolling_7:
        historicalFeatures?.rolling_7 ?? null,

      rolling_14:
        historicalFeatures?.rolling_14 ?? null,

      rolling_30:
        historicalFeatures?.rolling_30 ?? null,
    },


    // --------------------------------------------------------
    // MODEL
    // --------------------------------------------------------

    model,


    // --------------------------------------------------------
    // TIMESTAMPS
    // --------------------------------------------------------

    updatedAt:
      serverTimestamp(),

    createdAt:
      serverTimestamp(),
  };


  // ----------------------------------------------------------
  // IMPORTANT
  // ----------------------------------------------------------
  //
  // setDoc() with the deterministic ID means:
  //
  // first generation:
  //   CREATE
  //
  // second generation for same date + meal:
  //   UPDATE / REPLACE
  //
  // No duplicate forecast document.
  // ----------------------------------------------------------

  await setDoc(
    predictionRef,
    predictionRecord,
    {
      merge: true,
    }
  );


  return {
    ...predictionRecord,
    id: predictionId,
  };
};


// ============================================================
// GET ONE FORECAST
// ============================================================

export const getPrediction = async (
  date,
  mealType
) => {

  if (!date) {
    throw new Error(
      "Prediction date is required."
    );
  }

  if (!mealType) {
    throw new Error(
      "Meal type is required."
    );
  }


  const predictionId =
    createPredictionId(
      date,
      mealType
    );


  const predictionRef = doc(
    db,
    PREDICTIONS_COLLECTION,
    predictionId
  );


  const snapshot =
    await getDoc(
      predictionRef
    );


  if (!snapshot.exists()) {
    return null;
  }


  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
};


// ============================================================
// GET ALL FORECASTS
// ============================================================

export const getPredictions = async () => {

  const predictionsRef =
    collection(
      db,
      PREDICTIONS_COLLECTION
    );


  const snapshot =
    await getDocs(
      predictionsRef
    );


  return snapshot.docs
    .map((predictionDoc) => ({
      id: predictionDoc.id,
      ...predictionDoc.data(),
    }))
    .sort((a, b) =>
      String(b.date || "").localeCompare(
        String(a.date || "")
      )
    );
};


// ============================================================
// GET LATEST FORECAST
// ============================================================

export const getLatestPrediction = async (
  mealType = null
) => {

  const predictions =
    await getPredictions();


  const filtered =
    mealType
      ? predictions.filter(
          (prediction) =>
            String(
              prediction.meal_type || ""
            ).toLowerCase() ===
            String(
              mealType
            ).toLowerCase()
        )
      : predictions;


  return filtered.length > 0
    ? filtered[0]
    : null;
};


// ============================================================
// EXPORT HELPER
// ============================================================

export const getPredictionDocumentId = (
  date,
  mealType
) => {
  return createPredictionId(
    date,
    mealType
  );
};