import { addDocument } from "../firebase/firestore";

export const calculateForecast = ({
  historicalMeals = [],
  dayType = "regular",
  weather = "normal",
  mealType = "lunch",
}) => {
  if (!historicalMeals.length) {
    return 100;
  }

  const relevantMeals = historicalMeals.filter(
    (meal) => meal.mealType === mealType
  );

  if (!relevantMeals.length) {
    return 100;
  }

  const total = relevantMeals.reduce(
    (sum, meal) => sum + Number(meal.served || 0),
    0
  );

  let prediction = total / relevantMeals.length;

  if (dayType === "holiday") {
    prediction *= 0.35;
  }

  if (dayType === "exam") {
    prediction *= 0.75;
  }

  if (weather === "rain") {
    prediction *= 0.85;
  }

  if (weather === "hot") {
    prediction *= 0.9;
  }

  return Math.round(prediction);
};

export const savePrediction = async ({
  date,
  mealType,
  predictedMeals,
  weather,
  dayType,
}) => {
  return await addDocument("predictions", {
    date,
    mealType,
    predictedMeals,
    weather,
    dayType,
  });
};