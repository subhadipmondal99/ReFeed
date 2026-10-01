import {
  useEffect,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

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
  Loader2,
  RefreshCw,
} from "lucide-react";

import {
  collection,
  getDocs,
} from "firebase/firestore";

import { db } from "../firebase/auth";

import {
  addMealHistory,
  getMealHistoryRecord,
} from "../services/mealHistoryService";

import "./MealOperations.css";


/* =========================================================
   CONSTANTS
   ========================================================= */

const SURPLUS_THRESHOLD = 20;

const DEFAULT_POPULATION = 1000;


/* =========================================================
   HELPERS
   ========================================================= */

const getToday = () => {
  return new Date()
    .toISOString()
    .split("T")[0];
};


const toNumber = (
  value,
  fallback = 0
) => {
  const number =
    Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
};


const normalizeDate = (
  value
) => {
  if (!value) {
    return "";
  }

  return String(value)
    .slice(0, 10);
};


const normalizeMealType = (
  value
) => {
  if (!value) {
    return "";
  }

  const normalized =
    String(value)
      .trim()
      .toLowerCase();

  if (
    normalized ===
    "lunch"
  ) {
    return "Lunch";
  }

  if (
    normalized ===
    "dinner"
  ) {
    return "Dinner";
  }

  return String(value)
    .trim();
};


/* =========================================================
   LOAD FORECAST FROM FIREBASE
   =========================================================

   We intentionally read the predictions collection and
   filter in JavaScript.

   This avoids Firestore composite-index requirements.
   ========================================================= */

const getFirebasePrediction = async (
  date,
  mealType
) => {

  const normalizedDate =
    normalizeDate(date);

  const normalizedMealType =
    normalizeMealType(
      mealType
    );


  if (
    !normalizedDate ||
    !normalizedMealType
  ) {
    return null;
  }


  const snapshot =
    await getDocs(
      collection(
        db,
        "predictions"
      )
    );


  const records =
    snapshot.docs.map(
      (predictionDoc) => ({
        id:
          predictionDoc.id,

        ...predictionDoc.data(),
      })
    );


  const matchingRecords =
    records.filter(
      (record) => {

        const recordDate =
          normalizeDate(
            record.date
          );

        const recordMealType =
          normalizeMealType(
            record.meal_type ||
            record.mealType
          );


        return (
          recordDate ===
          normalizedDate &&
          recordMealType ===
          normalizedMealType
        );
      }
    );


  if (
    matchingRecords.length ===
    0
  ) {
    return null;
  }


  /* -------------------------------------------------------
     If duplicate prediction documents already exist,
     use the latest one based on saved timestamp when
     possible.
     ------------------------------------------------------- */

  matchingRecords.sort(
    (a, b) => {

      const aTime =
        a.createdAt?.seconds ||
        0;

      const bTime =
        b.createdAt?.seconds ||
        0;

      return bTime - aTime;
    }
  );


  return matchingRecords[0];
};


/* =========================================================
   MAIN COMPONENT
   ========================================================= */

export default function MealOperations() {

  const navigate =
    useNavigate();

  const location =
    useLocation();


  /* =======================================================
     FORECAST PASSED FROM PREPARATION
     ======================================================= */

  const passedForecast =
    location.state?.forecast ||
    null;


  /* =======================================================
     INPUTS
     ======================================================= */

  const [
    mealType,
    setMealType,
  ] = useState(
    normalizeMealType(
      passedForecast?.mealType ||
      passedForecast?.meal_type ||
      "Lunch"
    )
  );


  const [
    date,
    setDate,
  ] = useState(
    normalizeDate(
      passedForecast?.date
    ) ||
    getToday()
  );


  const [
    dayType,
    setDayType,
  ] = useState(
    passedForecast?.dayType ||
    passedForecast?.day_type ||
    "regular"
  );


  const [
    campusPopulation,
    setCampusPopulation,
  ] = useState(
    toNumber(
      passedForecast?.campusPopulation ??
      passedForecast?.campus_population,
      DEFAULT_POPULATION
    )
  );


  /* =======================================================
     FORECAST DATA
     ======================================================= */

  const [
    predictedMeals,
    setPredictedMeals,
  ] = useState(
    toNumber(
      passedForecast?.predictedMeals ??
      passedForecast?.predicted_meals,
      0
    )
  );


  const [
    recommendedCooking,
    setRecommendedCooking,
  ] = useState(
    toNumber(
      passedForecast?.recommendedCooking ??
      passedForecast?.recommended_cooking,
      0
    )
  );


  /* =======================================================
     ACTUAL OPERATION DATA
     ======================================================= */

  const [
    cookedMeals,
    setCookedMeals,
  ] = useState(
    toNumber(
      passedForecast?.recommendedCooking ??
      passedForecast?.recommended_cooking,
      0
    )
  );


  const [
    servedMeals,
    setServedMeals,
  ] = useState(0);


  /* =======================================================
     UI STATES
     ======================================================= */

  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    saving,
    setSaving,
  ] = useState(false);


  const [
    saved,
    setSaved,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState("");


  const [
    dataSource,
    setDataSource,
  ] = useState(
    "Loading Firebase data..."
  );


  /* =======================================================
     CALCULATIONS
     ======================================================= */

  const numericCooked =
    Math.max(
      0,
      Math.round(
        toNumber(
          cookedMeals,
          0
        )
      )
    );


  const numericServed =
    Math.max(
      0,
      Math.round(
        toNumber(
          servedMeals,
          0
        )
      )
    );


  const numericPredicted =
    Math.max(
      0,
      Math.round(
        toNumber(
          predictedMeals,
          0
        )
      )
    );


  const numericRecommended =
    Math.max(
      0,
      Math.round(
        toNumber(
          recommendedCooking,
          0
        )
      )
    );


  const surplusMeals =
    Math.max(
      0,
      numericCooked -
      numericServed
    );


  const serviceRate =
    numericCooked > 0
      ? Math.min(
        100,
        Math.round(
          (
            numericServed /
            numericCooked
          ) * 100
        )
      )
      : 0;


  const preparationAccuracy =
    numericPredicted > 0
      ? Math.round(
        (
          numericServed /
          numericPredicted
        ) * 100
      )
      : 0;


  const surplusDetected =
    surplusMeals >
    SURPLUS_THRESHOLD;


  /* =======================================================
     LOAD DATA
     ======================================================= */

  useEffect(() => {

    let cancelled =
      false;


    const loadData =
      async () => {

        setLoading(true);

        setError("");

        setSaved(false);


        try {

          /* -------------------------------------------------
             RESET OPERATION VALUES WHEN DATE/MEAL CHANGES
             ------------------------------------------------- */

          setServedMeals(0);


          /* -------------------------------------------------
             1. FIREBASE PREDICTION
             ------------------------------------------------- */

          let firebasePrediction =
            null;


          try {

            firebasePrediction =
              await getFirebasePrediction(
                date,
                mealType
              );

          } catch (predictionError) {

            console.error(
              "Prediction Firebase load error:",
              predictionError
            );

            // Do not stop the page.
            // Preparation-passed forecast can still be used.
          }


          /* -------------------------------------------------
             2. EXISTING MEAL OPERATION
             ------------------------------------------------- */

          let existingOperation =
            null;


          try {

            existingOperation =
              await getMealHistoryRecord(
                date,
                mealType
              );

          } catch (operationError) {

            console.error(
              "Meal history load error:",
              operationError
            );

            throw operationError;
          }


          if (cancelled) {
            return;
          }


          /* -------------------------------------------------
             3. DETERMINE FORECAST SOURCE
             ------------------------------------------------- */

          const forecast =
            firebasePrediction ||
            passedForecast ||
            null;


          if (forecast) {

            const forecastPredicted =
              toNumber(
                forecast.predicted_meals ??
                forecast.predictedMeals,
                0
              );


            const forecastCooking =
              toNumber(
                forecast.recommended_cooking ??
                forecast.recommendedCooking,
                forecastPredicted > 0
                  ? Math.round(
                    forecastPredicted *
                    1.05
                  )
                  : 0
              );


            setPredictedMeals(
              forecastPredicted
            );


            setRecommendedCooking(
              forecastCooking
            );


            setDayType(
              forecast.day_type ??
              forecast.dayType ??
              "regular"
            );


            setCampusPopulation(
              toNumber(
                forecast.campus_population ??
                forecast.campusPopulation,
                DEFAULT_POPULATION
              )
            );


            setDataSource(
              firebasePrediction
                ? "Firebase prediction"
                : "Forecast page"
            );

          } else {

            setPredictedMeals(0);

            setRecommendedCooking(0);

            setDataSource(
              "No forecast found"
            );
          }


          /* -------------------------------------------------
             4. EXISTING OPERATION OVERRIDES DEFAULTS
             ------------------------------------------------- */

          if (existingOperation) {

            setPredictedMeals(
              toNumber(
                existingOperation
                  .predicted_meals,
                0
              )
            );


            setRecommendedCooking(
              toNumber(
                existingOperation
                  .recommended_cooking,
                0
              )
            );


            setCookedMeals(
              toNumber(
                existingOperation
                  .cooked_meals,
                0
              )
            );


            setServedMeals(
              toNumber(
                existingOperation
                  .served_meals,
                0
              )
            );


            setDayType(
              existingOperation
                .day_type ||
              "regular"
            );


            setCampusPopulation(
              toNumber(
                existingOperation
                  .campus_population,
                DEFAULT_POPULATION
              )
            );


            setSaved(true);

            setDataSource(
              "Firebase meal operations"
            );

          } else {

            /* -----------------------------------------------
               No previous operation.

               Start cooking count from recommended cooking.
               Served starts at zero because it is an actual
               operation value entered by the user.
               ----------------------------------------------- */

            const initialCooking =
              firebasePrediction
                ? toNumber(
                  firebasePrediction
                    .recommended_cooking ??
                  firebasePrediction
                    .recommendedCooking,
                  0
                )
                : toNumber(
                  passedForecast?.recommendedCooking ??
                  passedForecast?.recommended_cooking,
                  0
                );


            setCookedMeals(
              initialCooking
            );


            setServedMeals(0);

            setSaved(false);
          }

        } catch (loadError) {

          console.error(
            "Meal Operations load error:",
            loadError
          );


          if (!cancelled) {

            setError(
              loadError?.message ||
              "Unable to load meal operations from Firebase."
            );
          }

        } finally {

          if (!cancelled) {
            setLoading(false);
          }
        }
      };


    loadData();


    return () => {
      cancelled = true;
    };

  }, [
    date,
    mealType,
  ]);


  /* =======================================================
     SAVE OPERATIONS
     ======================================================= */

  const handleSaveOperations =
    async () => {

      setError("");

      setSaved(false);


      /* ---------------------------------------------------
         VALIDATION
         --------------------------------------------------- */

      if (!date) {

        setError(
          "Please select an operation date."
        );

        return;
      }


      if (!mealType) {

        setError(
          "Please select a meal type."
        );

        return;
      }


      if (
        numericCooked < 0 ||
        numericServed < 0
      ) {

        setError(
          "Meal counts cannot be negative."
        );

        return;
      }


      if (
        numericServed >
        numericCooked
      ) {

        setError(
          "Served meals cannot be greater than cooked meals."
        );

        return;
      }


      try {

        setSaving(true);


        const result =
          await addMealHistory({

            date,

            mealType,

            actualHeadcount:
              numericServed,

            predictedMeals:
              numericPredicted,

            recommendedCooking:
              numericRecommended,

            cookedMeals:
              numericCooked,

            servedMeals:
              numericServed,

            surplusMeals:
              surplusMeals,

            dayType,

            campusPopulation:
              toNumber(
                campusPopulation,
                DEFAULT_POPULATION
              ),
          });


        console.log(
          "Meal operation saved to Firebase:",
          result
        );


        setSaved(true);

        setDataSource(
          "Firebase meal operations"
        );

      } catch (saveError) {

        console.error(
          "Meal operation save error:",
          saveError
        );


        setError(
          saveError?.message ||
          "Unable to save meal operations. Please try again."
        );

      } finally {

        setSaving(false);
      }
    };


  /* =======================================================
     REFRESH
     ======================================================= */

  const handleRefresh =
    () => {

      window.location.reload();
    };


  /* =======================================================
     FOOD RESCUE
     ======================================================= */

  const goToFoodRescue =
    () => {

      navigate(
        "/food-rescue",
        {
          state: {

            date,

            mealType,

            predictedMeals:
              numericPredicted,

            recommendedCooking:
              numericRecommended,

            cookedMeals:
              numericCooked,

            servedMeals:
              numericServed,

            surplusMeals,

            dayType,

            campusPopulation:
              toNumber(
                campusPopulation,
                DEFAULT_POPULATION
              ),

            pickupLocation:
              "Campus Canteen",

            shelfLifeMinutes:
              120,
          },
        }
      );
    };


  /* =======================================================
     RENDER
     ======================================================= */

  return (

    <div className="meal-operations-page">


      {/* ===================================================
          HEADER
          =================================================== */}

      <header className="meal-operations-header">

        <div className="meal-operations-container meal-header-inner">

          <div className="meal-header-left">

            <button
              className="meal-back-button"
              onClick={() =>
                navigate(
                  "/preparation"
                )
              }
            >

              <ArrowLeft
                size={17}
              />

              Back to Preparation

            </button>


            <div className="meal-title-row">

              <div className="meal-title-icon">

                <UtensilsCrossed
                  size={24}
                />

              </div>


              <div>

                <h1>
                  Meal Operations
                </h1>

                <p>
                  Track cooking, serving,
                  consumption and surplus meals.
                </p>

              </div>

            </div>

          </div>


          <div className="service-rate-widget">

            <div className="service-rate-icon">

              <TrendingUp
                size={20}
              />

            </div>


            <div>

              <span>
                Service Rate
              </span>

              <strong>
                {serviceRate}%
              </strong>

            </div>

          </div>

        </div>

      </header>


      <main className="meal-operations-container meal-main">


        {/* =================================================
            INTRO
            ================================================= */}

        <section className="operations-intro">

          <div>

            <span className="section-eyebrow">

              ReFeed · Meal Management

            </span>


            <h2>
              Record Today&apos;s Meal Operations
            </h2>


            <p>

              Compare predicted demand with
              meals prepared and served to
              identify food surplus before it
              becomes waste.

            </p>

          </div>


          <div className="intro-status">

            {loading ? (
              <Loader2
                size={18}
                className="button-spinner"
              />
            ) : (
              <ShieldCheck
                size={18}
              />
            )}

            <span>
              {loading
                ? "Loading Firebase data..."
                : dataSource}
            </span>

          </div>

        </section>


        {/* =================================================
            SUCCESS
            ================================================= */}

        {saved && (

          <div className="operation-alert success-alert">

            <div className="alert-icon">

              <CheckCircle2
                size={20}
              />

            </div>


            <div>

              <strong>
                Operations saved successfully
              </strong>

              <p>

                Today&apos;s meal data has been
                stored in Firebase.

              </p>

            </div>

          </div>

        )}


        {/* =================================================
            ERROR
            ================================================= */}

        {error && (

          <div className="operation-alert error-alert">

            <div className="alert-icon">

              <AlertTriangle
                size={20}
              />

            </div>


            <div>

              <strong>
                Unable to process operations
              </strong>

              <p>
                {error}
              </p>

            </div>

          </div>

        )}


        {/* =================================================
            FIREBASE STATUS
            ================================================= */}

        <section className="save-panel">

          <div className="save-panel-icon">

            <Database
              size={24}
            />

          </div>


          <div className="save-panel-content">

            <span className="section-eyebrow">
              Firebase Database
            </span>

            <h3>
              Live Database Connection
            </h3>

            <p>

              {loading
                ? "Loading forecast and operation records..."
                : dataSource ===
                  "No forecast found"
                  ? "No forecast was found for this date. You can still enter actual meal operations."
                  : "Forecast and meal operation data are connected to Firebase."}

            </p>

          </div>


          <button
            className="secondary-button"
            onClick={
              handleRefresh
            }
            disabled={loading}
          >

            <RefreshCw
              size={17}
            />

            Refresh

          </button>

        </section>


        {/* =================================================
            MEAL DETAILS
            ================================================= */}

        <section className="operation-panel">

          <div className="panel-heading">

            <div className="panel-heading-icon">

              <CalendarDays
                size={20}
              />

            </div>


            <div>

              <h3>
                Meal Details
              </h3>

              <p>
                Configure the operation you are recording.
              </p>

            </div>

          </div>


          <div className="meal-details-grid">


            <Field
              label="Operation Date"
              icon={
                <CalendarDays
                  size={17}
                />
              }
            >

              <input
                type="date"
                value={date}
                onChange={(event) => {

                  setDate(
                    event.target.value
                  );

                  setSaved(false);
                }}
              />

            </Field>


            <Field
              label="Meal Type"
              icon={
                <Utensils
                  size={17}
                />
              }
            >

              <select
                value={mealType}
                onChange={(event) => {

                  setMealType(
                    normalizeMealType(
                      event.target.value
                    )
                  );

                  setSaved(false);
                }}
              >

                <option value="Lunch">
                  Lunch
                </option>

                <option value="Dinner">
                  Dinner
                </option>

              </select>

            </Field>


            <Field
              label="Day Type"
              icon={
                <CalendarDays
                  size={17}
                />
              }
            >

              <select
                value={dayType}
                onChange={(event) => {

                  setDayType(
                    event.target.value
                  );

                  setSaved(false);
                }}
              >

                <option value="regular">
                  Regular Day
                </option>

                <option value="exam">
                  Exam Day
                </option>

                <option value="holiday">
                  Holiday
                </option>

              </select>

            </Field>


            <Field
              label="Campus Population"
              icon={
                <Users
                  size={17}
                />
              }
            >

              <input
                type="number"
                min="0"
                value={
                  campusPopulation
                }
                onChange={(event) => {

                  setCampusPopulation(
                    event.target.value
                  );

                  setSaved(false);
                }}
              />

            </Field>

          </div>

        </section>


        {/* =================================================
            OPERATION CARDS
            ================================================= */}

        <section className="operation-cards-grid">


          <OperationCard
            icon={
              <Users
                size={22}
              />
            }
            label="Predicted"
            value={
              numericPredicted
            }
            unit="meals"
            description="AI demand forecast"
            variant="prediction"
          />


          <OperationCard
            icon={
              <ChefHat
                size={22}
              />
            }
            label="Cooked"
            value={
              numericCooked
            }
            unit="meals"
            description="Meals prepared"
            input
            inputValue={
              cookedMeals
            }
            onChange={(value) => {

              setCookedMeals(
                value
              );

              setSaved(false);
            }}
            variant="cooked"
          />


          <OperationCard
            icon={
              <Utensils
                size={22}
              />
            }
            label="Served"
            value={
              numericServed
            }
            unit="meals"
            description="Meals served to students"
            input
            inputValue={
              servedMeals
            }
            onChange={(value) => {

              setServedMeals(
                value
              );

              setSaved(false);
            }}
            variant="served"
          />


          <OperationCard
            icon={
              <AlertTriangle
                size={22}
              />
            }
            label="Remaining"
            value={
              surplusMeals
            }
            unit="meals"
            description="Potential surplus"
            highlight={
              surplusDetected
            }
            variant={
              surplusDetected
                ? "surplus"
                : "safe"
            }
          />

        </section>


        {/* =================================================
            METRICS
            ================================================= */}

        <section className="metrics-grid">

          <MetricCard
            label="Service Rate"
            value={`${serviceRate}%`}
            description="Cooked meals successfully served"
            progress={
              serviceRate
            }
          />


          <MetricCard
            label="Forecast Coverage"
            value={`${preparationAccuracy}%`}
            description="Served meals compared with prediction"
            progress={
              Math.min(
                preparationAccuracy,
                100
              )
            }
          />


          <MetricCard
            label="Potential Rescue"
            value={`${surplusMeals} meals`}
            description={
              surplusDetected
                ? "Above rescue threshold"
                : "Within normal threshold"
            }
            warning={
              surplusDetected
            }
          />

        </section>


        {/* =================================================
            SURPLUS STATUS
            ================================================= */}

        <section className="surplus-section">

          {surplusDetected ? (

            <div className="surplus-card surplus-warning">

              <div className="surplus-content">

                <div className="surplus-icon">

                  <AlertTriangle
                    size={26}
                  />

                </div>


                <div>

                  <span className="status-badge warning-badge">

                    Action Required

                  </span>


                  <h3>
                    Surplus Food Detected
                  </h3>


                  <p>

                    <strong>
                      {surplusMeals} meals
                    </strong>{" "}
                    remain after service.

                    This is above the{" "}
                    {SURPLUS_THRESHOLD}
                    -meal rescue threshold.

                  </p>

                </div>

              </div>


              <button
                className="primary-warning-button"
                onClick={
                  goToFoodRescue
                }
              >

                Start Food Rescue

                <ArrowRight
                  size={18}
                />

              </button>

            </div>

          ) : (

            <div className="surplus-card surplus-safe">

              <div className="surplus-content">

                <div className="surplus-icon">

                  <CheckCircle2
                    size={26}
                  />

                </div>


                <div>

                  <span className="status-badge safe-badge">

                    Normal

                  </span>


                  <h3>
                    No Significant Surplus
                  </h3>


                  <p>

                    Only{" "}
                    <strong>
                      {surplusMeals} meals
                    </strong>{" "}
                    remain.

                    The current surplus is
                    within the normal threshold.

                  </p>

                </div>

              </div>

            </div>

          )}

        </section>


        {/* =================================================
            SUMMARY
            ================================================= */}

        <section className="operation-panel">

          <div className="panel-heading">

            <div className="panel-heading-icon">

              <Database
                size={20}
              />

            </div>


            <div>

              <h3>
                Operation Summary
              </h3>

              <p>
                Review the recorded meal activity.
              </p>

            </div>

          </div>


          <div className="summary-grid">

            <SummaryItem
              label="Meal Type"
              value={
                mealType
              }
            />


            <SummaryItem
              label="Operation Date"
              value={
                date
              }
            />


            <SummaryItem
              label="Meals Predicted"
              value={`${numericPredicted} meals`}
            />


            <SummaryItem
              label="Meals Cooked"
              value={`${numericCooked} meals`}
            />


            <SummaryItem
              label="Meals Served"
              value={`${numericServed} meals`}
            />


            <SummaryItem
              label="Meals Remaining"
              value={`${surplusMeals} meals`}
              warning={
                surplusDetected
              }
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


        {/* =================================================
            SAVE
            ================================================= */}

        <section className="save-panel">

          <div className="save-panel-icon">

            <Database
              size={24}
            />

          </div>


          <div className="save-panel-content">

            <span className="section-eyebrow">
              Firebase Database
            </span>


            <h3>
              Save Meal Operations
            </h3>


            <p>

              Store today&apos;s actual demand,
              cooking, serving and surplus
              data for future forecasting and
              impact analysis.

            </p>

          </div>


          <button
            className="save-button"
            onClick={
              handleSaveOperations
            }
            disabled={
              saving ||
              loading
            }
          >

            {saving ? (

              <>
                <span className="button-spinner" />
                Saving...
              </>

            ) : (

              <>
                <Save
                  size={18}
                />

                {saved
                  ? "Update Operations"
                  : "Save Operations"}
              </>

            )}

          </button>

        </section>


        {/* =================================================
            WORKFLOW
            ================================================= */}

        <section className="workflow-panel">

          <div className="workflow-heading">

            <span className="section-eyebrow">
              ReFeed Workflow
            </span>


            <h3>
              Predict → Prepare → Serve → Rescue → Measure
            </h3>


            <p>

              Every operation contributes to
              the complete food-waste reduction
              cycle.

            </p>

          </div>


          <div className="workflow-grid">

            <WorkflowStep
              number="1"
              title="Predict"
            />


            <WorkflowStep
              number="2"
              title="Prepare"
            />


            <WorkflowStep
              number="3"
              title="Serve"
              active
            />


            <WorkflowStep
              number="4"
              title="Rescue"
              active={
                surplusDetected
              }
            />


            <WorkflowStep
              number="5"
              title="Measure"
            />

          </div>

        </section>


        {/* =================================================
            NAVIGATION
            ================================================= */}

        <section className="navigation-actions">

          <button
            className="secondary-button"
            onClick={() =>
              navigate(
                "/forecast"
              )
            }
          >

            View Forecast

          </button>


          <button
            className="secondary-button"
            onClick={() =>
              navigate(
                "/preparation"
              )
            }
          >

            View Preparation

          </button>


          {surplusDetected && (

            <button
              className="rescue-button"
              onClick={
                goToFoodRescue
              }
            >

              Food Rescue

              <ArrowRight
                size={17}
              />

            </button>

          )}

        </section>

      </main>

    </div>
  );
}


/* =========================================================
   FIELD
   ========================================================= */

function Field({
  label,
  icon,
  children,
}) {

  return (

    <div className="form-field">

      <label>

        <span className="field-icon">
          {icon}
        </span>

        {label}

      </label>


      {children}

    </div>
  );
}


/* =========================================================
   OPERATION CARD
   ========================================================= */

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
      className={`operation-card operation-card-${variant} ${highlight
          ? "operation-card-highlight"
          : ""
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
            value={
              inputValue
            }
            onChange={(event) =>
              onChange(
                event.target.value
              )
            }
          />


          <span>
            {unit}
          </span>

        </div>

      ) : (

        <div className="operation-value">

          {value}

          <span>
            {unit}
          </span>

        </div>

      )}


      <p>
        {description}
      </p>

    </div>
  );
}


/* =========================================================
   METRIC CARD
   ========================================================= */

function MetricCard({
  label,
  value,
  description,
  progress,
  warning = false,
}) {

  return (

    <div
      className={`metric-card ${warning
          ? "metric-warning"
          : ""
        }`}
    >

      <div className="metric-card-top">

        <span>
          {label}
        </span>


        <strong>
          {value}
        </strong>

      </div>


      <div className="metric-progress">

        <span
          style={{
            width: `${Math.min(
              Math.max(
                progress || 0,
                0
              ),
              100
            )
              }%`,
          }}
        />

      </div>


      <p>
        {description}
      </p>

    </div>
  );
}


/* =========================================================
   SUMMARY
   ========================================================= */

function SummaryItem({
  label,
  value,
  warning = false,
}) {

  return (

    <div
      className={`summary-item ${warning
          ? "summary-warning"
          : ""
        }`}
    >

      <span>
        {label}
      </span>


      <strong>
        {value}
      </strong>

    </div>
  );
}


/* =========================================================
   WORKFLOW
   ========================================================= */

function WorkflowStep({
  number,
  title,
  active = false,
}) {

  return (

    <div
      className={`workflow-step ${active
          ? "workflow-active"
          : ""
        }`}
    >

      <div className="workflow-number">

        {number}

      </div>


      <div>

        <span>
          Step {number}
        </span>


        <strong>
          {title}
        </strong>

      </div>

    </div>
  );
}