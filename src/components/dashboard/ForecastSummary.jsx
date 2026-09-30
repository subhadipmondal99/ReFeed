import {
  Brain,
  CloudSun,
  CalendarDays,
  RefreshCw,
} from "lucide-react";

export default function ForecastSummary({
  forecast,
  ingredients,
  loading = false,
  onRunForecast,
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-emerald-600" />

            <h2 className="text-lg font-semibold text-gray-900">
              Demand Forecast
            </h2>
          </div>

          <p className="mt-1 text-sm text-gray-500">
            Predicted meals and preparation requirements.
          </p>
        </div>

        <button
          type="button"
          onClick={onRunForecast}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            className={[
              "h-4 w-4",
              loading ? "animate-spin" : "",
            ].join(" ")}
          />

          {loading ? "Calculating..." : "Run Forecast"}
        </button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-emerald-50 p-4">
          <div className="flex items-center gap-2 text-sm text-emerald-700">
            <CalendarDays className="h-4 w-4" />
            Date
          </div>

          <p className="mt-2 text-lg font-bold text-gray-900">
            {forecast.date}
          </p>
        </div>

        <div className="rounded-xl bg-blue-50 p-4">
          <div className="flex items-center gap-2 text-sm text-blue-700">
            <CloudSun className="h-4 w-4" />
            Weather
          </div>

          <p className="mt-2 text-lg font-bold text-gray-900">
            {forecast.weather}
          </p>
        </div>

        <div className="rounded-xl bg-purple-50 p-4">
          <p className="text-sm text-purple-700">
            Predicted {forecast.mealType}
          </p>

          <p className="mt-2 text-2xl font-bold text-gray-900">
            {forecast.predictedMeals}
            <span className="ml-1 text-sm font-medium text-gray-500">
              meals
            </span>
          </p>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-gray-900">
          Ingredient Requirement
        </h3>

        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Object.entries(ingredients).map(
            ([ingredient, quantity]) => (
              <div
                key={ingredient}
                className="rounded-xl border border-gray-100 bg-gray-50 p-4"
              >
                <p className="text-xs capitalize text-gray-500">
                  {ingredient}
                </p>

                <p className="mt-1 text-lg font-bold text-gray-900">
                  {quantity} kg
                </p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}