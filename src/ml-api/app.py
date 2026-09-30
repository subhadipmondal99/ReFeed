from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import xgboost as xgb
import pandas as pd
import numpy as np
import json
import os


app = FastAPI(title="Campus Canteen ML API")


# Allow React frontend to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


MODEL_PATH = "canteen_demand_model.json"
FEATURES_PATH = "model_features.json"


# --------------------------------------------------
# Load model
# --------------------------------------------------

if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(
        f"Model file not found: {MODEL_PATH}"
    )

model = xgb.XGBRegressor()
model.load_model(MODEL_PATH)


# --------------------------------------------------
# Load feature names
# --------------------------------------------------

if os.path.exists(FEATURES_PATH):
    with open(FEATURES_PATH, "r") as f:
        FEATURES = json.load(f)
else:
    FEATURES = [
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
        "week_of_year",
        "sin_day",
        "cos_day",
        "lag_1",
        "lag_7",
        "lag_14",
        "rolling_7",
        "rolling_14",
        "rolling_30",
    ]


# --------------------------------------------------
# Request model
# --------------------------------------------------

class ForecastRequest(BaseModel):
    date: str
    meal_type: str
    day_type: str = "regular"
    temperature: float = 28
    rainfall_mm: float = 0
    campus_population: int = 1000
    is_festival: int = 0

    # Historical values used to create lag/rolling features
    lag_1: float = 700
    lag_7: float = 700
    lag_14: float = 700
    rolling_7: float = 700
    rolling_14: float = 700
    rolling_30: float = 700


# --------------------------------------------------
# Build features
# --------------------------------------------------

def build_features(data: ForecastRequest):

    date = pd.Timestamp(data.date)

    day_of_week = date.weekday()
    is_weekend = int(day_of_week >= 5)

    is_exam = int(data.day_type.lower() == "exam")
    is_holiday = int(data.day_type.lower() == "holiday")

    meal_type_encoded = (
        0 if data.meal_type.lower() == "lunch" else 1
    )

    row = {
        "meal_type_encoded": meal_type_encoded,
        "day_of_week": day_of_week,
        "is_weekend": is_weekend,
        "is_exam": is_exam,
        "is_festival": data.is_festival,
        "is_holiday": is_holiday,
        "temperature": data.temperature,
        "rainfall_mm": data.rainfall_mm,
        "campus_population": data.campus_population,
        "month": date.month,
        "week_of_year": int(date.isocalendar().week),
        "sin_day": np.sin(2 * np.pi * day_of_week / 7),
        "cos_day": np.cos(2 * np.pi * day_of_week / 7),
        "lag_1": data.lag_1,
        "lag_7": data.lag_7,
        "lag_14": data.lag_14,
        "rolling_7": data.rolling_7,
        "rolling_14": data.rolling_14,
        "rolling_30": data.rolling_30,
    }

    return pd.DataFrame([row])[FEATURES]


# --------------------------------------------------
# Ingredients
# --------------------------------------------------

INGREDIENTS_PER_MEAL = {
    "Rice": 75,
    "Dal": 30,
    "Vegetables": 100,
    "Oil": 10,
    "Flour": 20,
    "Spices": 5,
}


def calculate_ingredients(meal_count):

    adjusted = meal_count * 1.03

    return {
        ingredient: round(adjusted * grams / 1000, 2)
        for ingredient, grams in INGREDIENTS_PER_MEAL.items()
    }


# --------------------------------------------------
# Routes
# --------------------------------------------------

@app.get("/")
def root():

    return {
        "message": "Campus Canteen ML API is running",
        "model": MODEL_PATH,
    }


@app.get("/health")
def health():

    return {
        "status": "healthy",
        "model_loaded": True,
        "features": len(FEATURES),
    }


@app.post("/predict")
def predict(data: ForecastRequest):

    X = build_features(data)

    prediction = model.predict(X)[0]

    predicted_meals = max(0, round(float(prediction)))

    recommended_cooking = round(
        predicted_meals * 1.05
    )

    ingredients = calculate_ingredients(
        recommended_cooking
    )

    return {
        "success": True,
        "date": data.date,
        "meal_type": data.meal_type,
        "predicted_meals": predicted_meals,
        "recommended_cooking": recommended_cooking,
        "ingredients": ingredients,
        "model": "XGBoost JSON",
    }