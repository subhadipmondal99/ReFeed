// src/services/weatherService.js

// --------------------------------------------------
// Open-Meteo Weather API
// --------------------------------------------------

const WEATHER_API_URL =
  "https://api.open-meteo.com/v1/forecast";

// --------------------------------------------------
// YOUR CAMPUS LOCATION
// --------------------------------------------------
// These are the coordinates from your Open-Meteo URL.
//
// Latitude:
// 22.45864377537633
//
// Longitude:
// 88.17017622991516
//
// IMPORTANT:
// Make sure these coordinates are actually your
// college/canteen location.
// --------------------------------------------------

const CAMPUS_LOCATION = {
  latitude: 22.45864377537633,
  longitude: 88.17017622991516,
};

// --------------------------------------------------
// WMO Weather Code → readable description
// --------------------------------------------------

const WEATHER_CODES = {
  0: "Clear sky",

  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",

  45: "Fog",
  48: "Depositing rime fog",

  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",

  56: "Light freezing drizzle",
  57: "Dense freezing drizzle",

  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",

  66: "Light freezing rain",
  67: "Heavy freezing rain",

  71: "Slight snowfall",
  73: "Moderate snowfall",
  75: "Heavy snowfall",
  77: "Snow grains",

  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",

  85: "Slight snow showers",
  86: "Heavy snow showers",

  95: "Thunderstorm",
  96: "Thunderstorm with slight hail",
  97: "Heavy thunderstorm",
  99: "Thunderstorm with heavy hail",
};

// --------------------------------------------------
// Get readable weather description
// --------------------------------------------------

const getWeatherDescription = (code) => {
  return (
    WEATHER_CODES[code] ||
    "Unknown weather"
  );
};

// --------------------------------------------------
// Get simple category
// --------------------------------------------------

const getWeatherCategory = ({
  weatherCode,
  rainfallMm,
  temperature,
}) => {
  // Thunderstorm
  if (
    weatherCode === 95 ||
    weatherCode === 96 ||
    weatherCode === 97 ||
    weatherCode === 99
  ) {
    return "storm";
  }

  // Rain
  if (
    rainfallMm > 0 ||
    (weatherCode >= 51 &&
      weatherCode <= 67) ||
    (weatherCode >= 80 &&
      weatherCode <= 82)
  ) {
    return "rain";
  }

  // Hot
  if (temperature >= 35) {
    return "hot";
  }

  // Cold
  if (temperature <= 15) {
    return "cold";
  }

  return "normal";
};

// --------------------------------------------------
// Get weather for ONE selected date
// --------------------------------------------------

export const getWeatherForDate = async (
  selectedDate
) => {
  if (!selectedDate) {
    throw new Error(
      "Please select a forecast date."
    );
  }

  // ------------------------------------------------
  // Build URL dynamically
  // ------------------------------------------------

  const url = new URL(
    WEATHER_API_URL
  );

  // Campus location
  url.searchParams.set(
    "latitude",
    CAMPUS_LOCATION.latitude
  );

  url.searchParams.set(
    "longitude",
    CAMPUS_LOCATION.longitude
  );

  // ------------------------------------------------
  // DAILY WEATHER
  // ------------------------------------------------

  url.searchParams.set(
    "daily",
    [
      "temperature_2m_max",
      "temperature_2m_min",
      "precipitation_sum",
      "rain_sum",
      "weather_code",
    ].join(",")
  );

  // Automatically use local timezone
  url.searchParams.set(
    "timezone",
    "auto"
  );

  // ------------------------------------------------
  // Only request the selected date
  // ------------------------------------------------

  url.searchParams.set(
    "start_date",
    selectedDate
  );

  url.searchParams.set(
    "end_date",
    selectedDate
  );

  console.log(
    "Open-Meteo request:",
    url.toString()
  );

  // ------------------------------------------------
  // API request
  // ------------------------------------------------

  let response;

  try {
    response = await fetch(
      url.toString()
    );
  } catch (error) {
    console.error(
      "Open-Meteo connection error:",
      error
    );

    throw new Error(
      "Unable to connect to the weather service."
    );
  }

  // ------------------------------------------------
  // Handle API errors
  // ------------------------------------------------

  if (!response.ok) {
    const message =
      await response.text();

    console.error(
      "Open-Meteo error:",
      response.status,
      message
    );

    throw new Error(
      "Weather API request failed."
    );
  }

  // ------------------------------------------------
  // Convert response to JSON
  // ------------------------------------------------

  const data =
    await response.json();

  console.log(
    "Open-Meteo response:",
    data
  );

  // ------------------------------------------------
  // Validate response
  // ------------------------------------------------

  if (
    !data.daily ||
    !data.daily.time ||
    data.daily.time.length === 0
  ) {
    throw new Error(
      "No weather data was returned for this date."
    );
  }

  // ------------------------------------------------
  // Because we requested one date,
  // the first item belongs to selectedDate.
  // ------------------------------------------------

  const dateIndex = 0;

  const maxTemperature = Number(
    data.daily.temperature_2m_max[
      dateIndex
    ]
  );

  const minTemperature = Number(
    data.daily.temperature_2m_min[
      dateIndex
    ]
  );

  const precipitationMm = Number(
    data.daily.precipitation_sum[
      dateIndex
    ] || 0
  );

  const rainfallMm = Number(
    data.daily.rain_sum[
      dateIndex
    ] || 0
  );

  const weatherCode = Number(
    data.daily.weather_code[
      dateIndex
    ]
  );

  const description =
    getWeatherDescription(
      weatherCode
    );

  const category =
    getWeatherCategory({
      weatherCode,
      rainfallMm,
      temperature: maxTemperature,
    });

  // ------------------------------------------------
  // Return clean weather object
  // ------------------------------------------------

  return {
    date: selectedDate,

    temperature: maxTemperature,

    maxTemperature,

    minTemperature,

    precipitationMm,

    rainfallMm,

    weatherCode,

    description,

    category,

    latitude:
      data.latitude,

    longitude:
      data.longitude,

    timezone:
      data.timezone,
  };
};

// --------------------------------------------------
// Export location
// --------------------------------------------------

export {
  CAMPUS_LOCATION,
};