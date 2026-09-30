import {
  Leaf,
  Utensils,
  IndianRupee,
  TrendingDown,
} from "lucide-react";

export default function ImpactSummary({
  rescuedMeals,
  foodSavedKg,
  moneySaved,
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div>
        <div className="flex items-center gap-2">
          <Leaf className="h-5 w-5 text-emerald-600" />

          <h2 className="text-lg font-semibold text-gray-900">
            Today's Impact
          </h2>
        </div>

        <p className="mt-1 text-sm text-gray-500">
          Measured impact from rescued food.
        </p>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-emerald-50 p-4">
          <div className="flex items-center gap-2 text-emerald-700">
            <Utensils className="h-4 w-4" />

            <span className="text-sm">
              Meals Rescued
            </span>
          </div>

          <p className="mt-2 text-2xl font-bold text-gray-900">
            {rescuedMeals}
          </p>
        </div>

        <div className="rounded-xl bg-green-50 p-4">
          <div className="flex items-center gap-2 text-green-700">
            <TrendingDown className="h-4 w-4" />

            <span className="text-sm">
              Food Saved
            </span>
          </div>

          <p className="mt-2 text-2xl font-bold text-gray-900">
            {foodSavedKg}
            <span className="ml-1 text-sm font-medium text-gray-500">
              kg
            </span>
          </p>
        </div>

        <div className="rounded-xl bg-blue-50 p-4">
          <div className="flex items-center gap-2 text-blue-700">
            <IndianRupee className="h-4 w-4" />

            <span className="text-sm">
              Value Conserved
            </span>
          </div>

          <p className="mt-2 text-2xl font-bold text-gray-900">
            ₹{Number(moneySaved).toLocaleString("en-IN")}
          </p>
        </div>
      </div>
    </div>
  );
}