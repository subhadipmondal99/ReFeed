import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  ArrowLeft,
  ArrowRight,
  ChefHat,
  Utensils,
  Users,
  AlertTriangle,
  CheckCircle2,
  Save,
  Database,
  CalendarDays,
  UtensilsCrossed,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";

import { addMealHistory } from "../services/mealHistoryService";

import "./MealOperations.css";

const SURPLUS_THRESHOLD = 20;

export default function MealOperations() {
  const navigate = useNavigate();

  const [mealType, setMealType] = useState("Lunch");

  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [predictedMeals] = useState(596);
  const [cookedMeals, setCookedMeals] = useState(626);
  const [servedMeals, setServedMeals] = useState(580);

  const [dayType, setDayType] = useState("regular");
  const [campusPopulation, setCampusPopulation] = useState(1000);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const surplusMeals = Math.max(
    0,
    Number(cookedMeals || 0) - Number(servedMeals || 0)
  );

  const serviceRate =
    Number(cookedMeals) > 0
      ? Math.round(
          (Number(servedMeals) / Number(cookedMeals)) * 100
        )
      : 0;

  const surplusDetected = surplusMeals > SURPLUS_THRESHOLD;

  const preparationAccuracy =
    Number(predictedMeals) > 0
      ? Math.round(
          (Number(servedMeals) / Number(predictedMeals)) * 100
        )
      : 0;

  const handleSaveOperations = async () => {
    setError("");
    setSaved(false);

    if (!date) {
      setError("Please select an operation date.");
      return;
    }

    if (Number(cookedMeals) < 0 || Number(servedMeals) < 0) {
      setError("Meal counts cannot be negative.");
      return;
    }

    if (Number(servedMeals) > Number(cookedMeals)) {
      setError("Served meals cannot be greater than cooked meals.");
      return;
    }

    try {
      setSaving(true);

      await addMealHistory({
        date,
        mealType,
        actualHeadcount: Number(servedMeals),
        predictedMeals: Number(predictedMeals),
        cookedMeals: Number(cookedMeals),
        servedMeals: Number(servedMeals),
        surplusMeals: Number(surplusMeals),
        dayType,
        campusPopulation: Number(campusPopulation),
      });

      setSaved(true);
    } catch (saveError) {
      console.error("Meal operation save error:", saveError);
      setError(
        saveError?.message ||
          "Unable to save meal operations. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const goToFoodRescue = () => {
    navigate("/food-rescue", {
      state: {
        date,
        mealType,
        predictedMeals: Number(predictedMeals),
        cookedMeals: Number(cookedMeals),
        servedMeals: Number(servedMeals),
        surplusMeals,
        dayType,
        campusPopulation: Number(campusPopulation),
      },
    });
  };

  return (
    <div className="meal-operations-page">
      {/* HEADER */}
      <header className="meal-operations-header">
        <div className="meal-operations-container meal-header-inner">
          <div className="meal-header-left">
            <button
              className="meal-back-button"
              onClick={() => navigate("/preparation")}
            >
              <ArrowLeft size={17} />
              Back to Preparation
            </button>

            <div className="meal-title-row">
              <div className="meal-title-icon">
                <UtensilsCrossed size={24} />
              </div>

              <div>
                <h1>Meal Operations</h1>
                <p>
                  Track cooking, serving, consumption and surplus meals.
                </p>
              </div>
            </div>
          </div>

          <div className="service-rate-widget">
            <div className="service-rate-icon">
              <TrendingUp size={20} />
            </div>

            <div>
              <span>Service Rate</span>
              <strong>{serviceRate}%</strong>
            </div>
          </div>
        </div>
      </header>

      <main className="meal-operations-container meal-main">
        {/* INTRO */}
        <section className="operations-intro">
          <div>
            <span className="section-eyebrow">
              ReFeed · Meal Management
            </span>

            <h2>Record Today&apos;s Meal Operations</h2>

            <p>
              Compare predicted demand with meals prepared and served to
              identify food surplus before it becomes waste.
            </p>
          </div>

          <div className="intro-status">
            <ShieldCheck size={18} />
            <span>Live operation tracking</span>
          </div>
        </section>

        {/* ALERTS */}
        {saved && (
          <div className="operation-alert success-alert">
            <div className="alert-icon">
              <CheckCircle2 size={20} />
            </div>

            <div>
              <strong>Operations saved successfully</strong>
              <p>
                Today&apos;s meal data has been stored in Firebase.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="operation-alert error-alert">
            <div className="alert-icon">
              <AlertTriangle size={20} />
            </div>

            <div>
              <strong>Unable to save operations</strong>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* MEAL DETAILS */}
        <section className="operation-panel">
          <div className="panel-heading">
            <div className="panel-heading-icon">
              <CalendarDays size={20} />
            </div>

            <div>
              <h3>Meal Details</h3>
              <p>Configure the operation you are recording.</p>
            </div>
          </div>

          <div className="meal-details-grid">
            <Field
              label="Operation Date"
              icon={<CalendarDays size={17} />}
            >
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </Field>

            <Field
              label="Meal Type"
              icon={<Utensils size={17} />}
            >
              <select
                value={mealType}
                onChange={(event) => setMealType(event.target.value)}
              >
                <option value="Lunch">Lunch</option>
                <option value="Dinner">Dinner</option>
              </select>
            </Field>

            <Field
              label="Day Type"
              icon={<CalendarDays size={17} />}
            >
              <select
                value={dayType}
                onChange={(event) => setDayType(event.target.value)}
              >
                <option value="regular">Regular Day</option>
                <option value="exam">Exam Day</option>
                <option value="holiday">Holiday</option>
              </select>
            </Field>

            <Field
              label="Campus Population"
              icon={<Users size={17} />}
            >
              <input
                type="number"
                min="0"
                value={campusPopulation}
                onChange={(event) =>
                  setCampusPopulation(event.target.value)
                }
              />
            </Field>
          </div>
        </section>

        {/* OPERATION CARDS */}
        <section className="operation-cards-grid">
          <OperationCard
            icon={<Users size={22} />}
            label="Predicted"
            value={predictedMeals}
            unit="meals"
            description="AI demand forecast"
            variant="prediction"
          />

          <OperationCard
            icon={<ChefHat size={22} />}
            label="Cooked"
            value={cookedMeals}
            unit="meals"
            description="Meals prepared"
            input
            inputValue={cookedMeals}
            onChange={setCookedMeals}
            variant="cooked"
          />

          <OperationCard
            icon={<Utensils size={22} />}
            label="Served"
            value={servedMeals}
            unit="meals"
            description="Meals served to students"
            input
            inputValue={servedMeals}
            onChange={setServedMeals}
            variant="served"
          />

          <OperationCard
            icon={<AlertTriangle size={22} />}
            label="Remaining"
            value={surplusMeals}
            unit="meals"
            description="Potential surplus"
            highlight={surplusDetected}
            variant={surplusDetected ? "surplus" : "safe"}
          />
        </section>

        {/* METRICS */}
        <section className="metrics-grid">
          <MetricCard
            label="Service Rate"
            value={`${serviceRate}%`}
            description="Cooked meals successfully served"
            progress={serviceRate}
          />

          <MetricCard
            label="Forecast Coverage"
            value={`${preparationAccuracy}%`}
            description="Served meals compared with prediction"
            progress={Math.min(preparationAccuracy, 100)}
          />

          <MetricCard
            label="Potential Rescue"
            value={`${surplusMeals} meals`}
            description={
              surplusDetected
                ? "Above rescue threshold"
                : "Within normal threshold"
            }
            warning={surplusDetected}
          />
        </section>

        {/* SURPLUS STATUS */}
        <section className="surplus-section">
          {surplusDetected ? (
            <div className="surplus-card surplus-warning">
              <div className="surplus-content">
                <div className="surplus-icon">
                  <AlertTriangle size={26} />
                </div>

                <div>
                  <span className="status-badge warning-badge">
                    Action Required
                  </span>

                  <h3>Surplus Food Detected</h3>

                  <p>
                    <strong>{surplusMeals} meals</strong> remain after
                    service. This is above the {SURPLUS_THRESHOLD}-meal
                    rescue threshold.
                  </p>
                </div>
              </div>

              <button
                className="primary-warning-button"
                onClick={goToFoodRescue}
              >
                Start Food Rescue
                <ArrowRight size={18} />
              </button>
            </div>
          ) : (
            <div className="surplus-card surplus-safe">
              <div className="surplus-content">
                <div className="surplus-icon">
                  <CheckCircle2 size={26} />
                </div>

                <div>
                  <span className="status-badge safe-badge">
                    Normal
                  </span>

                  <h3>No Significant Surplus</h3>

                  <p>
                    Only <strong>{surplusMeals} meals</strong> remain.
                    The current surplus is within the normal threshold.
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* SUMMARY */}
        <section className="operation-panel">
          <div className="panel-heading">
            <div className="panel-heading-icon">
              <Database size={20} />
            </div>

            <div>
              <h3>Operation Summary</h3>
              <p>Review the recorded meal activity.</p>
            </div>
          </div>

          <div className="summary-grid">
            <SummaryItem label="Meal Type" value={mealType} />
            <SummaryItem label="Operation Date" value={date} />
            <SummaryItem
              label="Meals Predicted"
              value={`${predictedMeals} meals`}
            />
            <SummaryItem
              label="Meals Cooked"
              value={`${cookedMeals} meals`}
            />
            <SummaryItem
              label="Meals Served"
              value={`${servedMeals} meals`}
            />
            <SummaryItem
              label="Meals Remaining"
              value={`${surplusMeals} meals`}
              warning={surplusDetected}
            />
            <SummaryItem
              label="Service Rate"
              value={`${serviceRate}%`}
            />
            <SummaryItem
              label="Rescue Threshold"
              value={`${SURPLUS_THRESHOLD} meals`}
            />
          </div>
        </section>

        {/* SAVE */}
        <section className="save-panel">
          <div className="save-panel-icon">
            <Database size={24} />
          </div>

          <div className="save-panel-content">
            <span className="section-eyebrow">Firebase Database</span>
            <h3>Save Meal Operations</h3>
            <p>
              Store today&apos;s actual demand and surplus data for future
              forecasting and impact analysis.
            </p>
          </div>

          <button
            className="save-button"
            onClick={handleSaveOperations}
            disabled={saving}
          >
            {saving ? (
              <>
                <span className="button-spinner" />
                Saving...
              </>
            ) : (
              <>
                <Save size={18} />
                Save Operations
              </>
            )}
          </button>
        </section>

        {/* WORKFLOW */}
        <section className="workflow-panel">
          <div className="workflow-heading">
            <span className="section-eyebrow">ReFeed Workflow</span>
            <h3>Predict → Prepare → Serve → Rescue → Measure</h3>
            <p>
              Every operation contributes to the complete food-waste
              reduction cycle.
            </p>
          </div>

          <div className="workflow-grid">
            <WorkflowStep number="1" title="Predict" />
            <WorkflowStep number="2" title="Prepare" />
            <WorkflowStep number="3" title="Serve" active />
            <WorkflowStep
              number="4"
              title="Rescue"
              active={surplusDetected}
            />
            <WorkflowStep number="5" title="Measure" />
          </div>
        </section>

        {/* NAVIGATION */}
        <section className="navigation-actions">
          <button
            className="secondary-button"
            onClick={() => navigate("/forecast")}
          >
            View Forecast
          </button>

          <button
            className="secondary-button"
            onClick={() => navigate("/preparation")}
          >
            View Preparation
          </button>

          {surplusDetected && (
            <button
              className="rescue-button"
              onClick={goToFoodRescue}
            >
              Food Rescue
              <ArrowRight size={17} />
            </button>
          )}
        </section>
      </main>
    </div>
  );
}

/* FIELD */

function Field({ label, icon, children }) {
  return (
    <div className="form-field">
      <label>
        <span className="field-icon">{icon}</span>
        {label}
      </label>

      {children}
    </div>
  );
}

/* OPERATION CARD */

function OperationCard({
  icon,
  label,
  value,
  unit,
  description,
  input = false,
  inputValue,
  onChange,
  highlight = false,
  variant = "default",
}) {
  return (
    <div
      className={`operation-card operation-card-${variant} ${
        highlight ? "operation-card-highlight" : ""
      }`}
    >
      <div className="operation-card-top">
        <div className="operation-card-icon">
          {icon}
        </div>

        <span className="operation-card-label">
          {label}
        </span>
      </div>

      {input ? (
        <div className="operation-input-row">
          <input
            type="number"
            min="0"
            value={inputValue}
            onChange={(event) =>
              onChange(event.target.value)
            }
          />

          <span>{unit}</span>
        </div>
      ) : (
        <div className="operation-value">
          {value}
          <span>{unit}</span>
        </div>
      )}

      <p>{description}</p>
    </div>
  );
}

/* METRIC CARD */

function MetricCard({
  label,
  value,
  description,
  progress,
  warning = false,
}) {
  return (
    <div className={`metric-card ${warning ? "metric-warning" : ""}`}>
      <div className="metric-card-top">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>

      <div className="metric-progress">
        <span
          style={{
            width: `${Math.min(Math.max(progress || 0, 0), 100)}%`,
          }}
        />
      </div>

      <p>{description}</p>
    </div>
  );
}

/* SUMMARY */

function SummaryItem({ label, value, warning = false }) {
  return (
    <div className={`summary-item ${warning ? "summary-warning" : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

/* WORKFLOW */

function WorkflowStep({ number, title, active = false }) {
  return (
    <div className={`workflow-step ${active ? "workflow-active" : ""}`}>
      <div className="workflow-number">{number}</div>
      <div>
        <span>Step {number}</span>
        <strong>{title}</strong>
      </div>
    </div>
  );
}