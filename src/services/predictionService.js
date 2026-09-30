import {
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase/auth";

const PREDICTIONS_COLLECTION = "predictions";

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
  if (!date) {
    throw new Error("Prediction date is required.");
  }

  if (!mealType) {
    throw new Error("Meal type is required.");
  }

  if (
    predictedMeals === undefined ||
    predictedMeals === null ||
    Number.isNaN(Number(predictedMeals))
  ) {
    throw new Error(
      "Valid predicted meal count is required."
    );
  }

  const predictionRecord = {
    date,

    meal_type: mealType,

    day_type: dayType,

    campus_population:
      Number(campusPopulation) || 0,

    is_festival:
      Number(isFestival) === 1 ? 1 : 0,

    predicted_meals:
      Math.max(
        0,
        Math.round(Number(predictedMeals))
      ),

    recommended_cooking:
      Math.max(
        0,
        Math.round(
          Number(
            recommendedCooking ??
              predictedMeals
          )
        )
      ),

    ingredients: ingredients || {},

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

    historical_records:
      Number(historicalRecords) || 0,

    historical_features: {
      lag_1:
        historicalFeatures.lag_1 ?? null,

      lag_7:
        historicalFeatures.lag_7 ?? null,

      lag_14:
        historicalFeatures.lag_14 ?? null,

      rolling_7:
        historicalFeatures.rolling_7 ?? null,

      rolling_14:
        historicalFeatures.rolling_14 ?? null,

      rolling_30:
        historicalFeatures.rolling_30 ?? null,
    },

    model,

    createdAt: serverTimestamp(),
  };

  const predictionRef = await addDoc(
    collection(
      db,
      PREDICTIONS_COLLECTION
    ),
    predictionRecord
  );

  return {
    id: predictionRef.id,
    ...predictionRecord,
  };
};