from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

import xgboost as xgb
import pandas as pd
import numpy as np
import json
import os


# ============================================================
# APP
# ============================================================

app = FastAPI(
    title="Campus Canteen ML API",
    description="ReFeed AI demand forecasting API",
    version="2.0.0",
)


# ============================================================
# CORS
# ============================================================

ALLOWED_ORIGINS = [
    "https://re-feed-olive.vercel.app",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# FILE PATHS
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

MODEL_PATH = os.path.join(
    BASE_DIR,
    "canteen_demand_model.json",
)

FEATURES_PATH = os.path.join(
    BASE_DIR,
    "model_features.json",
)


# ============================================================
# LOAD XGBOOST MODEL
# ============================================================

if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(
        f"Model file not found: {MODEL_PATH}"
    )

try:
    model = xgb.XGBRegressor()
    model.load_model(MODEL_PATH)

except Exception as error:
    raise RuntimeError(
        f"Failed to load XGBoost model: {error}"
    )


# ============================================================
# LOAD MODEL FEATURES
# ============================================================

DEFAULT_FEATURES = [
    "meal_type_encoded",
    "day_of_week",
    "is_weekend",
    "is_exam",
    "is_festival",
    "is_holiday",
    "temperature",
    "rainfall_mm",
    "campus_population",
    "month",
    "day",
    "week_of_year",
    "sin_day",
    "cos_day",
    "historical_rate_mean",
    "rate_lag_1",
    "rate_lag_7",
    "rate_lag_14",
    "rate_rolling_7",
    "rate_rolling_14",
    "rate_rolling_30",
]


if os.path.exists(FEATURES_PATH):

    try:
        with open(
            FEATURES_PATH,
            "r",
            encoding="utf-8",
        ) as file:

            FEATURES = json.load(file)

    except Exception as error:

        raise RuntimeError(
            f"Failed to read model_features.json: {error}"
        )

else:

    FEATURES = DEFAULT_FEATURES


if not isinstance(FEATURES, list):
    raise RuntimeError(
        "model_features.json must contain a list."
    )


# ============================================================
# REQUEST MODEL
# ============================================================

class ForecastRequest(BaseModel):

    date: str

    meal_type: str

    day_type: str = "regular"

    temperature: float = 28

    rainfall_mm: float = 0

    campus_population: int = Field(
        default=1000,
        ge=0,
    )

    is_festival: int = Field(
        default=0,
        ge=0,
        le=1,
    )

    # --------------------------------------------------------
    # Historical demand values
    # --------------------------------------------------------

    lag_1: float = 700

    lag_7: float = 700

    lag_14: float = 700

    rolling_7: float = 700

    rolling_14: float = 700

    rolling_30: float = 700

    # New model feature
    historical_rate_mean: float = 700


# ============================================================
# BUILD FEATURES
# ============================================================

def build_features(data: ForecastRequest):

    # --------------------------------------------------------
    # Parse date
    # --------------------------------------------------------

    try:

        date = pd.Timestamp(data.date)

    except Exception:

        raise HTTPException(
            status_code=400,
            detail="Invalid forecast date.",
        )


    # --------------------------------------------------------
    # Calendar features
    # --------------------------------------------------------

    day_of_week = date.weekday()

    is_weekend = int(
        day_of_week >= 5
    )

    is_exam = int(
        data.day_type.lower().strip() == "exam"
    )

    is_holiday = int(
        data.day_type.lower().strip() == "holiday"
    )


    # --------------------------------------------------------
    # Meal type
    # --------------------------------------------------------

    meal_type = (
        data.meal_type
        .lower()
        .strip()
    )

    if meal_type not in [
        "lunch",
        "dinner",
    ]:

        raise HTTPException(
            status_code=400,
            detail="meal_type must be Lunch or Dinner.",
        )

    meal_type_encoded = (
        0
        if meal_type == "lunch"
        else 1
    )


    # --------------------------------------------------------
    # Historical rate features
    #
    # The frontend currently sends the historical demand
    # values using the older names.
    #
    # We map them to the new model feature names.
    # --------------------------------------------------------

    historical_rate_mean = float(
        data.historical_rate_mean
    )

    rate_lag_1 = float(
        data.lag_1
    )

    rate_lag_7 = float(
        data.lag_7
    )

    rate_lag_14 = float(
        data.lag_14
    )

    rate_rolling_7 = float(
        data.rolling_7
    )

    rate_rolling_14 = float(
        data.rolling_14
    )

    rate_rolling_30 = float(
        data.rolling_30
    )


    # --------------------------------------------------------
    # Complete feature row
    # --------------------------------------------------------

    row = {

        "meal_type_encoded":
            meal_type_encoded,

        "day_of_week":
            day_of_week,

        "is_weekend":
            is_weekend,

        "is_exam":
            is_exam,

        "is_festival":
            int(data.is_festival),

        "is_holiday":
            is_holiday,

        "temperature":
            float(data.temperature),

        "rainfall_mm":
            float(data.rainfall_mm),

        "campus_population":
            int(data.campus_population),

        "month":
            date.month,

        "day":
            date.day,

        "week_of_year":
            int(date.isocalendar().week),

        "sin_day":
            np.sin(
                2 * np.pi * day_of_week / 7
            ),

        "cos_day":
            np.cos(
                2 * np.pi * day_of_week / 7
            ),

        "historical_rate_mean":
            historical_rate_mean,

        "rate_lag_1":
            rate_lag_1,

        "rate_lag_7":
            rate_lag_7,

        "rate_lag_14":
            rate_lag_14,

        "rate_rolling_7":
            rate_rolling_7,

        "rate_rolling_14":
            rate_rolling_14,

        "rate_rolling_30":
            rate_rolling_30,
    }


    # --------------------------------------------------------
    # Check model features
    # --------------------------------------------------------

    missing_features = [
        feature
        for feature in FEATURES
        if feature not in row
    ]

    if missing_features:

        raise HTTPException(
            status_code=500,
            detail={
                "message":
                    "Model feature mismatch.",

                "missing_features":
                    missing_features,

                "expected_features":
                    FEATURES,
            },
        )


    # --------------------------------------------------------
    # Create DataFrame in EXACT model order
    # --------------------------------------------------------

    X = pd.DataFrame(
        [row]
    )

    X = X[FEATURES]


    return X


# ============================================================
# INGREDIENTS
# ============================================================

INGREDIENTS_PER_MEAL = {

    "Rice": 75,

    "Dal": 30,

    "Vegetables": 100,

    "Oil": 10,

    "Flour": 20,

    "Spices": 5,

}


def calculate_ingredients(
    meal_count: int,
):

    adjusted = (
        meal_count * 1.03
    )

    return {

        ingredient: round(
            adjusted * grams / 1000,
            2,
        )

        for ingredient, grams
        in INGREDIENTS_PER_MEAL.items()

    }


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():

    return {

        "message":
            "Campus Canteen ML API is running",

        "service":
            "ReFeed",

        "model":
            os.path.basename(
                MODEL_PATH
            ),

        "features":
            len(FEATURES),

        "status":
            "online",

    }


# ============================================================
# HEALTH
# ============================================================

@app.get("/health")
def health():

    return {

        "status":
            "healthy",

        "model_loaded":
            True,

        "model":
            os.path.basename(
                MODEL_PATH
            ),

        "features":
            len(FEATURES),

        "feature_names":
            FEATURES,

        "cors_origins":
            ALLOWED_ORIGINS,

    }


# ============================================================
# PREDICT
# ============================================================

@app.post("/predict")
def predict(
    data: ForecastRequest,
):

    try:

        # Build model input
        X = build_features(data)

        # XGBoost prediction
        prediction = model.predict(X)[0]

        predicted_meals = max(
            0,
            round(
                float(prediction)
            ),
        )

        # 5% cooking safety buffer
        recommended_cooking = max(
            0,
            round(
                predicted_meals * 1.05
            ),
        )

        # Ingredients
        ingredients = (
            calculate_ingredients(
                recommended_cooking
            )
        )

        return {

            "success":
                True,

            "date":
                data.date,

            "meal_type":
                data.meal_type,

            "day_type":
                data.day_type,

            "predicted_meals":
                predicted_meals,

            "recommended_cooking":
                recommended_cooking,

            "ingredients":
                ingredients,

            "model":
                "XGBoost JSON",

            "feature_count":
                len(FEATURES),

            "features_used":
                FEATURES,

        }

    except HTTPException:
        raise

    except Exception as error:

        print(
            "Prediction error:",
            error,
        )

        raise HTTPException(

            status_code=500,

            detail={
                "message":
                    "Prediction failed.",

                "error":
                    str(error),

            },

        )


# ============================================================
# STARTUP
# ============================================================

@app.on_event("startup")
def startup_event():

    print("=" * 60)

    print(
        "ReFeed Campus Canteen ML API"
    )

    print("=" * 60)

    print(
        f"Model: "
        f"{os.path.basename(MODEL_PATH)}"
    )

    print(
        f"Features: {len(FEATURES)}"
    )

    print(
        f"Feature names: {FEATURES}"
    )

    print(
        f"Allowed origins: "
        f"{ALLOWED_ORIGINS}"
    )

    print(
        "Model loaded successfully"
    )

    print("=" * 60)