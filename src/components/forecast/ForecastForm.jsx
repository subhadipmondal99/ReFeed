import {
  CalendarDays,
  CloudRain,
  CloudSun,
  Loader2,
  MapPin,
  Sparkles,
  Sun,
  Thermometer,
  Cloud,
  CloudLightning,
} from "lucide-react";

export default function ForecastForm({
  formData,
  onChange,
  onSubmit,
  loading,
  weather,
  weatherLoading,
  weatherError,
}) {
  const getWeatherIcon = () => {
    if (!weather) {
      return <CloudSun size={30} />;
    }

    if (weather.category === "storm") {
      return <CloudLightning size={30} />;
    }

    if (weather.category === "rain") {
      return <CloudRain size={30} />;
    }

    if (weather.category === "hot") {
      return <Sun size={30} />;
    }

    if (weather.category === "cold") {
      return <Cloud size={30} />;
    }

    return <CloudSun size={30} />;
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* DATE */}
      <div>
        <label className="mb-2 flex items-center gap-2 text-sm font-medium">
          <CalendarDays size={18} />
          Forecast Date
        </label>

        <input
          type="date"
          name="date"
          value={formData.date}
          onChange={onChange}
          required
          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        />
      </div>

      {/* MEAL TYPE */}
      <div>
        <label className="mb-3 block text-sm font-medium">
          Meal Type
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label
            className={`cursor-pointer rounded-xl border p-4 transition ${
              formData.mealType === "lunch"
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 bg-white hover:border-blue-300"
            }`}
          >
            <input
              type="radio"
              name="mealType"
              value="lunch"
              checked={formData.mealType === "lunch"}
              onChange={onChange}
              className="mr-2"
            />

            <span className="font-medium">Lunch</span>

            <p className="mt-1 text-xs text-gray-500">
              Midday meal
            </p>
          </label>

          <label
            className={`cursor-pointer rounded-xl border p-4 transition ${
              formData.mealType === "dinner"
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 bg-white hover:border-blue-300"
            }`}
          >
            <input
              type="radio"
              name="mealType"
              value="dinner"
              checked={formData.mealType === "dinner"}
              onChange={onChange}
              className="mr-2"
            />

            <span className="font-medium">Dinner</span>

            <p className="mt-1 text-xs text-gray-500">
              Evening meal
            </p>
          </label>
        </div>
      </div>

      {/* DAY TYPE */}
      <div>
        <label className="mb-2 block text-sm font-medium">
          Day Type
        </label>

        <select
          name="dayType"
          value={formData.dayType}
          onChange={onChange}
          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        >
          <option value="regular">Regular Day</option>
          <option value="exam">Exam Day</option>
          <option value="holiday">Holiday</option>
        </select>
      </div>

      {/* DYNAMIC WEATHER */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm font-medium">
            <CloudSun size={18} />
            Weather
          </label>

          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
            Automatic
          </span>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          {weatherLoading ? (
            <div className="flex items-center gap-3 py-3 text-gray-600">
              <Loader2
                size={24}
                className="animate-spin"
              />

              <div>
                <p className="font-medium">
                  Loading weather...
                </p>

                <p className="text-xs text-gray-500">
                  Getting forecast for {formData.date}
                </p>
              </div>
            </div>
          ) : weatherError ? (
            <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
              <p className="font-medium">
                Unable to load weather
              </p>

              <p className="mt-1">
                {weatherError}
              </p>
            </div>
          ) : weather ? (
            <div className="space-y-4">
              {/* MAIN WEATHER */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    {getWeatherIcon()}
                  </div>

                  <div>
                    <p className="text-lg font-semibold text-gray-900">
                      {weather.description}
                    </p>

                    <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                      <MapPin size={14} />

                      <span>
                        Campus weather
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-3xl font-bold text-gray-900">
                    {Math.round(weather.temperature)}°C
                  </p>

                  <p className="text-xs text-gray-500">
                    Maximum
                  </p>
                </div>
              </div>

              {/* WEATHER DETAILS */}
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="rounded-xl bg-gray-50 p-3">
                  <div className="mb-1 flex items-center gap-2 text-gray-500">
                    <Thermometer size={16} />

                    <span className="text-xs">
                      Min Temp
                    </span>
                  </div>

                  <p className="font-semibold">
                    {Math.round(weather.minTemperature)}°C
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-3">
                  <div className="mb-1 flex items-center gap-2 text-gray-500">
                    <Sun size={16} />

                    <span className="text-xs">
                      Max Temp
                    </span>
                  </div>

                  <p className="font-semibold">
                    {Math.round(weather.maxTemperature)}°C
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-3">
                  <div className="mb-1 flex items-center gap-2 text-gray-500">
                    <CloudRain size={16} />

                    <span className="text-xs">
                      Rain
                    </span>
                  </div>

                  <p className="font-semibold">
                    {weather.rainfallMm.toFixed(1)} mm
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-3">
                  <div className="mb-1 flex items-center gap-2 text-gray-500">
                    <CloudRain size={16} />

                    <span className="text-xs">
                      Precipitation
                    </span>
                  </div>

                  <p className="font-semibold">
                    {weather.precipitationMm.toFixed(1)} mm
                  </p>
                </div>
              </div>

              {/* DATA SOURCE */}
              <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                <span className="text-xs text-gray-500">
                  Weather automatically retrieved for selected date
                </span>

                <span className="text-xs font-medium text-blue-600">
                  Open-Meteo
                </span>
              </div>
            </div>
          ) : (
            <div className="py-5 text-center text-sm text-gray-500">
              Select a date to load weather information.
            </div>
          )}
        </div>
      </div>

      {/* GENERATE BUTTON */}
      <button
        type="submit"
        disabled={loading || weatherLoading || !weather}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2
              size={18}
              className="animate-spin"
            />

            Generating Forecast...
          </>
        ) : (
          <>
            <Sparkles size={18} />

            Generate Forecast
          </>
        )}
      </button>
    </form>
  );
}