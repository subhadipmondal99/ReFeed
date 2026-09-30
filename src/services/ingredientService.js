const DEFAULT_PORTIONS = {
  rice: 0.061,
  dal: 0.024,
  vegetables: 0.055,
  oil: 0.008,
  flour: 0.025,
};

export const calculateIngredients = (
  meals,
  portions = DEFAULT_PORTIONS
) => {
  const result = {};

  Object.entries(portions).forEach(
    ([ingredient, quantityPerMeal]) => {
      result[ingredient] =
        Number(meals) * Number(quantityPerMeal);
    }
  );

  return result;
};

export const roundIngredients = (ingredients) => {
  const result = {};

  Object.entries(ingredients).forEach(
    ([ingredient, quantity]) => {
      result[ingredient] =
        Math.round(quantity * 10) / 10;
    }
  );

  return result;
};