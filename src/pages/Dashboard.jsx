import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LogOut,
  Leaf,
  RefreshCw,
  User,
  Activity,
} from "lucide-react";

import {
  logoutUser,
  observeAuthState,
  db,
} from "../firebase/auth";

import { doc, getDoc } from "firebase/firestore";

import {
  calculateForecast,
} from "../services/forecastService";

import {
  calculateIngredients,
  roundIngredients,
} from "../services/ingredientService";

import {
  calculateRemainingMeals,
} from "../services/surplusService";

import {
  calculateImpact,
} from "../services/impactService";

import StatCard from "../components/dashboard/StatCard";
import WorkflowStepper from "../components/dashboard/WorkflowStepper";
import ForecastSummary from "../components/dashboard/ForecastSummary";
import SurplusAlert from "../components/dashboard/SurplusAlert";
import ImpactSummary from "../components/dashboard/ImpactSummary";

/*
|--------------------------------------------------------------------------
| Temporary historical meal data
|--------------------------------------------------------------------------
|
| This is only used until we connect the dashboard
| to real Firebase meal history / Python ML API.
|
*/

const DEMO_MEAL_HISTORY = [
  {
    date: "2026-09-29",
    mealType: "lunch",
    served: 690,
  },
  {
    date: "2026-09-28",
    mealType: "lunch",
    served: 710,
  },
  {
    date: "2026-09-27",
    mealType: "lunch",
    served: 720,
  },
  {
    date: "2026-09-26",
    mealType: "lunch",
    served: 680,
  },
  {
    date: "2026-09-25",
    mealType: "lunch",
    served: 705,
  },
];

export default function Dashboard() {
  const navigate = useNavigate();

  /*
  |--------------------------------------------------------------------------
  | User state
  |--------------------------------------------------------------------------
  */

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  /*
  |--------------------------------------------------------------------------
  | Forecast state
  |--------------------------------------------------------------------------
  */

  const [forecast, setForecast] = useState({
    date: new Date().toISOString().split("T")[0],
    mealType: "lunch",
    predictedMeals: 0,
    weather: "Normal",
    dayType: "regular",
  });

  const [ingredients, setIngredients] = useState({});

  const [forecastLoading, setForecastLoading] =
    useState(false);

  /*
  |--------------------------------------------------------------------------
  | Meal operation state
  |--------------------------------------------------------------------------
  */

  const [operations, setOperations] = useState({
    prepared: 0,
    served: 0,
  });

  /*
  |--------------------------------------------------------------------------
  | NGO state
  |--------------------------------------------------------------------------
  */

  const [ngos] = useState([]);

  /*
  |--------------------------------------------------------------------------
  | Firebase authentication
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const unsubscribe = observeAuthState(
      async (currentUser) => {
        if (!currentUser) {
          setUser(null);
          setProfile(null);
          setLoadingUser(false);

          navigate("/login");

          return;
        }

        setUser(currentUser);

        /*
        |--------------------------------------------------------------------------
        | Load user profile from Firestore
        |--------------------------------------------------------------------------
        */

        try {
          const profileRef = doc(
            db,
            "users",
            currentUser.uid
          );

          const profileSnapshot =
            await getDoc(profileRef);

          if (profileSnapshot.exists()) {
            setProfile(profileSnapshot.data());
          }
        } catch (error) {
          console.error(
            "Failed to load user profile:",
            error
          );
        }

        setLoadingUser(false);
      }
    );

    return () => unsubscribe();
  }, [navigate]);

  /*
  |--------------------------------------------------------------------------
  | Run initial forecast after authentication
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!loadingUser && user) {
      runForecast();
    }
  }, [loadingUser, user]);

  /*
  |--------------------------------------------------------------------------
  | Forecast function
  |--------------------------------------------------------------------------
  */

  const runForecast = async () => {
    setForecastLoading(true);

    try {
      /*
      |--------------------------------------------------------------------------
      | CURRENT:
      | Simple historical-data forecast.
      |
      | LATER:
      | This will call the Python ML API.
      |--------------------------------------------------------------------------
      */

      const predictedMeals = calculateForecast({
        historicalMeals: DEMO_MEAL_HISTORY,
        dayType: "regular",
        weather: "normal",
        mealType: "lunch",
      });

      /*
      |--------------------------------------------------------------------------
      | Calculate ingredients
      |--------------------------------------------------------------------------
      */

      const calculatedIngredients =
        roundIngredients(
          calculateIngredients(predictedMeals)
        );

      /*
      |--------------------------------------------------------------------------
      | Update forecast
      |--------------------------------------------------------------------------
      */

      setForecast({
        date: new Date()
          .toISOString()
          .split("T")[0],

        mealType: "lunch",

        predictedMeals,

        weather: "Normal",

        dayType: "regular",
      });

      setIngredients(
        calculatedIngredients
      );

      /*
      |--------------------------------------------------------------------------
      | Temporary meal operation simulation
      |--------------------------------------------------------------------------
      |
      | Later these values will come from the
      | canteen operator / Firebase.
      |
      */

      const preparedMeals =
        Math.round(predictedMeals * 1.02);

      const servedMeals =
        Math.round(predictedMeals * 0.89);

      setOperations({
        prepared: preparedMeals,
        served: servedMeals,
      });
    } catch (error) {
      console.error(
        "Forecast calculation failed:",
        error
      );
    } finally {
      setForecastLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Logout
  |--------------------------------------------------------------------------
  */

  const handleLogout = async () => {
    try {
      await logoutUser();

      navigate("/login");
    } catch (error) {
      console.error(
        "Logout error:",
        error
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Remaining meals
  |--------------------------------------------------------------------------
  */

  const remainingMeals = useMemo(() => {
    return calculateRemainingMeals({
      prepared: operations.prepared,
      served: operations.served,
    });
  }, [operations]);

  /*
  |--------------------------------------------------------------------------
  | Impact
  |--------------------------------------------------------------------------
  |
  | Currently we treat surplus as rescued for demonstration.
  |
  | LATER:
  | Only completed NGO donations should count here.
  |
  */

  const impact = useMemo(() => {
    const rescuedMeals =
      remainingMeals > 20
        ? remainingMeals
        : 0;

    return calculateImpact(rescuedMeals);
  }, [remainingMeals]);

  /*
  |--------------------------------------------------------------------------
  | Workflow step
  |--------------------------------------------------------------------------
  */

  const currentWorkflowStep = useMemo(() => {
    if (!forecast.predictedMeals) {
      return "forecast";
    }

    if (!operations.prepared) {
      return "prepare";
    }

    if (!operations.served) {
      return "serve";
    }

    if (remainingMeals > 20) {
      return "rescue";
    }

    return "impact";
  }, [
    forecast.predictedMeals,
    operations.prepared,
    operations.served,
    remainingMeals,
  ]);

  /*
  |--------------------------------------------------------------------------
  | User information
  |--------------------------------------------------------------------------
  */

  const displayName =
    profile?.name ||
    user?.displayName ||
    user?.email?.split("@")[0] ||
    "User";

  const userType =
    profile?.userType ||
    "canteen_manager";

  /*
  |--------------------------------------------------------------------------
  | Loading screen
  |--------------------------------------------------------------------------
  */

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600">
          <RefreshCw
            size={20}
            className="animate-spin"
          />

          <span>
            Loading dashboard...
          </span>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Dashboard
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ================================================================
          HEADER
      ================================================================ */}

      <header className="border-b border-gray-200 bg-white sticky top-0 z-30">

        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

          {/* Brand */}

          <div className="flex items-center gap-3">

            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">

              <Leaf size={22} />

            </div>

            <div>

              <h1 className="font-bold text-gray-900">
                MealRescue
              </h1>

              <p className="text-xs text-gray-500">
                Canteen Dashboard
              </p>

            </div>

          </div>

          {/* User */}

          <div className="flex items-center gap-4">

            <div className="hidden sm:block text-right">

              <p className="text-sm font-semibold text-gray-900">
                {displayName}
              </p>

              <p className="text-xs text-gray-500 capitalize">
                {userType.replace("_", " ")}
              </p>

            </div>

            <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center">

              <User
                size={17}
                className="text-emerald-700"
              />

            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
            >

              <LogOut size={18} />

              <span className="hidden sm:inline">
                Logout
              </span>

            </button>

          </div>

        </div>

      </header>

      {/* ================================================================
          MAIN
      ================================================================ */}

      <main className="max-w-7xl mx-auto px-6 py-10">

        {/* ==============================================================
            WELCOME
        ============================================================== */}

        <div className="mb-8">

          <p className="text-sm font-medium text-emerald-600">
            Canteen Operations
          </p>

          <h2 className="text-3xl font-bold text-gray-900 mt-1">
            Good morning, {displayName} 👋
          </h2>

          <p className="text-gray-500 mt-2">
            Monitor today's food demand,
            preparation, surplus and impact.
          </p>

        </div>

        {/* ==============================================================
            STAT CARDS
        ============================================================== */}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <StatCard
            title="Lunch Forecast"
            value={forecast.predictedMeals}
            subtitle="predicted meals"
            type="forecast"
          />

          <StatCard
            title="Prepared"
            value={operations.prepared}
            subtitle="meals prepared"
            type="meals"
          />

          <StatCard
            title="Surplus"
            value={remainingMeals}
            subtitle={
              remainingMeals > 20
                ? "rescue required"
                : "within threshold"
            }
            type="surplus"
          />

          <StatCard
            title="Food Saved"
            value={`${impact.foodSavedKg} kg`}
            subtitle="rescued food"
            type="impact"
          />

        </div>

        {/* ==============================================================
            WORKFLOW
        ============================================================== */}

        <div className="mt-6">

          <WorkflowStepper
            currentStep={currentWorkflowStep}
          />

        </div>

        {/* ==============================================================
            FORECAST
        ============================================================== */}

        <div className="mt-6">

          <ForecastSummary
            forecast={forecast}
            ingredients={ingredients}
            loading={forecastLoading}
            onRunForecast={runForecast}
          />

        </div>

        {/* ==============================================================
            SURPLUS + IMPACT
        ============================================================== */}

        <div className="mt-6 grid gap-6 lg:grid-cols-2">

          <SurplusAlert
            prepared={operations.prepared}
            served={operations.served}
            remaining={remainingMeals}
            ngos={ngos}
          />

          <ImpactSummary
            rescuedMeals={
              impact.rescuedMeals
            }
            foodSavedKg={
              impact.foodSavedKg
            }
            moneySaved={
              impact.moneySaved
            }
          />

        </div>

        {/* ==============================================================
            SYSTEM STATUS
        ============================================================== */}

        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

          <div className="flex items-center gap-3">

            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">

              <Activity
                size={20}
                className="text-emerald-600"
              />

            </div>

            <div>

              <h2 className="font-semibold text-gray-900">
                System Status
              </h2>

              <p className="text-sm text-gray-500">
                Core food management services
              </p>

            </div>

          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

            <StatusItem
              title="Authentication"
              status="Connected"
            />

            <StatusItem
              title="Forecast Engine"
              status="Ready"
            />

            <StatusItem
              title="Ingredient Calculator"
              status="Ready"
            />

            <StatusItem
              title="Surplus Detection"
              status={
                remainingMeals > 20
                  ? "Surplus detected"
                  : "Normal"
              }
              warning={remainingMeals > 20}
            />

          </div>

        </div>

      </main>

    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Small internal status component
|--------------------------------------------------------------------------
*/

function StatusItem({
  title,
  status,
  warning = false,
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">

      <div>

        <p className="text-sm font-medium text-gray-700">
          {title}
        </p>

        <p
          className={[
            "text-xs mt-1",
            warning
              ? "text-orange-600"
              : "text-emerald-600",
          ].join(" ")}
        >
          {status}
        </p>

      </div>

      <div
        className={[
          "w-2.5 h-2.5 rounded-full",
          warning
            ? "bg-orange-500"
            : "bg-emerald-500",
        ].join(" ")}
      />

    </div>
  );
}