import { addDocument } from "../firebase/firestore";

const MEAL_WEIGHT_KG = 0.45;
const VALUE_PER_MEAL = 40;

export const calculateImpact = (
  rescuedMeals
) => {
  const meals = Number(rescuedMeals || 0);

  const foodSavedKg =
    meals * MEAL_WEIGHT_KG;

  const moneySaved =
    meals * VALUE_PER_MEAL;

  return {
    rescuedMeals: meals,
    foodSavedKg:
      Math.round(foodSavedKg * 10) / 10,
    moneySaved,
  };
};

export const saveImpact = async ({
  date,
  rescuedMeals,
}) => {
  const impact =
    calculateImpact(rescuedMeals);

  return await addDocument("impact", {
    date,
    ...impact,
  });
};