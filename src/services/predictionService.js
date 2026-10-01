import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { db } from "../firebase/auth";

/* =========================================================
   FIRESTORE COLLECTION
   ========================================================= */

const PREDICTIONS_COLLECTION = "predictions";

/* =========================================================
   HELPERS
   ========================================================= */

/**
 * Creates a stable Firestore document ID.
 *
 * Example:
 * 2026-10-03 + Dinner
 * → 2026-10-03_dinner
 */
const createPredictionId = (
  date,
  mealType
) => {
  const safeDate = String(date)
    .trim()
    .replace(/[^a-zA-Z0-9-_]/g, "-");

  const safeMealType = String(mealType)
    .trim()
    .toLowerCase()
    .replace(/[^a-zA-Z0-9-_]/g, "-");

  return `${safeDate}_${safeMealType}`;
};

/**
 * Converts a Firestore prediction document
 * into a clean JavaScript object.
 */
const normalizePrediction = (snapshot) => {
  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data();

  return {
    id: snapshot.id,

    /* Basic forecast information */
    date: data.date || "",

    meal_type:
      data.meal_type || "Lunch",

    day_type:
      data.day_type || "regular",

    /* Campus information */
    campus_population:
      Number(data.campus_population) || 0,

    is_festival:
      Number(data.is_festival) === 1
        ? 1
        : 0,

    /* Weather */
    weather:
      data.weather || null,

    /* Prediction result */
    predicted_meals:
      Number(data.predicted_meals) || 0,

    recommended_cooking:
      Number(data.recommended_cooking) || 0,

    /* Ingredients */
    ingredients:
      data.ingredients || {},

    /* ML information */
    historical_records:
      Number(data.historical_records) || 0,

    historical_features:
      data.historical_features || {},

    model:
      data.model || "XGBoost",

    /* AI explanation */
    explanation:
      data.explanation || null,

    /* Document information */
    type:
      data.type ||
      "meal_demand_forecast",

    createdAt:
      data.createdAt || null,

    updatedAt:
      data.updatedAt || null,
  };
};

/* =========================================================
   SAVE PREDICTION
   ========================================================= */

/**
 * Save a forecast to Firebase Firestore.
 *
 * The document ID is generated from:
 *
 * date + meal type
 *
 * Example:
 * predictions/
 *   2026-10-03_dinner
 *
 * If the same date + meal type is generated again,
 * the existing forecast is updated instead of creating
 * duplicate documents.
 */
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

  explanation = null,
}) => {
  /* -------------------------------------------------------
     VALIDATION
     ------------------------------------------------------- */

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

  /* -------------------------------------------------------
     CREATE STABLE DOCUMENT ID
     ------------------------------------------------------- */

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

  /* -------------------------------------------------------
     CHECK EXISTING DOCUMENT
     ------------------------------------------------------- */

  const existingSnapshot =
    await getDoc(predictionRef);

  /* -------------------------------------------------------
     PREPARE DATA
     ------------------------------------------------------- */

  const predictionData = {
    id: predictionId,

    date: String(date),

    meal_type: String(mealType),

    day_type: String(dayType),

    campus_population:
      Number(campusPopulation) || 0,

    is_festival:
      Number(isFestival) === 1
        ? 1
        : 0,

    weather:
      weather || null,

    predicted_meals:
      Number(predictedMeals),

    recommended_cooking:
      Number(
        recommendedCooking ??
          predictedMeals
      ),

    ingredients:
      ingredients || {},

    historical_records:
      Number(historicalRecords) || 0,

    historical_features:
      historicalFeatures || {},

    model:
      model || "XGBoost",

    explanation:
      explanation || null,

    type:
      "meal_demand_forecast",

    /*
     * This timestamp changes whenever the
     * forecast is generated/updated.
     */
    updatedAt:
      serverTimestamp(),
  };

  /* -------------------------------------------------------
     SAVE TO FIRESTORE
     ------------------------------------------------------- */

  if (existingSnapshot.exists()) {
    /*
     * Existing forecast:
     * update it without replacing createdAt.
     */
    await setDoc(
      predictionRef,
      predictionData,
      {
        merge: true,
      }
    );
  } else {
    /*
     * New forecast:
     * create it and store createdAt.
     */
    await setDoc(
      predictionRef,
      {
        ...predictionData,

        createdAt:
          serverTimestamp(),
      }
    );
  }

  /* -------------------------------------------------------
     VERIFY FIREBASE SAVE
     ------------------------------------------------------- */

  const savedSnapshot =
    await getDoc(predictionRef);

  if (!savedSnapshot.exists()) {
    throw new Error(
      "Forecast could not be verified in Firebase."
    );
  }

  /* -------------------------------------------------------
     RETURN SAVED DATA
     ------------------------------------------------------- */

  return normalizePrediction(
    savedSnapshot
  );
};

/* =========================================================
   GET PREDICTION
   ========================================================= */

/**
 * Get a specific forecast using:
 *
 * date + meal type
 *
 * Example:
 *
 * getPrediction({
 *   date: "2026-10-03",
 *   mealType: "Dinner"
 * })
 */
export const getPrediction = async ({
  date,
  mealType,
}) => {
  if (!date || !mealType) {
    return null;
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
    await getDoc(predictionRef);

  return normalizePrediction(
    snapshot
  );
};

/* =========================================================
   GET LATEST PREDICTION
   ========================================================= */

/**
 * Gets the most recently updated forecast.
 *
 * Used when the user leaves the Forecast page
 * and comes back later.
 *
 * Example:
 *
 * User generates:
 * 03 Oct Dinner
 *
 * Leaves page.
 *
 * Comes back.
 *
 * This function retrieves:
 * 03 Oct Dinner
 */
export const getLatestPrediction =
  async () => {
    const predictionsRef =
      collection(
        db,
        PREDICTIONS_COLLECTION
      );

    const predictionQuery =
      query(
        predictionsRef,

        orderBy(
          "updatedAt",
          "desc"
        ),

        limit(1)
      );

    const snapshot =
      await getDocs(
        predictionQuery
      );

    if (snapshot.empty) {
      return null;
    }

    return normalizePrediction(
      snapshot.docs[0]
    );
  };

/* =========================================================
   GET RECENT PREDICTIONS
   ========================================================= */

/**
 * Gets multiple recent forecasts.
 *
 * Useful for:
 * - Forecast history
 * - Dashboard
 * - Saved Forecasts
 * - Analytics
 */
export const getRecentPredictions =
  async (maxRecords = 10) => {
    const predictionsRef =
      collection(
        db,
        PREDICTIONS_COLLECTION
      );

    const predictionQuery =
      query(
        predictionsRef,

        orderBy(
          "updatedAt",
          "desc"
        ),

        limit(maxRecords)
      );

    const snapshot =
      await getDocs(
        predictionQuery
      );

    return snapshot.docs.map(
      (prediction) =>
        normalizePrediction(
          prediction
        )
    );
  };