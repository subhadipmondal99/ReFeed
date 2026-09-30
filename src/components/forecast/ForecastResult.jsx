import {
  BrainCircuit,
  CalendarDays,
  Cloud,
  TrendingUp,
} from "lucide-react";

export default function ForecastResult({
  forecast,
}) {
  if (!forecast) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm h-full flex items-center justify-center text-center">
        <div>

          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 flex items-center justify-center">
            <BrainCircuit
              size={28}
              className="text-emerald-600"
            />
          </div>

          <h3 className="mt-4 font-semibold text-gray-900">
            No Forecast Yet
          </h3>

          <p className="mt-2 text-sm text-gray-500 max-w-sm">
            Select the forecast conditions and click
            "Generate Forecast" to calculate expected
            meal demand.
          </p>

        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">

      {/* Header */}

      <div className="flex items-start justify-between gap-4">

        <div className="flex items-center gap-3">

          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
            <BrainCircuit
              size={20}
              className="text-emerald-600"
            />
          </div>

          <div>
            <h2 className="font-semibold text-gray-900">
              Forecast Result
            </h2>

            <p className="text-sm text-gray-500">
              AI demand estimation
            </p>
          </div>

        </div>

        <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
          Ready
        </span>

      </div>

      {/* Main prediction */}

      <div className="mt-6 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 p-6 text-white">

        <p className="text-sm text-emerald-100">
          Predicted {forecast.mealType}
        </p>

        <div className="mt-2 flex items-end gap-3">

          <span className="text-5xl font-bold">
            {forecast.predictedMeals}
          </span>

          <span className="mb-2 text-emerald-100">
            meals
          </span>

        </div>

        <div className="mt-4 flex items-center gap-2 text-sm text-emerald-100">
          <TrendingUp size={16} />
          Based on historical meal demand
        </div>

      </div>

      {/* Details */}

      <div className="grid grid-cols-2 gap-3 mt-5">

        <Detail
          icon={CalendarDays}
          label="Date"
          value={forecast.date}
        />

        <Detail
          icon={Cloud}
          label="Weather"
          value={formatValue(forecast.weather)}
        />

        <Detail
          icon={CalendarDays}
          label="Day Type"
          value={formatValue(forecast.dayType)}
        />

        <Detail
          icon={TrendingUp}
          label="Meal"
          value={formatValue(forecast.mealType)}
        />

      </div>

      {/* Expected range */}

      <div className="mt-5 rounded-xl bg-gray-50 border border-gray-100 p-4">

        <div className="flex items-center justify-between">

          <div>
            <p className="text-sm font-medium text-gray-700">
              Expected Range
            </p>

            <p className="text-xs text-gray-500 mt-1">
              Approximate planning range
            </p>
          </div>

          <p className="font-bold text-gray-900">
            {Math.round(
              forecast.predictedMeals * 0.95
            )}
            {" – "}
            {Math.round(
              forecast.predictedMeals * 1.05
            )}
          </p>

        </div>

      </div>

    </div>
  );
}

function Detail({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">

      <div className="flex items-center gap-2 text-gray-400">
        <Icon size={15} />

        <span className="text-xs">
          {label}
        </span>
      </div>

      <p className="mt-2 text-sm font-semibold text-gray-800">
        {value}
      </p>

    </div>
  );
}

function formatValue(value) {
  if (!value) return "-";

  return String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}