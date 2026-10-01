const clamp = (value, min, max) =>
  Math.min(Math.max(value, min), max);

const toNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const average = (values = []) => {
  const valid = values
    .map(Number)
    .filter(Number.isFinite);

  if (!valid.length) return 0;

  return (
    valid.reduce((sum, value) => sum + value, 0) /
    valid.length
  );
};

const getDemandStrength = (history = []) => {
  if (!history.length) {
    return {
      level: "Limited",
      tone: "neutral",
      description:
        "There is not enough historical data to identify a strong demand pattern.",
    };
  }

  const recent = history
    .slice(-7)
    .map((item) => Number(item.actual_headcount))
    .filter(Number.isFinite);

  if (!recent.length) {
    return {
      level: "Limited",
      tone: "neutral",
      description:
        "Historical demand is available, but recent records are incomplete.",
    };
  }

  const recentAverage = average(recent);

  const older = history
    .slice(-30, -7)
    .map((item) => Number(item.actual_headcount))
    .filter(Number.isFinite);

  if (!older.length) {
    return {
      level: "Recent data",
      tone: "positive",
      description:
        `The latest records show an average demand of approximately ${Math.round(
          recentAverage
        )} meals.`,
    };
  }

  const olderAverage = average(older);

  const difference =
    olderAverage > 0
      ? ((recentAverage - olderAverage) /
          olderAverage) *
        100
      : 0;

  if (difference >= 8) {
    return {
      level: "Strong",
      tone: "positive",
      description:
        `Recent demand is about ${Math.round(
          difference
        )}% higher than the older historical baseline.`,
    };
  }

  if (difference <= -8) {
    return {
      level: "Lower",
      tone: "warning",
      description:
        `Recent demand is about ${Math.abs(
          Math.round(difference)
        )}% below the older historical baseline.`,
    };
  }

  return {
    level: "Stable",
    tone: "neutral",
    description:
      "Recent demand is broadly consistent with the historical baseline.",
  };
};

const getPopulationImpact = ({
  campusPopulation,
  history = [],
}) => {
  const population = toNumber(campusPopulation, 0);

  if (!population) {
    return {
      level: "Unknown",
      tone: "neutral",
      description:
        "Campus population was not available for this forecast.",
    };
  }

  const recentDemand = average(
    history
      .slice(-7)
      .map((item) => Number(item.actual_headcount))
      .filter(Number.isFinite)
  );

  if (!recentDemand) {
    return {
      level: `${population.toLocaleString()} students`,
      tone: "neutral",
      description:
        "The forecast uses the configured campus population as an attendance signal.",
    };
  }

  const ratio = recentDemand / population;

  if (ratio >= 0.7) {
    return {
      level: "High participation",
      tone: "positive",
      description:
        `Recent demand represents a relatively high share of the ${population.toLocaleString()}-student campus population.`,
    };
  }

  if (ratio >= 0.45) {
    return {
      level: "Moderate",
      tone: "neutral",
      description:
        `The ${population.toLocaleString()}-student campus population provides a moderate demand base.`,
    };
  }

  return {
    level: "Lower participation",
    tone: "warning",
    description:
      `Historical demand represents a smaller share of the ${population.toLocaleString()}-student campus population.`,
  };
};

const getWeatherImpact = ({
  temperature,
  rainfallMm,
}) => {
  const temp = toNumber(temperature, 28);
  const rain = toNumber(rainfallMm, 0);

  if (rain >= 10) {
    return {
      level: "High rain",
      tone: "warning",
      description:
        `Rainfall of ${rain.toFixed(
          1
        )} mm may reduce campus movement and attendance.`,
    };
  }

  if (rain > 2) {
    return {
      level: "Some rain",
      tone: "warning",
      description:
        `Light-to-moderate rainfall of ${rain.toFixed(
          1
        )} mm is included as a weather signal.`,
    };
  }

  if (temp >= 35) {
    return {
      level: "Very warm",
      tone: "warning",
      description:
        `The temperature is around ${Math.round(
          temp
        )}°C, so heat is included as a contextual factor.`,
    };
  }

  if (temp <= 15) {
    return {
      level: "Cool",
      tone: "neutral",
      description:
        `The temperature is around ${Math.round(
          temp
        )}°C. Weather conditions are included in the forecast.`,
    };
  }

  return {
    level: "Low impact",
    tone: "positive",
    description:
      `At approximately ${Math.round(
        temp
      )}°C with ${rain.toFixed(
        1
      )} mm rainfall, weather is not showing a strong disruption signal.`,
  };
};

const getAcademicImpact = (dayType, isFestival) => {
  const type = String(dayType || "regular").toLowerCase();

  if (type === "exam") {
    return {
      level: "Exam day",
      tone: "warning",
      description:
        "Exam-day status is included as an academic-calendar signal.",
    };
  }

  if (type === "holiday") {
    return {
      level: "Holiday",
      tone: "warning",
      description:
        "Holiday status is included because campus attendance can differ significantly.",
    };
  }

  if (Number(isFestival) === 1) {
    return {
      level: "Festival",
      tone: "neutral",
      description:
        "Festival status is included as an additional calendar signal.",
    };
  }

  return {
    level: "Regular day",
    tone: "positive",
    description:
      "No exam or holiday adjustment is being applied to the academic calendar.",
  };
};

const getMealImpact = (mealType) => {
  const normalized = String(mealType || "Lunch").toLowerCase();

  if (normalized === "dinner") {
    return {
      level: "Dinner",
      tone: "neutral",
      description:
        "The model is using the dinner demand pattern from historical records.",
    };
  }

  return {
    level: "Lunch",
    tone: "positive",
    description:
      "The model is using the lunch demand pattern from historical records.",
  };
};

export const generateForecastExplanation = ({
  prediction,
  mealType,
  dayType,
  campusPopulation,
  temperature,
  rainfallMm,
  isFestival,
  history = [],
}) => {
  const predictedMeals = Math.max(
    0,
    Math.round(toNumber(prediction?.predicted_meals, 0))
  );

  const recommendedCooking = Math.max(
    0,
    Math.round(
      toNumber(
        prediction?.recommended_cooking,
        predictedMeals * 1.05
      )
    )
  );

  const demand = getDemandStrength(history);

  const population = getPopulationImpact({
    campusPopulation,
    history,
  });

  const weather = getWeatherImpact({
    temperature,
    rainfallMm,
  });

  const academic = getAcademicImpact(
    dayType,
    isFestival
  );

  const meal = getMealImpact(mealType);

  const safetyBuffer =
    predictedMeals > 0
      ? Math.round(
          ((recommendedCooking - predictedMeals) /
            predictedMeals) *
            100
        )
      : 5;

  const signals = [
    {
      id: "history",
      icon: "trend",
      label: "Historical demand",
      value: demand.level,
      description: demand.description,
      tone: demand.tone,
    },
    {
      id: "population",
      icon: "users",
      label: "Campus population",
      value: population.level,
      description: population.description,
      tone: population.tone,
    },
    {
      id: "weather",
      icon: "weather",
      label: "Weather",
      value: weather.level,
      description: weather.description,
      tone: weather.tone,
    },
    {
      id: "academic",
      icon: "calendar",
      label: "Academic calendar",
      value: academic.level,
      description: academic.description,
      tone: academic.tone,
    },
    {
      id: "meal",
      icon: "meal",
      label: "Meal pattern",
      value: meal.level,
      description: meal.description,
      tone: meal.tone,
    },
  ];

  let summary =
    `ReFeed predicts approximately ${predictedMeals.toLocaleString()} ${mealType?.toLowerCase() || "meal"} meals using historical demand, campus population, weather and calendar signals.`;

  if (demand.tone === "positive") {
    summary =
      `Recent demand is providing a positive signal, so the forecast is supported by the latest campus meal patterns.`;
  }

  if (weather.tone === "warning") {
    summary +=
      " Weather conditions are also being considered as a possible attendance factor.";
  }

  const recommendation =
    recommendedCooking > predictedMeals
      ? `Prepare approximately ${recommendedCooking.toLocaleString()} meals. This includes a ${clamp(
          safetyBuffer,
          0,
          20
        )}% preparation buffer above the predicted demand.`
      : `Prepare approximately ${recommendedCooking.toLocaleString()} meals based on the current forecast.`;

  return {
    predictedMeals,
    recommendedCooking,
    signals,
    summary,
    recommendation,
    modelLabel:
      prediction?.model || "XGBoost demand model",
    historicalRecords: history.length,
  };
};

export default generateForecastExplanation;