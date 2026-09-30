import { useEffect, useMemo, useState } from "react";

import {
  collection,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";

import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Leaf,
  Loader2,
  PackageCheck,
  RefreshCw,
  Recycle,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
  Utensils,
  Zap,
} from "lucide-react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useNavigate } from "react-router-dom";

import { db } from "../firebase/auth";

import "./Impact.css";


/* =========================================================
   CONSTANTS
   ========================================================= */

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const STATUS_COLORS = [
  "#10b981",
  "#38bdf8",
  "#f59e0b",
  "#94a3b8",
];


/* =========================================================
   HELPERS
   ========================================================= */

const formatNumber = (value) =>
  new Intl.NumberFormat("en-IN").format(
    Math.round(Number(value) || 0)
  );


const getMonthLabel = (dateValue) => {
  if (!dateValue) {
    return "Unknown";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return MONTH_NAMES[date.getMonth()];
};


const getMonthKey = (dateValue) => {
  if (!dateValue) {
    return null;
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}`;
};


/* =========================================================
   MAIN
   ========================================================= */

export default function Impact() {
  const navigate = useNavigate();


  /* =======================================================
     STATE
     ======================================================= */

  const [mealHistory, setMealHistory] =
    useState([]);

  const [surplusEvents, setSurplusEvents] =
    useState([]);

  const [donations, setDonations] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");


  /* =======================================================
     LOAD DATA
     ======================================================= */

  const loadImpactData = async ({
    showLoader = true,
  } = {}) => {
    if (showLoader) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    setError("");

    try {
      const [
        mealHistorySnapshot,
        surplusSnapshot,
        donationsSnapshot,
      ] = await Promise.all([
        getDocs(
          query(
            collection(
              db,
              "meal_history"
            ),
            orderBy(
              "date",
              "asc"
            )
          )
        ),

        getDocs(
          query(
            collection(
              db,
              "surplus_events"
            ),
            orderBy(
              "detectedAt",
              "asc"
            )
          )
        ),

        getDocs(
          query(
            collection(
              db,
              "donations"
            ),
            orderBy(
              "createdAt",
              "asc"
            )
          )
        ),
      ]);


      const meals =
        mealHistorySnapshot.docs.map(
          (item) => ({
            id: item.id,
            ...item.data(),
          })
        );


      const surplus =
        surplusSnapshot.docs.map(
          (item) => ({
            id: item.id,
            ...item.data(),
          })
        );


      const donationData =
        donationsSnapshot.docs.map(
          (item) => ({
            id: item.id,
            ...item.data(),
          })
        );


      setMealHistory(meals);
      setSurplusEvents(surplus);
      setDonations(donationData);
    } catch (err) {
      console.error(
        "Impact data loading error:",
        err
      );

      setError(
        err?.message ||
          "Unable to load impact data from Firebase."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };


  useEffect(() => {
    loadImpactData();
  }, []);


  /* =======================================================
     CORE METRICS
     ======================================================= */

  const metrics = useMemo(() => {
    const prepared =
      mealHistory.reduce(
        (sum, item) =>
          sum +
          Number(
            item.cooked_meals || 0
          ),
        0
      );


    const served =
      mealHistory.reduce(
        (sum, item) =>
          sum +
          Number(
            item.served_meals || 0
          ),
        0
      );


    const historySurplus =
      mealHistory.reduce(
        (sum, item) =>
          sum +
          Number(
            item.surplus_meals || 0
          ),
        0
      );


    const rescuedFromDonations =
      donations.reduce(
        (sum, item) =>
          sum +
          Number(
            item.surplus_meals || 0
          ),
        0
      );


    const rescuedFromEvents =
      surplusEvents.reduce(
        (sum, item) =>
          sum +
          Number(
            item.remaining || 0
          ),
        0
      );


    const rescued =
      rescuedFromDonations > 0
        ? rescuedFromDonations
        : rescuedFromEvents > 0
        ? rescuedFromEvents
        : historySurplus;


    const estimatedWaste =
      Math.max(
        0,
        prepared -
          served -
          rescued
      );


    const serviceRate =
      prepared > 0
        ? (served / prepared) *
          100
        : 0;


    const rescueRate =
      Math.max(
        0,
        prepared - served
      ) > 0
        ? (rescued /
            Math.max(
              0,
              prepared - served
            )) *
          100
        : 0;


    const rescueOfPrepared =
      prepared > 0
        ? (rescued / prepared) *
          100
        : 0;


    const mealsNotWasted =
      served + rescued;


    const foodSavedKg =
      rescued * 0.35;


    const co2AvoidedKg =
      rescued * 0.45;


    return {
      prepared,
      served,
      rescued,
      estimatedWaste,
      serviceRate,
      rescueRate,
      rescueOfPrepared,
      mealsNotWasted,
      foodSavedKg,
      co2AvoidedKg,
      donationCount:
        donations.length,
      surplusCount:
        surplusEvents.length,
    };
  }, [
    mealHistory,
    surplusEvents,
    donations,
  ]);


  /* =======================================================
     MONTHLY DATA
     ======================================================= */

  const monthlyData = useMemo(() => {
    const monthlyMap = {};


    mealHistory.forEach(
      (item) => {
        const key =
          getMonthKey(item.date);

        if (!key) {
          return;
        }


        if (!monthlyMap[key]) {
          monthlyMap[key] = {
            month:
              getMonthLabel(
                item.date
              ),
            prepared: 0,
            served: 0,
            rescued: 0,
            wasted: 0,
            sortKey: key,
          };
        }


        monthlyMap[key].prepared +=
          Number(
            item.cooked_meals || 0
          );


        monthlyMap[key].served +=
          Number(
            item.served_meals || 0
          );
      }
    );


    donations.forEach(
      (item) => {
        const key =
          getMonthKey(item.date);

        if (!key) {
          return;
        }


        if (!monthlyMap[key]) {
          monthlyMap[key] = {
            month:
              getMonthLabel(
                item.date
              ),
            prepared: 0,
            served: 0,
            rescued: 0,
            wasted: 0,
            sortKey: key,
          };
        }


        monthlyMap[key].rescued +=
          Number(
            item.surplus_meals || 0
          );
      }
    );


    return Object.values(
      monthlyMap
    )
      .sort((a, b) =>
        a.sortKey.localeCompare(
          b.sortKey
        )
      )
      .slice(-6)
      .map((item) => ({
        ...item,

        wasted: Math.max(
          0,
          item.prepared -
            item.served -
            item.rescued
        ),
      }));
  }, [
    mealHistory,
    donations,
  ]);


  /* =======================================================
     WEEKLY DATA
     ======================================================= */

  const weeklyData = useMemo(() => {
    const dayMap = {
      Mon: 0,
      Tue: 0,
      Wed: 0,
      Thu: 0,
      Fri: 0,
      Sat: 0,
      Sun: 0,
    };


    mealHistory.forEach(
      (item) => {
        if (!item.date) {
          return;
        }


        const date =
          new Date(item.date);


        if (
          Number.isNaN(
            date.getTime()
          )
        ) {
          return;
        }


        const day =
          date.toLocaleDateString(
            "en-US",
            {
              weekday: "short",
            }
          );


        if (
          dayMap[day] !==
          undefined
        ) {
          dayMap[day] +=
            Number(
              item.served_meals ||
                item.actual_headcount ||
                0
            );
        }
      }
    );


    return Object.entries(
      dayMap
    ).map(
      ([day, meals]) => ({
        day,
        meals,
      })
    );
  }, [mealHistory]);


  /* =======================================================
     NGO DATA
     ======================================================= */

  const ngoData = useMemo(() => {
    const ngoMap = {};


    donations.forEach(
      (item) => {
        const ngoName =
          item?.ngo?.name ||
          "Unknown NGO";


        if (!ngoMap[ngoName]) {
          ngoMap[ngoName] = {
            name: ngoName,
            meals: 0,
            donations: 0,
          };
        }


        ngoMap[ngoName].meals +=
          Number(
            item.surplus_meals ||
              0
          );


        ngoMap[ngoName].donations +=
          1;
      }
    );


    return Object.values(
      ngoMap
    ).sort(
      (a, b) =>
        b.meals - a.meals
    );
  }, [donations]);


  /* =======================================================
     DONATION STATUS
     ======================================================= */

  const donationStatusData =
    useMemo(() => {
      const statusMap = {
        Completed: 0,
        "Pickup In Progress": 0,
        "Picked Up": 0,
        "Pickup Pending": 0,
      };


      donations.forEach(
        (item) => {
          const status =
            item.status ||
            "Pickup Pending";


          if (
            statusMap[status] !==
            undefined
          ) {
            statusMap[status] += 1;
          }
        }
      );


      return Object.entries(
        statusMap
      )
        .filter(
          ([, value]) =>
            value > 0
        )
        .map(
          ([name, value]) => ({
            name,
            value,
          })
        );
    }, [donations]);


  /* =======================================================
     EXTRA INSIGHTS
     ======================================================= */

  const impactPercent =
    Math.min(
      100,
      Math.max(
        0,
        metrics.rescueOfPrepared
      )
    );


  const wasteRate =
    metrics.prepared > 0
      ? Math.min(
          100,
          Math.max(
            0,
            (metrics.estimatedWaste /
              metrics.prepared) *
              100
          )
        )
      : 0;


  const currentRescueStatus =
    metrics.donationCount > 0
      ? "Active rescue network"
      : metrics.surplusCount > 0
      ? "Surplus detected"
      : "Building baseline";


  /* =======================================================
     LOADING
     ======================================================= */

  if (loading) {
    return (
      <div className="impact-page">

        <div className="impact-loading">

          <div className="impact-loading-orb">

            <div className="impact-loading-ring" />

            <Loader2
              size={28}
              className="impact-spin"
            />

          </div>


          <span>
            REFEED · IMPACT ENGINE
          </span>

          <h2>
            Calculating your impact
          </h2>

          <p>
            Reading meal operations,
            rescue events and community
            donation records.
          </p>

          <div className="impact-loading-line">
            <span />
          </div>

        </div>

      </div>
    );
  }


  /* =======================================================
     PAGE
     ======================================================= */

  return (
    <div className="impact-page">


      {/* =================================================
          BACKGROUND
          ================================================= */}

      <div className="impact-background">

        <div className="impact-grid" />

        <div className="impact-glow impact-glow-a" />

        <div className="impact-glow impact-glow-b" />

        <div className="impact-glow impact-glow-c" />

        <span className="impact-particle ip-1" />
        <span className="impact-particle ip-2" />
        <span className="impact-particle ip-3" />
        <span className="impact-particle ip-4" />

      </div>


      {/* =================================================
          HEADER
          ================================================= */}

      <header className="impact-header">

        <div className="impact-header-inner">

          <button
            className="impact-back"
            onClick={() =>
              navigate(
                "/dashboard"
              )
            }
          >

            <ArrowLeft size={15} />

            <span>
              Dashboard
            </span>

          </button>


          <div className="impact-brand">

            <div className="impact-brand-icon">

              <BarChart3
                size={19}
              />

            </div>

            <div>

              <h1>
                Impact Dashboard
              </h1>

              <p>
                Measure food rescued,
                waste reduced and
                community impact.
              </p>

            </div>

          </div>


          <div className="impact-header-actions">

            <div className="impact-live">

              <span />

              IMPACT ENGINE LIVE

            </div>


            <button
              className="impact-refresh"
              onClick={() =>
                loadImpactData({
                  showLoader: false,
                })
              }
              disabled={refreshing}
            >

              <RefreshCw
                size={14}
                className={
                  refreshing
                    ? "impact-spin"
                    : ""
                }
              />

              <span>
                {refreshing
                  ? "Refreshing..."
                  : "Refresh"}
              </span>

            </button>

          </div>

        </div>

      </header>


      <main className="impact-container">


        {/* =================================================
            ERROR
            ================================================= */}

        {error && (
          <div className="impact-alert">

            <TrendingDown
              size={17}
            />

            <div>

              <strong>
                Unable to load some
                impact data
              </strong>

              <p>
                {error}
              </p>

            </div>

          </div>
        )}


        {/* =================================================
            HERO
            ================================================= */}

        <section className="impact-hero">

          <div className="impact-hero-content">

            <div className="impact-eyebrow">

              <span />

              REFEED · CUMULATIVE IMPACT

            </div>


            <h2>
              Turn every surplus
              <br />

              <em>
                into impact.
              </em>
            </h2>


            <p>
              ReFeed connects smarter meal
              planning with real-world food
              rescue. Every number below
              represents food prepared,
              served or redirected to
              someone who needs it.
            </p>


            <div className="impact-hero-actions">

              <button
                className="impact-primary-action"
                onClick={() =>
                  navigate(
                    "/food-rescue"
                  )
                }
              >

                <Recycle size={15} />

                Open Food Rescue

                <ArrowRight
                  size={14}
                />

              </button>


              <button
                className="impact-secondary-action"
                onClick={() =>
                  navigate(
                    "/forecast"
                  )
                }
              >

                <BarChart3
                  size={14}
                />

                View Forecast

              </button>

            </div>


            <div className="impact-hero-meta">

              <span>

                <CheckCircle2
                  size={12}
                />

                {currentRescueStatus}

              </span>

              <span>

                <Clock3
                  size={12}
                />

                Live Firebase data

              </span>

            </div>

          </div>


          {/* ===============================================
              HERO VISUAL
              =============================================== */}

          <div className="impact-hero-visual">

            <div className="impact-orbit orbit-one" />

            <div className="impact-orbit orbit-two" />

            <div className="impact-orbit orbit-three" />


            <div className="impact-core-shadow" />


            <div className="impact-core">

              <div className="impact-core-inner">

                <Recycle
                  size={27}
                />

                <span>
                  MEALS RESCUED
                </span>

                <strong>
                  {formatNumber(
                    metrics.rescued
                  )}
                </strong>

              </div>

            </div>


            <div className="impact-floating-card floating-top">

              <div className="impact-floating-icon">

                <Leaf size={15} />

              </div>

              <div>

                <span>
                  FOOD SAVED
                </span>

                <strong>
                  {metrics.foodSavedKg.toFixed(
                    1
                  )}{" "}
                  kg
                </strong>

              </div>

            </div>


            <div className="impact-floating-card floating-right">

              <div className="impact-floating-icon">

                <Users size={15} />

              </div>

              <div>

                <span>
                  COMMUNITY
                </span>

                <strong>
                  {formatNumber(
                    metrics.rescued
                  )} meals
                </strong>

              </div>

            </div>


            <div className="impact-floating-card floating-bottom">

              <div className="impact-floating-icon">

                <Zap size={15} />

              </div>

              <div>

                <span>
                  CO₂ AVOIDED
                </span>

                <strong>
                  {metrics.co2AvoidedKg.toFixed(
                    1
                  )} kg
                </strong>

              </div>

            </div>

          </div>

        </section>


        {/* =================================================
            KPI CARDS
            ================================================= */}

        <section className="impact-kpi-grid">

          <ImpactKpi
            icon={
              <Utensils
                size={20}
              />
            }
            label="Meals Prepared"
            value={metrics.prepared}
            detail="Total recorded cooking"
            variant="slate"
          />


          <ImpactKpi
            icon={
              <Users size={20} />
            }
            label="Meals Served"
            value={metrics.served}
            detail={`${metrics.serviceRate.toFixed(
              1
            )}% service utilization`}
            variant="blue"
          />


          <ImpactKpi
            icon={
              <PackageCheck
                size={20}
              />
            }
            label="Meals Rescued"
            value={metrics.rescued}
            detail="Redirected through rescue"
            variant="green"
            emphasis
          />


          <ImpactKpi
            icon={
              <Leaf size={20} />
            }
            label="Estimated Waste"
            value={metrics.estimatedWaste}
            detail="After recorded rescue"
            variant="amber"
          />

        </section>


        {/* =================================================
            IMPACT PERFORMANCE
            ================================================= */}

        <section className="impact-performance">

          <div className="performance-main">

            <div className="performance-icon">

              <Recycle size={22} />

            </div>


            <div>

              <div className="section-kicker">
                FOOD RESCUE PERFORMANCE
              </div>

              <div className="performance-title">

                <strong>
                  {impactPercent.toFixed(
                    1
                  )}%
                </strong>

                <span>
                  of prepared meals
                  were rescued
                </span>

              </div>

              <p>
                {formatNumber(
                  metrics.rescued
                )} rescued meals from{" "}
                {formatNumber(
                  metrics.prepared
                )} prepared meals.
              </p>

            </div>

          </div>


          <div className="performance-visual">

            <div className="performance-track">

              <div
                className="performance-fill"
                style={{
                  width: `${impactPercent}%`,
                }}
              >

                <span />

              </div>

            </div>


            <div className="performance-scale">

              <span>
                0%
              </span>

              <span>
                {impactPercent.toFixed(
                  1
                )}% rescued
              </span>

              <span>
                100%
              </span>

            </div>

          </div>


          <div className="performance-side">

            <div>

              <span>
                WASTE RATE
              </span>

              <strong>
                {wasteRate.toFixed(
                  1
                )}%
              </strong>

            </div>

            <div>

              <span>
                NOT WASTED
              </span>

              <strong>
                {formatNumber(
                  metrics.mealsNotWasted
                )}
              </strong>

            </div>

          </div>

        </section>


        {/* =================================================
            ANALYTICS HEADER
            ================================================= */}

        <div className="impact-section-heading">

          <div>

            <span>
              IMPACT ANALYTICS
            </span>

            <h2>
              Understand what changed.
            </h2>

          </div>

          <p>
            Operational data translated
            into measurable food rescue
            outcomes.
          </p>

        </div>


        {/* =================================================
            MONTHLY CHART
            ================================================= */}

        <section className="impact-chart-card impact-chart-wide">

          <ChartHeader
            eyebrow="MONTHLY OPERATIONS"
            title="Prepared vs served vs rescued"
            icon={
              <BarChart3
                size={18}
              />
            }
          />


          {monthlyData.length > 0 ? (
            <div className="impact-chart">

              <ResponsiveContainer
                width="100%"
                height={350}
              >

                <BarChart
                  data={monthlyData}
                  margin={{
                    top: 10,
                    right: 10,
                    left: -15,
                    bottom: 0,
                  }}
                  barGap={5}
                >

                  <CartesianGrid
                    strokeDasharray="4 5"
                    vertical={false}
                    stroke="#e8efeb"
                  />

                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: "#879890",
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: "#9aa8a2",
                      fontSize: 10,
                    }}
                  />

                  <Tooltip
                    cursor={{
                      fill:
                        "rgba(16,185,129,0.045)",
                    }}
                    contentStyle={{
                      border:
                        "1px solid #e1ebe6",
                      borderRadius:
                        "12px",
                      boxShadow:
                        "0 12px 30px rgba(20,65,49,0.08)",
                      fontSize:
                        "12px",
                    }}
                  />

                  <Bar
                    dataKey="prepared"
                    name="Prepared"
                    fill="#94a3b8"
                    radius={[
                      6,
                      6,
                      0,
                      0,
                    ]}
                    animationDuration={1000}
                  />

                  <Bar
                    dataKey="served"
                    name="Served"
                    fill="#38bdf8"
                    radius={[
                      6,
                      6,
                      0,
                      0,
                    ]}
                    animationDuration={1200}
                  />

                  <Bar
                    dataKey="rescued"
                    name="Rescued"
                    fill="#10b981"
                    radius={[
                      6,
                      6,
                      0,
                      0,
                    ]}
                    animationDuration={1400}
                  />

                </BarChart>

              </ResponsiveContainer>

            </div>
          ) : (
            <EmptyChart
              icon={
                <BarChart3
                  size={25}
                />
              }
              text="No monthly meal history available yet."
            />
          )}

        </section>


        {/* =================================================
            TWO COLUMN ANALYTICS
            ================================================= */}

        <section className="impact-two-column">


          {/* WEEKLY */}

          <div className="impact-chart-card">

            <ChartHeader
              eyebrow="WEEKLY OPERATIONS"
              title="Meals served by day"
              icon={
                <TrendingUp
                  size={18}
                />
              }
            />


            {mealHistory.length > 0 ? (
              <div className="impact-chart">

                <ResponsiveContainer
                  width="100%"
                  height={310}
                >

                  <LineChart
                    data={weeklyData}
                    margin={{
                      top: 15,
                      right: 10,
                      left: -20,
                      bottom: 0,
                    }}
                  >

                    <CartesianGrid
                      strokeDasharray="4 5"
                      vertical={false}
                      stroke="#e8efeb"
                    />

                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: "#879890",
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    />

                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: "#9aa8a2",
                        fontSize: 10,
                      }}
                    />

                    <Tooltip
                      cursor={{
                        stroke:
                          "#d6e8df",
                      }}
                      contentStyle={{
                        border:
                          "1px solid #e1ebe6",
                        borderRadius:
                          "12px",
                        boxShadow:
                          "0 12px 30px rgba(20,65,49,0.08)",
                      }}
                    />

                    <Line
                      type="monotone"
                      dataKey="meals"
                      name="Meals Served"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{
                        r: 4,
                        fill: "#10b981",
                        strokeWidth: 3,
                        stroke: "#ffffff",
                      }}
                      activeDot={{
                        r: 7,
                        fill: "#10b981",
                        stroke:
                          "#ffffff",
                        strokeWidth: 3,
                      }}
                      animationDuration={1400}
                    />

                  </LineChart>

                </ResponsiveContainer>

              </div>
            ) : (
              <EmptyChart
                icon={
                  <TrendingUp
                    size={25}
                  />
                }
                text="No meal operation records available yet."
              />
            )}

          </div>


          {/* NGO */}

          <div className="impact-chart-card">

            <ChartHeader
              eyebrow="NGO NETWORK"
              title="Meals rescued by partner"
              icon={
                <Users size={18} />
              }
            />


            {ngoData.length > 0 ? (
              <div className="impact-chart">

                <ResponsiveContainer
                  width="100%"
                  height={310}
                >

                  <BarChart
                    data={ngoData}
                    layout="vertical"
                    margin={{
                      top: 5,
                      right: 10,
                      left: 10,
                      bottom: 5,
                    }}
                  >

                    <CartesianGrid
                      strokeDasharray="4 5"
                      horizontal={false}
                      stroke="#e8efeb"
                    />

                    <XAxis
                      type="number"
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: "#9aa8a2",
                        fontSize: 10,
                      }}
                    />

                    <YAxis
                      dataKey="name"
                      type="category"
                      width={90}
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: "#62766c",
                        fontSize: 10,
                        fontWeight: 700,
                      }}
                    />

                    <Tooltip
                      contentStyle={{
                        border:
                          "1px solid #e1ebe6",
                        borderRadius:
                          "12px",
                        boxShadow:
                          "0 12px 30px rgba(20,65,49,0.08)",
                      }}
                    />

                    <Bar
                      dataKey="meals"
                      name="Meals Rescued"
                      fill="#10b981"
                      radius={[
                        0,
                        7,
                        7,
                        0,
                      ]}
                      animationDuration={1200}
                    />

                  </BarChart>

                </ResponsiveContainer>

              </div>
            ) : (
              <EmptyChart
                icon={
                  <Users size={25} />
                }
                text="No NGO donation records available yet."
              />
            )}

          </div>

        </section>


        {/* =================================================
            DONATION PIPELINE
            ================================================= */}

        <section className="impact-chart-card">

          <ChartHeader
            eyebrow="RESCUE PIPELINE"
            title="Donation workflow"
            icon={
              <CheckCircle2
                size={18}
              />
            }
          />


          <div className="donation-pipeline">

            {[
              {
                label:
                  "Pickup Pending",
                value:
                  donations.filter(
                    (item) =>
                      (item.status ||
                        "Pickup Pending") ===
                      "Pickup Pending"
                  ).length,
                icon:
                  <Clock3 size={17} />,
              },

              {
                label:
                  "In Progress",
                value:
                  donations.filter(
                    (item) =>
                      item.status ===
                      "Pickup In Progress"
                  ).length,
                icon:
                  <TrendingUp
                    size={17}
                  />,
              },

              {
                label:
                  "Picked Up",
                value:
                  donations.filter(
                    (item) =>
                      item.status ===
                      "Picked Up"
                  ).length,
                icon:
                  <PackageCheck
                    size={17}
                  />,
              },

              {
                label:
                  "Completed",
                value:
                  donations.filter(
                    (item) =>
                      item.status ===
                      "Completed"
                  ).length,
                icon:
                  <CheckCircle2
                    size={17}
                  />,
              },
            ].map(
              (stage, index) => (
                <div
                  className={`pipeline-stage stage-${index}`}
                  key={
                    stage.label
                  }
                >

                  <div className="pipeline-stage-icon">
                    {stage.icon}
                  </div>

                  <div>

                    <span>
                      {stage.label}
                    </span>

                    <strong>
                      {formatNumber(
                        stage.value
                      )}
                    </strong>

                  </div>

                  {index <
                    3 && (
                    <ChevronRight
                      size={16}
                      className="pipeline-arrow"
                    />
                  )}

                </div>
              )
            )}

          </div>

        </section>


        {/* =================================================
            ENVIRONMENTAL IMPACT
            ================================================= */}

        <section className="impact-section-heading compact">

          <div>

            <span>
              BEYOND MEALS
            </span>

            <h2>
              Environmental impact.
            </h2>

          </div>

          <p>
            Estimated indicators derived
            from rescued meal quantities.
          </p>

        </section>


        <section className="environment-grid">

          <EnvironmentCard
            icon={
              <Leaf size={22} />
            }
            value={`${metrics.foodSavedKg.toFixed(
              1
            )} kg`}
            label="Food redirected"
            description="Estimated food mass kept in the rescue cycle."
          />


          <EnvironmentCard
            icon={
              <Recycle size={22} />
            }
            value={formatNumber(
              metrics.mealsNotWasted
            )}
            label="Meals not wasted"
            description="Meals that were served or successfully rescued."
          />


          <EnvironmentCard
            icon={
              <Zap size={22} />
            }
            value={`${metrics.co2AvoidedKg.toFixed(
              1
            )} kg`}
            label="Estimated CO₂ avoided"
            description="Illustrative impact estimate from rescued meals."
          />

        </section>


        {/* =================================================
            SUMMARY
            ================================================= */}

        <section className="impact-summary-grid">

          <SummaryCard
            icon={
              <PackageCheck
                size={18}
              />
            }
            label="Surplus Events"
            value={
              metrics.surplusCount
            }
          />

          <SummaryCard
            icon={
              <Users size={18} />
            }
            label="Donations Created"
            value={
              metrics.donationCount
            }
          />

          <SummaryCard
            icon={
              <Recycle size={18} />
            }
            label="Rescue Rate"
            value={`${metrics.rescueRate.toFixed(
              1
            )}%`}
          />

          <SummaryCard
            icon={
              <Leaf size={18} />
            }
            label="Meals Not Wasted"
            value={
              metrics.mealsNotWasted
            }
          />

        </section>


        {/* =================================================
            EMPTY STATE
            ================================================= */}

        {mealHistory.length === 0 &&
          donations.length === 0 &&
          surplusEvents.length === 0 && (
            <section className="impact-empty">

              <div className="impact-empty-visual">

                <BarChart3
                  size={27}
                />

              </div>

              <span>
                IMPACT DATA WAITING
              </span>

              <h3>
                Your impact story
                starts here.
              </h3>

              <p>
                Run a forecast, record meal
                operations, and rescue surplus
                food. ReFeed will automatically
                turn those actions into measurable
                impact.
              </p>

              <button
                onClick={() =>
                  navigate(
                    "/forecast"
                  )
                }
              >

                Start with Forecast

                <ArrowRight
                  size={15}
                />

              </button>

            </section>
          )}


        {/* =================================================
            FOOTER ACTIONS
            ================================================= */}

        <div className="impact-actions">

          <button
            onClick={() =>
              navigate(
                "/food-rescue"
              )
            }
          >

            <Recycle size={15} />

            Food Rescue

          </button>


          <button
            onClick={() =>
              navigate(
                "/forecast"
              )
            }
          >

            <BarChart3
              size={15}
            />

            Demand Forecast

          </button>

        </div>


        <div className="impact-footnote">

          <Sparkles size={12} />

          Impact estimates are intended
          for project analytics and
          demonstration purposes.

        </div>

      </main>

    </div>
  );
}


/* =========================================================
   KPI COMPONENT
   ========================================================= */

function ImpactKpi({
  icon,
  label,
  value,
  detail,
  variant,
  emphasis = false,
}) {
  return (
    <article
      className={`impact-kpi-card ${
        emphasis
          ? "emphasis"
          : ""
      }`}
    >

      <div
        className={`impact-kpi-icon ${variant}`}
      >
        {icon}
      </div>


      <div className="impact-kpi-content">

        <span>
          {label}
        </span>

        <strong>
          {formatNumber(value)}
        </strong>

        <small>
          {detail}
        </small>

      </div>


      {emphasis && (
        <div className="kpi-live-mark">

          <span />

          RESCUE

        </div>
      )}

    </article>
  );
}


/* =========================================================
   CHART HEADER
   ========================================================= */

function ChartHeader({
  eyebrow,
  title,
  icon,
}) {
  return (
    <div className="impact-chart-heading">

      <div>

        <span>
          {eyebrow}
        </span>

        <h3>
          {title}
        </h3>

      </div>

      <div className="chart-heading-icon">

        {icon}

      </div>

    </div>
  );
}


/* =========================================================
   ENVIRONMENT CARD
   ========================================================= */

function EnvironmentCard({
  icon,
  value,
  label,
  description,
}) {
  return (
    <article className="environment-card">

      <div className="environment-icon">

        {icon}

      </div>

      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>

      <p>
        {description}
      </p>

    </article>
  );
}


/* =========================================================
   SUMMARY CARD
   ========================================================= */

function SummaryCard({
  icon,
  label,
  value,
}) {
  return (
    <article className="impact-summary-card">

      <div className="summary-icon">

        {icon}

      </div>

      <div>

        <span>
          {label}
        </span>

        <strong>
          {formatNumber(value)}
        </strong>

      </div>

    </article>
  );
}


/* =========================================================
   EMPTY CHART
   ========================================================= */

function EmptyChart({
  icon,
  text,
}) {
  return (
    <div className="impact-chart-empty">

      <div>
        {icon}
      </div>

      <p>
        {text}
      </p>

    </div>
  );
}