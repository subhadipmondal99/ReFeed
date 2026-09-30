import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  CloudSun,
  CookingPot,
  Leaf,
  LogOut,
  PackageCheck,
  RefreshCw,
  Sparkles,
  Utensils,
  Users,
  Wheat,
} from "lucide-react";

import { logoutUser } from "../firebase/auth";

export default function Dashboard() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <header className="w-full border-b border-slate-200 bg-white">

        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-4 lg:px-8">

          {/* BRAND */}

          <Link
            to="/dashboard"
            className="flex items-center gap-3 no-underline"
          >

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <Utensils size={22} />
            </div>

            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-slate-900">
                MealRescue
              </h1>

              <p className="text-xs font-medium text-slate-400">
                Canteen Intelligence Platform
              </p>
            </div>

          </Link>


          {/* RIGHT */}

          <div className="flex items-center gap-3">

            <div className="hidden text-right sm:block">
              <p className="text-sm font-bold text-slate-800">
                Canteen Manager
              </p>

              <p className="text-xs text-slate-400">
                Operations Dashboard
              </p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            >
              <LogOut size={17} />
              <span className="hidden sm:inline">Logout</span>
            </button>

          </div>

        </div>

      </header>


      {/* =====================================================
          MAIN
      ====================================================== */}

      <main className="w-full px-5 py-7 lg:px-8">

        <div className="mx-auto w-full max-w-7xl">


          {/* =================================================
              WELCOME
          ================================================== */}

          <section className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">

            <div>

              <div className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-emerald-600">
                <Sparkles size={14} />
                Canteen Operations
              </div>

              <h2 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                Good morning 👋
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Monitor today's food demand, preparation,
                surplus and food rescue operations from one place.
              </p>

            </div>


            {/* PRIMARY FORECAST BUTTON */}

            <Link
              to="/forecast"
              className="group flex w-full items-center justify-center gap-3 rounded-xl bg-emerald-600 px-5 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-emerald-600/20 transition hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-xl sm:w-auto"
            >

              <Sparkles size={18} />

              Run Demand Forecast

              <ArrowRight
                size={18}
                className="transition-transform group-hover:translate-x-1"
              />

            </Link>

          </section>


          {/* =================================================
              QUICK FORECAST BANNER
          ================================================== */}

          <section className="mt-7 overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-teal-50">

            <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">

              <div className="flex items-start gap-4">

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
                  <BarChart3 size={23} />
                </div>

                <div>

                  <div className="flex flex-wrap items-center gap-2">

                    <h3 className="text-base font-extrabold text-slate-900">
                      Need today's meal prediction?
                    </h3>

                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-emerald-700">
                      AI Powered
                    </span>

                  </div>

                  <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">
                    Use historical demand, academic day type and live
                    weather to estimate how many meals your canteen
                    should prepare.
                  </p>

                </div>

              </div>


              <Link
                to="/forecast"
                className="flex shrink-0 items-center justify-center gap-2 rounded-lg border border-emerald-300 bg-white px-4 py-3 text-xs font-extrabold text-emerald-700 shadow-sm transition hover:bg-emerald-600 hover:text-white"
              >

                Open Forecast

                <ArrowRight size={16} />

              </Link>

            </div>

          </section>


          {/* =================================================
              TODAY'S SUMMARY
          ================================================== */}

          <section className="mt-7">

            <div className="mb-3 flex items-center justify-between">

              <div>

                <h3 className="text-lg font-extrabold text-slate-900">
                  Today's Overview
                </h3>

                <p className="text-xs text-slate-400">
                  Current canteen operation status
                </p>

              </div>

              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                <CheckCircle2 size={15} />
                System Online
              </div>

            </div>


            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">


              {/* FORECAST */}

              <DashboardStat
                icon={BarChart3}
                title="Lunch Forecast"
                value="701"
                unit="meals"
                description="Predicted demand"
                iconClass="bg-blue-100 text-blue-600"
              />


              {/* PREPARED */}

              <DashboardStat
                icon={CookingPot}
                title="Prepared"
                value="715"
                unit="meals"
                description="Meals prepared"
                iconClass="bg-amber-100 text-amber-600"
              />


              {/* SURPLUS */}

              <DashboardStat
                icon={PackageCheck}
                title="Surplus"
                value="91"
                unit="meals"
                description="Rescue required"
                iconClass="bg-orange-100 text-orange-600"
              />


              {/* FOOD SAVED */}

              <DashboardStat
                icon={Leaf}
                title="Food Saved"
                value="41"
                unit="kg"
                description="Rescued food"
                iconClass="bg-emerald-100 text-emerald-600"
              />

            </div>

          </section>


          {/* =================================================
              QUICK ACTIONS
          ================================================== */}

          <section className="mt-8">

            <div className="mb-3">

              <h3 className="text-lg font-extrabold text-slate-900">
                Quick Actions
              </h3>

              <p className="text-xs text-slate-400">
                Access the main canteen operations
              </p>

            </div>


            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">


              {/* FORECAST ACTION */}

              <QuickAction
                to="/forecast"
                icon={BarChart3}
                title="Demand Forecast"
                description="Predict tomorrow's lunch or dinner demand."
                buttonText="Run Forecast"
                primary
              />


              {/* PREPARATION */}

              <QuickAction
                to="/preparation"
                icon={Wheat}
                title="Preparation Plan"
                description="Convert predicted meals into ingredient quantities."
                buttonText="View Preparation"
              />


              {/* RESCUE */}

              <QuickAction
                to="/food-rescue"
                icon={PackageCheck}
                title="Food Rescue"
                description="Track surplus food and NGO pickup operations."
                buttonText="Open Rescue"
              />

            </div>

          </section>


          {/* =================================================
              WORKFLOW
          ================================================== */}

          <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

              <div>

                <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-emerald-600">
                  <RefreshCw size={14} />
                  Food Rescue Workflow
                </div>

                <h3 className="mt-1 text-lg font-extrabold text-slate-900">
                  Predict → Prepare → Serve → Rescue → Measure
                </h3>

              </div>


              <Link
                to="/forecast"
                className="flex items-center gap-2 text-xs font-extrabold text-emerald-600 transition hover:text-emerald-700"
              >
                Start with Forecast
                <ArrowRight size={15} />
              </Link>

            </div>


            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-5">

              <WorkflowStep
                number="01"
                title="Forecast"
                description="Demand predicted"
                active
              />

              <WorkflowStep
                number="02"
                title="Prepare"
                description="Ingredients planned"
              />

              <WorkflowStep
                number="03"
                title="Serve"
                description="Meals served"
              />

              <WorkflowStep
                number="04"
                title="Rescue"
                description="Surplus dispatched"
              />

              <WorkflowStep
                number="05"
                title="Impact"
                description="Waste measured"
              />

            </div>

          </section>


          {/* =================================================
              WEATHER + SYSTEM
          ================================================== */}

          <section className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">


            {/* WEATHER */}

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
                  <CloudSun size={21} />
                </div>

                <div>

                  <h3 className="text-sm font-extrabold text-slate-900">
                    Weather Intelligence
                  </h3>

                  <p className="text-xs text-slate-400">
                    Used by the demand forecast model
                  </p>

                </div>

              </div>


              <div className="mt-5 flex items-center justify-between rounded-xl bg-slate-50 p-4">

                <div>

                  <p className="text-xs font-bold text-slate-400">
                    Today's Campus Weather
                  </p>

                  <p className="mt-1 text-2xl font-black text-slate-900">
                    32°C
                  </p>

                </div>

                <div className="text-right">

                  <p className="text-xs font-bold text-slate-700">
                    Light drizzle
                  </p>

                  <p className="mt-1 text-[10px] text-slate-400">
                    Open-Meteo
                  </p>

                </div>

              </div>

            </div>


            {/* SYSTEM STATUS */}

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                  <CheckCircle2 size={21} />
                </div>

                <div>

                  <h3 className="text-sm font-extrabold text-slate-900">
                    System Status
                  </h3>

                  <p className="text-xs text-slate-400">
                    Current application services
                  </p>

                </div>

              </div>


              <div className="mt-5 grid grid-cols-2 gap-2">

                <SystemStatus
                  title="Authentication"
                  status="Connected"
                />

                <SystemStatus
                  title="Forecast Engine"
                  status="Ready"
                />

                <SystemStatus
                  title="Weather API"
                  status="Connected"
                />

                <SystemStatus
                  title="Ingredient Calculator"
                  status="Ready"
                />

              </div>

            </div>

          </section>


          {/* =================================================
              BOTTOM FORECAST CTA
          ================================================== */}

          <section className="mt-8 overflow-hidden rounded-2xl bg-slate-900">

            <div className="flex flex-col items-start justify-between gap-5 p-6 sm:p-8 lg:flex-row lg:items-center">

              <div>

                <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                  <Sparkles size={14} />
                  Ready to plan?
                </div>

                <h3 className="mt-2 text-xl font-black text-white sm:text-2xl">
                  Generate your next canteen demand forecast.
                </h3>

                <p className="mt-2 max-w-xl text-xs leading-5 text-slate-400">
                  Use the AI forecasting engine to estimate demand
                  before preparing meals and reduce avoidable food waste.
                </p>

              </div>


              <Link
                to="/forecast"
                className="group flex shrink-0 items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3.5 text-sm font-extrabold text-white shadow-lg transition hover:bg-emerald-400"
              >

                <BarChart3 size={18} />

                Go to Forecast

                <ArrowRight
                  size={17}
                  className="transition-transform group-hover:translate-x-1"
                />

              </Link>

            </div>

          </section>


        </div>

      </main>

    </div>
  );
}


/* ============================================================
   DASHBOARD STAT
============================================================ */

function DashboardStat({
  icon: Icon,
  title,
  value,
  unit,
  description,
  iconClass,
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">

      <div className="flex items-start justify-between">

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}
        >
          <Icon size={20} />
        </div>

      </div>

      <p className="mt-4 text-xs font-bold text-slate-400">
        {title}
      </p>

      <div className="mt-1 flex items-baseline gap-1.5">

        <span className="text-2xl font-black tracking-tight text-slate-900">
          {value}
        </span>

        <span className="text-xs font-bold text-slate-400">
          {unit}
        </span>

      </div>

      <p className="mt-1 text-[10px] text-slate-400">
        {description}
      </p>

    </div>
  );
}


/* ============================================================
   QUICK ACTION
============================================================ */

function QuickAction({
  to,
  icon: Icon,
  title,
  description,
  buttonText,
  primary = false,
}) {
  return (
    <Link
      to={to}
      className={`group block rounded-2xl border p-5 no-underline transition hover:-translate-y-1 hover:shadow-lg ${
        primary
          ? "border-emerald-200 bg-emerald-50/70"
          : "border-slate-200 bg-white"
      }`}
    >

      <div className="flex items-start justify-between gap-4">

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${
            primary
              ? "bg-emerald-600 text-white"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          <Icon size={21} />
        </div>

        <ArrowRight
          size={18}
          className={`transition-transform group-hover:translate-x-1 ${
            primary
              ? "text-emerald-600"
              : "text-slate-300"
          }`}
        />

      </div>


      <h4 className="mt-5 text-base font-extrabold text-slate-900">
        {title}
      </h4>

      <p className="mt-1 min-h-[40px] text-xs leading-5 text-slate-500">
        {description}
      </p>


      <div
        className={`mt-4 inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-extrabold ${
          primary
            ? "bg-emerald-600 text-white"
            : "bg-slate-100 text-slate-700"
        }`}
      >
        {buttonText}
        <ArrowRight size={14} />
      </div>

    </Link>
  );
}


/* ============================================================
   WORKFLOW STEP
============================================================ */

function WorkflowStep({
  number,
  title,
  description,
  active = false,
}) {
  return (
    <div className="relative rounded-xl border border-slate-100 bg-slate-50 p-3">

      <div
        className={`flex h-8 w-8 items-center justify-center rounded-lg text-[10px] font-black ${
          active
            ? "bg-emerald-600 text-white"
            : "bg-white text-slate-400"
        }`}
      >
        {number}
      </div>

      <p className="mt-3 text-xs font-extrabold text-slate-800">
        {title}
      </p>

      <p className="mt-1 text-[9px] leading-4 text-slate-400">
        {description}
      </p>

    </div>
  );
}


/* ============================================================
   SYSTEM STATUS
============================================================ */

function SystemStatus({
  title,
  status,
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">

      <span className="text-[10px] font-bold text-slate-500">
        {title}
      </span>

      <span className="flex items-center gap-1.5 text-[9px] font-extrabold text-emerald-600">

        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

        {status}

      </span>

    </div>
  );
}