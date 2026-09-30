import {
  Wheat,
  Soup,
  Carrot,
  Droplets,
  Utensils,
} from "lucide-react";

const INGREDIENT_INFO = {
  rice: {
    label: "Rice",
    unit: "kg",
    icon: Wheat,
  },

  dal: {
    label: "Dal",
    unit: "kg",
    icon: Soup,
  },

  vegetables: {
    label: "Vegetables",
    unit: "kg",
    icon: Carrot,
  },

  oil: {
    label: "Cooking Oil",
    unit: "kg",
    icon: Droplets,
  },

  flour: {
    label: "Flour",
    unit: "kg",
    icon: Utensils,
  },
};

export default function IngredientPlan({
  ingredients,
  predictedMeals,
}) {
  if (!predictedMeals) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">

      <div className="flex items-center justify-between">

        <div>

          <h2 className="font-semibold text-gray-900">
            Ingredient Preparation Plan
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Estimated ingredients for{" "}
            <span className="font-medium text-gray-700">
              {predictedMeals} meals
            </span>
          </p>

        </div>

        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
          <Wheat
            size={20}
            className="text-orange-600"
          />
        </div>

      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">

        {Object.entries(ingredients || {}).map(
          ([key, quantity]) => {
            const info =
              INGREDIENT_INFO[key];

            if (!info) return null;

            const Icon = info.icon;

            return (
              <div
                key={key}
                className="rounded-xl border border-gray-100 bg-gray-50 p-4"
              >

                <div className="flex items-center justify-between">

                  <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center border border-gray-100">
                    <Icon
                      size={18}
                      className="text-emerald-600"
                    />
                  </div>

                </div>

                <p className="mt-4 text-sm text-gray-500">
                  {info.label}
                </p>

                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {quantity}
                  <span className="ml-1 text-sm font-medium text-gray-400">
                    {info.unit}
                  </span>
                </p>

              </div>
            );
          }
        )}

      </div>

      <div className="mt-5 rounded-xl bg-emerald-50 border border-emerald-100 p-4">

        <p className="text-sm text-emerald-800">
          <span className="font-semibold">
            Preparation recommendation:
          </span>{" "}
          Prepare ingredients according to the predicted
          meal demand to reduce over-preparation and food
          waste.
        </p>

      </div>

    </div>
  );
}