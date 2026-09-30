import { Navigate, Route, Routes } from "react-router-dom";

// ======================================================
// PUBLIC PAGES
// ======================================================
import LandingPage from "./pages/LandingPage.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";

// ======================================================
// MAIN APPLICATION PAGES
// ======================================================
import Dashboard from "./pages/Dashboard.jsx";
import Forecast from "./pages/Forecast.jsx";
import Preparation from "./pages/Preparation.jsx";
import MealOperations from "./pages/MealOperations.jsx";
import FoodRescue from "./pages/FoodRescue.jsx";
import Donations from "./pages/Donations.jsx";
import Impact from "./pages/Impact.jsx";

// ======================================================
// APPLICATION ROUTER
// ======================================================
export default function App() {
  return (
    <Routes>
      {/* ==================================================
          LANDING PAGE
      ================================================== */}
      <Route
        path="/"
        element={<LandingPage />}
      />

      {/* ==================================================
          AUTHENTICATION
      ================================================== */}
      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/signup"
        element={<Signup />}
      />

      {/* ==================================================
          MAIN APPLICATION
      ================================================== */}

      {/* Dashboard */}
      <Route
        path="/dashboard"
        element={<Dashboard />}
      />

      {/* AI Demand Forecast */}
      <Route
        path="/forecast"
        element={<Forecast />}
      />

      {/* Ingredient Preparation Plan */}
      <Route
        path="/preparation"
        element={<Preparation />}
      />

      {/* Meal Operations */}
      <Route
        path="/meal-operations"
        element={<MealOperations />}
      />

      {/* Food Rescue */}
      <Route
        path="/food-rescue"
        element={<FoodRescue />}
      />

      {/* Donations / NGO Tracking */}
      <Route
        path="/donations"
        element={<Donations />}
      />

      {/* Impact Dashboard */}
      <Route
        path="/impact"
        element={<Impact />}
      />

      {/* ==================================================
          FALLBACK
      ================================================== */}
      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />
    </Routes>
  );
}