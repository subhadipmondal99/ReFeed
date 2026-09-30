import { useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";

import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Leaf,
  Loader2,
  PackageCheck,
  RefreshCw,
  Recycle,
  TrendingDown,
  Users,
  Utensils,
} from "lucide-react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
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

const formatNumber = (value) =>
  new Intl.NumberFormat("en-IN").format(
    Math.round(Number(value) || 0)
  );

const getMonthLabel = (dateValue) => {
  if (!dateValue) return "Unknown";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return MONTH_NAMES[date.getMonth()];
};

const getMonthKey = (dateValue) => {
  if (!dateValue) return null;

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}`;
};

const getTimestampDate = (value) => {
  if (!value) return null;

  if (typeof value?.toDate === "function") {
    return value.toDate();
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
};

export default function Impact() {
  const navigate = useNavigate();

  const [mealHistory, setMealHistory] = useState([]);
  const [surplusEvents, setSurplusEvents] = useState([]);
  const [donations, setDonations] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

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
            collection(db, "meal_history"),
            orderBy("date", "asc")
          )
        ),

        getDocs(
          query(
            collection(db, "surplus_events"),
            orderBy("detectedAt", "asc")
          )
        ),

        getDocs(
          query(
            collection(db, "donations"),
            orderBy("createdAt", "asc")
          )
        ),
      ]);

      const meals = mealHistorySnapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));

      const surplus = surplusSnapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));

      const donationData = donationsSnapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));

      setMealHistory(meals);
      setSurplusEvents(surplus);
      setDonations(donationData);
    } catch (err) {
      console.error("Impact data loading error:", err);

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

  const metrics = useMemo(() => {
    const prepared = mealHistory.reduce(
      (sum, item) =>
        sum + Number(item.cooked_meals || 0),
      0
    );

    const served = mealHistory.reduce(
      (sum, item) =>
        sum + Number(item.served_meals || 0),
      0
    );

    const historySurplus = mealHistory.reduce(
      (sum, item) =>
        sum + Number(item.surplus_meals || 0),
      0
    );

    const rescuedFromDonations = donations.reduce(
      (sum, item) =>
        sum + Number(item.surplus_meals || 0),
      0
    );

    const rescuedFromEvents = surplusEvents.reduce(
      (sum, item) =>
        sum + Number(item.remaining || 0),
      0
    );

    /*
     * Prefer actual donation quantities for rescued meals.
     * If no donation records exist, fall back to surplus events.
     */
    const rescued =
      rescuedFromDonations > 0
        ? rescuedFromDonations
        : rescuedFromEvents > 0
          ? rescuedFromEvents
          : historySurplus;

    const estimatedWaste = Math.max(
      0,
      prepared - served - rescued
    );

    const serviceRate =
      prepared > 0
        ? (served / prepared) * 100
        : 0;

    const rescueRate =
      Math.max(0, prepared - served) > 0
        ? (rescued / Math.max(0, prepared - served)) *
          100
        : 0;

    return {
      prepared,
      served,
      rescued,
      estimatedWaste,
      serviceRate,
      rescueRate,
      donationCount: donations.length,
      surplusCount: surplusEvents.length,
    };
  }, [
    mealHistory,
    surplusEvents,
    donations,
  ]);

  const monthlyData = useMemo(() => {
    const monthlyMap = {};

    mealHistory.forEach((item) => {
      const key = getMonthKey(item.date);

      if (!key) return;

      if (!monthlyMap[key]) {
        monthlyMap[key] = {
          month: getMonthLabel(item.date),
          prepared: 0,
          served: 0,
          rescued: 0,
          wasted: 0,
          sortKey: key,
        };
      }

      monthlyMap[key].prepared += Number(
        item.cooked_meals || 0
      );

      monthlyMap[key].served += Number(
        item.served_meals || 0
      );

      monthlyMap[key].wasted += Number(
        item.surplus_meals || 0
      );
    });

    donations.forEach((item) => {
      const key = getMonthKey(item.date);

      if (!key) return;

      if (!monthlyMap[key]) {
        monthlyMap[key] = {
          month: getMonthLabel(item.date),
          prepared: 0,
          served: 0,
          rescued: 0,
          wasted: 0,
          sortKey: key,
        };
      }

      monthlyMap[key].rescued += Number(
        item.surplus_meals || 0
      );
    });

    const result = Object.values(monthlyMap)
      .sort((a, b) =>
        a.sortKey.localeCompare(b.sortKey)
      )
      .slice(-6);

    return result.map((item) => ({
      month: item.month,
      prepared: item.prepared,
      served: item.served,
      rescued: item.rescued,
      wasted: Math.max(
        0,
        item.prepared -
          item.served -
          item.rescued
      ),
    }));
  }, [mealHistory, donations]);

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

    mealHistory.forEach((item) => {
      if (!item.date) return;

      const date = new Date(item.date);

      if (Number.isNaN(date.getTime())) {
        return;
      }

      const day = date.toLocaleDateString(
        "en-US",
        {
          weekday: "short",
        }
      );

      if (dayMap[day] !== undefined) {
        dayMap[day] += Number(
          item.served_meals ||
            item.actual_headcount ||
            0
        );
      }
    });

    return Object.entries(dayMap).map(
      ([day, meals]) => ({
        day,
        meals,
      })
    );
  }, [mealHistory]);

  const ngoData = useMemo(() => {
    const ngoMap = {};

    donations.forEach((item) => {
      const ngoName =
        item?.ngo?.name || "Unknown NGO";

      if (!ngoMap[ngoName]) {
        ngoMap[ngoName] = {
          name: ngoName,
          meals: 0,
          donations: 0,
        };
      }

      ngoMap[ngoName].meals += Number(
        item.surplus_meals || 0
      );

      ngoMap[ngoName].donations += 1;
    });

    return Object.values(ngoMap).sort(
      (a, b) => b.meals - a.meals
    );
  }, [donations]);

  const donationStatusData = useMemo(() => {
    const statusMap = {
      Completed: 0,
      "Pickup In Progress": 0,
      "Picked Up": 0,
      "Pickup Pending": 0,
    };

    donations.forEach((item) => {
      const status =
        item.status || "Pickup Pending";

      if (statusMap[status] !== undefined) {
        statusMap[status] += 1;
      }
    });

    return Object.entries(statusMap)
      .filter(([, value]) => value > 0)
      .map(([name, value]) => ({
        name,
        value,
      }));
  }, [donations]);

  const impactPercent =
    metrics.prepared > 0
      ? Math.min(
          100,
          Math.max(
            0,
            (metrics.rescued /
              metrics.prepared) *
              100
          )
        )
      : 0;

  if (loading) {
    return (
      <div className="impact-page">
        <div className="impact-loading">
          <div className="impact-loading-icon">
            <Loader2
              size={25}
              className="spin"
            />
          </div>

          <h2>
            Loading impact data
          </h2>

          <p>
            Reading meal operations and
            rescue records from Firebase.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="impact-page">
      {/* Header */}
      <header className="impact-header">
        <div className="impact-header-inner">
          <button
            className="impact-back"
            onClick={() =>
              navigate("/dashboard")
            }
          >
            <ArrowLeft size={16} />
            Dashboard
          </button>

          <div className="impact-title">
            <div className="impact-title-icon">
              <BarChart3 size={21} />
            </div>

            <div>
              <h1>
                Impact Dashboard
              </h1>

              <p>
                Measure food rescued,
                waste reduced, and community
                impact.
              </p>
            </div>
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
              size={15}
              className={
                refreshing ? "spin" : ""
              }
            />

            {refreshing
              ? "Refreshing..."
              : "Refresh"}
          </button>
        </div>
      </header>

      <main className="impact-container">
        {error && (
          <div className="impact-alert">
            <TrendingDown size={18} />

            <div>
              <strong>
                Unable to load some impact data
              </strong>

              <p>
                {error}
              </p>
            </div>
          </div>
        )}

        {/* Hero */}
        <section className="impact-hero">
          <div>
            <span>
              REFEED • CUMULATIVE IMPACT
            </span>

            <h2>
              Turning surplus into
              measurable impact.
            </h2>

            <p>
              Every rescued meal represents
              food that avoided unnecessary
              waste and reached someone who
              could use it.
            </p>
          </div>

          <div className="impact-hero-stat">
            <div>
              <Recycle size={21} />
            </div>

            <strong>
              {formatNumber(
                metrics.rescued
              )}
            </strong>

            <span>
              meals rescued
            </span>
          </div>
        </section>

        {/* KPI cards */}
        <section className="impact-kpi-grid">
          <div className="impact-kpi-card">
            <div className="impact-kpi-icon prepared">
              <Utensils size={20} />
            </div>

            <div>
              <span>
                Meals Prepared
              </span>

              <strong>
                {formatNumber(
                  metrics.prepared
                )}
              </strong>

              <small>
                Total recorded cooking
              </small>
            </div>
          </div>

          <div className="impact-kpi-card">
            <div className="impact-kpi-icon served">
              <Users size={20} />
            </div>

            <div>
              <span>
                Meals Served
              </span>

              <strong>
                {formatNumber(
                  metrics.served
                )}
              </strong>

              <small>
                {metrics.serviceRate.toFixed(
                  1
                )}
                % service utilization
              </small>
            </div>
          </div>

          <div className="impact-kpi-card">
            <div className="impact-kpi-icon rescued">
              <PackageCheck size={20} />
            </div>

            <div>
              <span>
                Meals Rescued
              </span>

              <strong>
                {formatNumber(
                  metrics.rescued
                )}
              </strong>

              <small>
                Through food rescue
              </small>
            </div>
          </div>

          <div className="impact-kpi-card">
            <div className="impact-kpi-icon waste">
              <Leaf size={20} />
            </div>

            <div>
              <span>
                Estimated Waste
              </span>

              <strong>
                {formatNumber(
                  metrics.estimatedWaste
                )}
              </strong>

              <small>
                After recorded rescue
              </small>
            </div>
          </div>
        </section>

        {/* Rescue impact */}
        <section className="impact-rescue-card">
          <div className="impact-rescue-content">
            <div className="impact-rescue-icon">
              <Recycle size={23} />
            </div>

            <div>
              <span>
                FOOD RESCUE PERFORMANCE
              </span>

              <h3>
                {impactPercent.toFixed(1)}%
                <small>
                  of prepared meals
                  were rescued
                </small>
              </h3>

              <p>
                Based on recorded meal
                operations and donation
                quantities.
              </p>
            </div>
          </div>

          <div className="impact-progress">
            <div
              className="impact-progress-fill"
              style={{
                width: `${impactPercent}%`,
              }}
            />
          </div>

          <div className="impact-progress-meta">
            <span>
              {formatNumber(
                metrics.rescued
              )}{" "}
              rescued
            </span>

            <span>
              {formatNumber(
                metrics.prepared
              )}{" "}
              prepared
            </span>
          </div>
        </section>

        {/* Charts */}
        <section className="impact-chart-grid">
          {/* Monthly */}
          <div className="impact-chart-card impact-chart-wide">
            <div className="impact-chart-heading">
              <div>
                <span>
                  MONTHLY OPERATIONS
                </span>

                <h3>
                  Prepared vs served vs
                  rescued
                </h3>
              </div>

              <BarChart3
                size={19}
              />
            </div>

            {monthlyData.length > 0 ? (
              <div className="impact-chart">
                <ResponsiveContainer
                  width="100%"
                  height={330}
                >
                  <BarChart
                    data={monthlyData}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                    />

                    <XAxis
                      dataKey="month"
                      tick={{
                        fontSize: 11,
                      }}
                    />

                    <YAxis
                      tick={{
                        fontSize: 11,
                      }}
                    />

                    <Tooltip />

                    <Legend />

                    <Bar
                      dataKey="prepared"
                      name="Prepared"
                      fill="#64748b"
                      radius={[
                        5,
                        5,
                        0,
                        0,
                      ]}
                    />

                    <Bar
                      dataKey="served"
                      name="Served"
                      fill="#059669"
                      radius={[
                        5,
                        5,
                        0,
                        0,
                      ]}
                    />

                    <Bar
                      dataKey="rescued"
                      name="Rescued"
                      fill="#10b981"
                      radius={[
                        5,
                        5,
                        0,
                        0,
                      ]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyChart
                text="No monthly meal history available yet."
              />
            )}
          </div>

          {/* Weekly */}
          <div className="impact-chart-card">
            <div className="impact-chart-heading">
              <div>
                <span>
                  WEEKLY DEMAND
                </span>

                <h3>
                  Meals served by day
                </h3>
              </div>

              <TrendingDown
                size={19}
              />
            </div>

            {mealHistory.length > 0 ? (
              <div className="impact-chart">
                <ResponsiveContainer
                  width="100%"
                  height={330}
                >
                  <LineChart
                    data={weeklyData}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                    />

                    <XAxis
                      dataKey="day"
                      tick={{
                        fontSize: 11,
                      }}
                    />

                    <YAxis
                      tick={{
                        fontSize: 11,
                      }}
                    />

                    <Tooltip />

                    <Line
                      type="monotone"
                      dataKey="meals"
                      name="Meals Served"
                      stroke="#059669"
                      strokeWidth={3}
                      dot={{
                        r: 4,
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyChart
                text="No meal operation records available yet."
              />
            )}
          </div>

          {/* NGO */}
          <div className="impact-chart-card">
            <div className="impact-chart-heading">
              <div>
                <span>
                  NGO DISPATCH
                </span>

                <h3>
                  Meals rescued by NGO
                </h3>
              </div>

              <Users size={19} />
            </div>

            {ngoData.length > 0 ? (
              <div className="impact-chart">
                <ResponsiveContainer
                  width="100%"
                  height={330}
                >
                  <BarChart
                    data={ngoData}
                    layout="vertical"
                    margin={{
                      left: 10,
                      right: 15,
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={false}
                    />

                    <XAxis
                      type="number"
                      tick={{
                        fontSize: 10,
                      }}
                    />

                    <YAxis
                      dataKey="name"
                      type="category"
                      width={100}
                      tick={{
                        fontSize: 10,
                      }}
                    />

                    <Tooltip />

                    <Bar
                      dataKey="meals"
                      name="Meals Rescued"
                      fill="#059669"
                      radius={[
                        0,
                        5,
                        5,
                        0,
                      ]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyChart
                text="No NGO donation records available yet."
              />
            )}
          </div>

          {/* Donation status */}
          <div className="impact-chart-card">
            <div className="impact-chart-heading">
              <div>
                <span>
                  DONATION STATUS
                </span>

                <h3>
                  Rescue workflow
                </h3>
              </div>

              <CheckCircle2
                size={19}
              />
            </div>

            {donationStatusData.length > 0 ? (
              <div className="impact-pie-wrapper">
                <ResponsiveContainer
                  width="100%"
                  height={260}
                >
                  <PieChart>
                    <Pie
                      data={
                        donationStatusData
                      }
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={3}
                    >
                      {donationStatusData.map(
                        (entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              [
                                "#059669",
                                "#10b981",
                                "#f59e0b",
                                "#94a3b8",
                              ][
                                index %
                                  4
                              ]
                            }
                          />
                        )
                      )}
                    </Pie>

                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>

                <div className="impact-pie-total">
                  <strong>
                    {formatNumber(
                      donations.length
                    )}
                  </strong>

                  <span>
                    donations
                  </span>
                </div>
              </div>
            ) : (
              <EmptyChart
                text="No donation workflow records available yet."
              />
            )}
          </div>
        </section>

        {/* Operational summary */}
        <section className="impact-summary-grid">
          <div className="impact-summary-card">
            <PackageCheck size={20} />

            <div>
              <span>
                Surplus Events
              </span>

              <strong>
                {formatNumber(
                  metrics.surplusCount
                )}
              </strong>
            </div>
          </div>

          <div className="impact-summary-card">
            <Users size={20} />

            <div>
              <span>
                Donations Created
              </span>

              <strong>
                {formatNumber(
                  metrics.donationCount
                )}
              </strong>
            </div>
          </div>

          <div className="impact-summary-card">
            <Recycle size={20} />

            <div>
              <span>
                Rescue Rate
              </span>

              <strong>
                {metrics.rescueRate.toFixed(
                  1
                )}
                %
              </strong>
            </div>
          </div>

          <div className="impact-summary-card">
            <Leaf size={20} />

            <div>
              <span>
                Meals Not Wasted
              </span>

              <strong>
                {formatNumber(
                  metrics.served +
                    metrics.rescued
                )}
              </strong>
            </div>
          </div>
        </section>

        {/* Empty-state guidance */}
        {mealHistory.length === 0 &&
          donations.length === 0 &&
          surplusEvents.length === 0 && (
            <section className="impact-empty">
              <div className="impact-empty-icon">
                <BarChart3 size={24} />
              </div>

              <h3>
                Your impact data will appear
                here
              </h3>

              <p>
                Run a forecast, record meal
                operations, and send surplus
                food to an NGO. The dashboard
                will automatically calculate
                your cumulative impact.
              </p>

              <button
                onClick={() =>
                  navigate("/forecast")
                }
              >
                Start with Forecast
              </button>
            </section>
          )}

        {/* Footer actions */}
        <div className="impact-actions">
          <button
            onClick={() =>
              navigate("/food-rescue")
            }
          >
            <Recycle size={16} />
            Food Rescue
          </button>

          <button
            onClick={() =>
              navigate("/forecast")
            }
          >
            <BarChart3 size={16} />
            Demand Forecast
          </button>
        </div>
      </main>
    </div>
  );
}

function EmptyChart({ text }) {
  return (
    <div className="impact-chart-empty">
      <BarChart3 size={22} />

      <p>{text}</p>
    </div>
  );
}