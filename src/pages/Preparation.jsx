import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ChefHat, CheckCircle2, Package, Utensils } from "lucide-react";
import { useState } from "react";

export default function Preparation() {
  const navigate = useNavigate();
  const location = useLocation();

  const [checkedItems, setCheckedItems] = useState({});

  // Forecast data can be passed from Forecast page through React Router state.
  const forecast = location.state?.forecast || null;

  // Demo fallback values.
  // These are used if the Preparation page is opened directly.
  const predictedMeals = forecast?.predicted_meals ?? 596;
  const recommendedCooking = forecast?.recommended_cooking ?? 626;

  const ingredients = forecast?.ingredients || {
    Rice: 48.36,
    Dal: 19.34,
    Vegetables: 64.48,
    Oil: 6.45,
    Flour: 12.9,
    Spices: 3.22,
  };

  const mealType = forecast?.meal_type || "Lunch";
  const forecastDate = forecast?.date || new Date().toISOString().split("T")[0];

  const ingredientEntries = Object.entries(ingredients);

  const toggleItem = (ingredient) => {
    setCheckedItems((previous) => ({
      ...previous,
      [ingredient]: !previous[ingredient],
    }));
  };

  const completedCount = ingredientEntries.filter(
    ([ingredient]) => checkedItems[ingredient]
  ).length;

  const progress =
    ingredientEntries.length > 0
      ? Math.round((completedCount / ingredientEntries.length) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <button
              onClick={() => navigate("/dashboard")}
              className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
            >
              <ArrowLeft size={17} />
              Back to Dashboard
            </button>

            <h1 className="text-2xl font-bold tracking-tight">
              Preparation Plan
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Convert your demand forecast into a practical cooking plan.
            </p>
          </div>

          <div className="hidden items-center gap-3 rounded-xl bg-emerald-50 px-4 py-3 sm:flex">
            <ChefHat className="text-emerald-600" size={22} />

            <div>
              <p className="text-xs font-medium text-emerald-600">
                Preparation Status
              </p>

              <p className="font-semibold text-emerald-900">
                {progress}% Complete
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Top summary */}
        <section className="grid gap-5 md:grid-cols-3">
          <SummaryCard
            icon={<Utensils size={22} />}
            label="Meal Type"
            value={mealType}
            description={forecastDate}
          />

          <SummaryCard
            icon={<Package size={22} />}
            label="Predicted Demand"
            value={`${predictedMeals} meals`}
            description="AI forecast"
          />

          <SummaryCard
            icon={<ChefHat size={22} />}
            label="Recommended Cooking"
            value={`${recommendedCooking} meals`}
            description="Includes 5% safety buffer"
          />
        </section>

        {/* Main content */}
        <section className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          {/* Ingredient table */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold">
                    Ingredient Requirements
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Estimated quantity required for the recommended cooking
                    count.
                  </p>
                </div>

                <div className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">
                  {recommendedCooking} meals
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left">
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Ingredient
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Required
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {ingredientEntries.map(([ingredient, quantity]) => {
                    const completed = checkedItems[ingredient];

                    return (
                      <tr
                        key={ingredient}
                        className="border-b border-slate-100 last:border-0"
                      >
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-800">
                            {ingredient}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            Kitchen requirement
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          <span className="text-lg font-bold text-slate-900">
                            {quantity}
                          </span>

                          <span className="ml-1 text-sm text-slate-500">
                            kg
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <button
                            onClick={() => toggleItem(ingredient)}
                            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                              completed
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                          >
                            <CheckCircle2 size={17} />

                            {completed ? "Ready" : "Mark Ready"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Preparation checklist */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold">
              Kitchen Preparation
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Track ingredient preparation before serving begins.
            </p>

            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700">
                  Progress
                </span>

                <span className="font-semibold text-emerald-600">
                  {completedCount}/{ingredientEntries.length}
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {ingredientEntries.map(([ingredient]) => {
                const completed = checkedItems[ingredient];

                return (
                  <button
                    key={ingredient}
                    onClick={() => toggleItem(ingredient)}
                    className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition ${
                      completed
                        ? "border-emerald-200 bg-emerald-50"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                          completed
                            ? "bg-emerald-100 text-emerald-600"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        <CheckCircle2 size={19} />
                      </div>

                      <div>
                        <p className="font-semibold text-slate-800">
                          {ingredient}
                        </p>

                        <p className="text-xs text-slate-500">
                          {ingredients[ingredient]} kg required
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-xs font-semibold ${
                        completed
                          ? "text-emerald-600"
                          : "text-slate-400"
                      }`}
                    >
                      {completed ? "READY" : "PENDING"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Flow */}
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
                ReFeed Workflow
              </p>

              <h2 className="mt-1 text-xl font-bold">
                Predict → Prepare → Serve → Rescue → Measure
              </h2>

              <p className="mt-2 max-w-2xl text-sm text-slate-500">
                Your demand forecast is now converted into an actionable
                kitchen preparation plan.
              </p>
            </div>

            <button
              onClick={() => navigate("/forecast")}
              className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              View Forecast
            </button>
          </div>
        </section>

        {/* Continue button */}
        <section className="mt-6 flex justify-end">
          <button
            onClick={() => navigate("/meal-operations")}
            className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            Continue to Meal Operations →
          </button>
        </section>
      </main>
    </div>
  );
}

function SummaryCard({ icon, label, value, description }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          {icon}
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {label}
          </p>

          <p className="mt-1 text-xl font-bold text-slate-900">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}