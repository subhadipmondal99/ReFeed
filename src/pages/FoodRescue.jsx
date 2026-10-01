import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  HeartHandshake,
  Leaf,
  MapPin,
  PackageCheck,
  Phone,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Truck,
  Users,
  Zap,
} from "lucide-react";

import {
  createSurplusEvent,
  calculateRemainingMeals,
  isSurplus,
  SURPLUS_THRESHOLD,
} from "../services/surplusService";

import { createDonation } from "../services/donationService";

import "./FoodRescue.css";

/* =========================================================
   DEMO NGO DATA
   ========================================================= */

const DEMO_NGOS = [
  {
    id: "ngo-helping-hands",
    name: "Helping Hands",
    distance: "1.8 km",
    distanceKm: 1.8,
    capacity: 120,
    phone: "+91 98765 43210",
    responseTime: "15–20 min",
  },
  {
    id: "ngo-food-for-all",
    name: "Food For All",
    distance: "2.6 km",
    distanceKm: 2.6,
    capacity: 80,
    phone: "+91 91234 56789",
    responseTime: "20–25 min",
  },
  {
    id: "ngo-community-kitchen",
    name: "Community Kitchen",
    distance: "3.4 km",
    distanceKm: 3.4,
    capacity: 150,
    phone: "+91 99887 66554",
    responseTime: "25–30 min",
  },
];

/* =========================================================
   MAIN PAGE
   ========================================================= */

export default function FoodRescue() {
  const location = useLocation();
  const navigate = useNavigate();

  const rescueData = location.state || {};

  /* =======================================================
     INPUT DATA
     ======================================================= */

  const date =
    rescueData.date ||
    new Date().toISOString().split("T")[0];

  const mealType =
    rescueData.mealType ||
    rescueData.meal_type ||
    "Lunch";

  const predictedMeals =
    Number(
      rescueData.predictedMeals ??
        rescueData.predicted_meals ??
        0
    ) || 0;

  const preparedMeals =
    Number(
      rescueData.cookedMeals ??
        rescueData.preparedMeals ??
        rescueData.prepared ??
        rescueData.recommendedCooking ??
        0
    ) || 0;

  const servedMeals =
    Number(
      rescueData.servedMeals ??
        rescueData.served ??
        0
    ) || 0;

  const dayType =
    rescueData.dayType ||
    "regular";

  const campusPopulation =
    Number(
      rescueData.campusPopulation ??
        1000
    ) || 1000;

  const pickupLocation =
    rescueData.pickupLocation ||
    "Main Campus Canteen";

  const shelfLifeMinutes =
    Number(
      rescueData.shelfLifeMinutes ??
        120
    ) || 120;

  /* =======================================================
     CALCULATE SURPLUS
     ======================================================= */

  const remainingMeals = useMemo(
    () =>
      calculateRemainingMeals({
        prepared: preparedMeals,
        served: servedMeals,
      }),
    [preparedMeals, servedMeals]
  );

  const surplusDetected =
    isSurplus(remainingMeals);

  /* =======================================================
     STATE
     ======================================================= */

  const [selectedNgo, setSelectedNgo] =
    useState(null);

  const [creatingSurplus, setCreatingSurplus] =
    useState(false);

  const [sendingDonation, setSendingDonation] =
    useState(false);

  const [surplusEvent, setSurplusEvent] =
    useState(null);

  const [donation, setDonation] =
    useState(null);

  const [error, setError] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  /* =======================================================
     DERIVED DATA
     ======================================================= */

  const rescueProgress =
    donation
      ? 100
      : selectedNgo
      ? 75
      : surplusEvent
      ? 50
      : surplusDetected
      ? 25
      : 0;

  const formattedShelfLife =
    shelfLifeMinutes >= 60
      ? `${Math.floor(
          shelfLifeMinutes / 60
        )} hour${
          Math.floor(
            shelfLifeMinutes / 60
          ) !== 1
            ? "s"
            : ""
        }${
          shelfLifeMinutes % 60
            ? ` ${shelfLifeMinutes % 60} min`
            : ""
        }`
      : `${shelfLifeMinutes} min`;

  /*
   * IMPORTANT:
   * An NGO does NOT need to accept the complete surplus.
   *
   * Example:
   * Surplus = 488
   * NGO capacity = 120
   * Pickup = 120
   *
   * This allows partial NGO pickup.
   */

  const selectedNgoCanHandle =
    Boolean(selectedNgo) &&
    Number(selectedNgo?.capacity || 0) > 0;

  const pickupMeals = selectedNgo
    ? Math.min(
        remainingMeals,
        Number(selectedNgo.capacity || 0)
      )
    : 0;

  const remainingAfterPickup = Math.max(
    0,
    remainingMeals - pickupMeals
  );

  /* =======================================================
     CREATE SURPLUS EVENT
     ======================================================= */

  const handleCreateSurplus = async () => {
    setError("");
    setSuccessMessage("");

    if (!surplusDetected) {
      setError(
        `Surplus must be greater than ${SURPLUS_THRESHOLD} meals before rescue can be initiated.`
      );
      return;
    }

    try {
      setCreatingSurplus(true);

      const result =
        await createSurplusEvent({
          canteenId:
            "main-campus-canteen",

          date,

          mealType,

          predictedMeals,

          prepared:
            preparedMeals,

          served:
            servedMeals,

          dayType,

          campusPopulation,

          location:
            pickupLocation,

          shelfLifeMinutes,
        });

      if (!result?.surplus) {
        setError(
          result?.message ||
            "No qualifying surplus was detected."
        );
        return;
      }

      setSurplusEvent(result);

      setSuccessMessage(
        `Surplus event created successfully for ${result.remaining} meals.`
      );
    } catch (err) {
      console.error(
        "Create surplus error:",
        err
      );

      setError(
        err?.message ||
          "Unable to create surplus event."
      );
    } finally {
      setCreatingSurplus(false);
    }
  };

  /* =======================================================
     SELECT NGO
     ======================================================= */

  const handleSelectNgo = (ngo) => {
    const capacity =
      Number(ngo?.capacity || 0);

    if (!ngo || capacity <= 0) {
      setError(
        "This NGO currently has no available pickup capacity."
      );
      return;
    }

    setError("");
    setSuccessMessage("");
    setSelectedNgo(ngo);
  };

  /* =======================================================
     SEND DONATION
     ======================================================= */

  const handleSendNotification = async () => {
    setError("");
    setSuccessMessage("");

    if (!surplusEvent?.id) {
      setError(
        "Create the surplus event before notifying an NGO."
      );
      return;
    }

    if (!selectedNgo) {
      setError(
        "Please select an NGO for pickup."
      );
      return;
    }

    if (
      Number(selectedNgo.capacity || 0) <= 0
    ) {
      setError(
        `${selectedNgo.name} currently has no available pickup capacity.`
      );
      return;
    }

    try {
      setSendingDonation(true);

      const result =
        await createDonation({
          surplusEventId:
            surplusEvent.id,

          date,

          mealType,

          predictedMeals,

          preparedMeals,

          servedMeals,

          /*
           * Actual quantity this NGO will pick up.
           */
          surplusMeals:
            pickupMeals,

          /*
           * Keep the original total surplus
           * for tracking and reporting.
           */
          totalSurplusMeals:
            remainingMeals,

          pickupMeals,

          remainingAfterPickup,

          pickupLocation,

          shelfLife:
            formattedShelfLife,

          shelfLifeMinutes,

          ngo:
            selectedNgo,

          status:
            "Pickup Pending",

          notes:
            "Surplus generated from campus canteen meal operations.",
        });

      setDonation(result);

      setSuccessMessage(
        `${selectedNgo.name} has been notified for pickup.`
      );

      navigate("/donations", {
        state: {
          donationId:
            result.id,

          surplusEventId:
            surplusEvent.id,

          date,

          mealType,

          predictedMeals,

          preparedMeals,

          servedMeals,

          surplusMeals:
            pickupMeals,

          totalSurplusMeals:
            remainingMeals,

          pickupMeals,

          remainingAfterPickup,

          pickupLocation,

          shelfLifeMinutes,

          ngo:
            selectedNgo,
        },
      });
    } catch (err) {
      console.error(
        "Donation creation error:",
        err
      );

      setError(
        err?.message ||
          "Unable to create the donation request."
      );
    } finally {
      setSendingDonation(false);
    }
  };

  /* =======================================================
     BACK
     ======================================================= */

  const handleBack = () => {
    navigate(
      "/meal-operations",
      {
        state: {
          date,

          mealType,

          predictedMeals,

          cookedMeals:
            preparedMeals,

          servedMeals,

          dayType,

          campusPopulation,
        },
      }
    );
  };

  /* =======================================================
     IMPACT
     ======================================================= */

  const estimatedPeopleHelped =
    remainingMeals;

  const estimatedWeight =
    (remainingMeals * 0.35).toFixed(1);

  const estimatedCo2 =
    (remainingMeals * 0.45).toFixed(1);

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <div className="food-rescue-page">

      {/* =================================================
          BACKGROUND
          ================================================= */}

      <div className="rescue-bg">
        <div className="rescue-grid-bg" />

        <div className="rescue-glow rescue-glow-one" />

        <div className="rescue-glow rescue-glow-two" />

        <div className="rescue-glow rescue-glow-three" />

        <span className="rescue-particle p1" />
        <span className="rescue-particle p2" />
        <span className="rescue-particle p3" />
        <span className="rescue-particle p4" />
        <span className="rescue-particle p5" />
      </div>

      {/* =================================================
          HEADER
          ================================================= */}

      <header className="food-rescue-header">
        <div className="food-rescue-header-inner">

          <button
            className="food-rescue-back"
            onClick={handleBack}
          >
            <ArrowLeft size={16} />

            <span>
              Meal Operations
            </span>
          </button>

          <div className="food-rescue-title">

            <div className="food-rescue-title-icon">
              <HeartHandshake
                size={21}
              />
            </div>

            <div>
              <h1>
                Food Rescue
              </h1>

              <p>
                Community rescue command center
              </p>
            </div>

          </div>

          <div className="rescue-live-indicator">
            <span />
            RESCUE NETWORK ONLINE
          </div>

        </div>
      </header>

      <main className="food-rescue-container">

        {/* =================================================
            ALERTS
            ================================================= */}

        {error && (
          <div className="food-rescue-alert error">

            <div className="alert-icon">
              <AlertCircle
                size={18}
              />
            </div>

            <div>
              <strong>
                Action required
              </strong>

              <p>
                {error}
              </p>
            </div>

            <button
              onClick={() =>
                setError("")
              }
            >
              ×
            </button>

          </div>
        )}

        {successMessage && (
          <div className="food-rescue-alert success">

            <div className="alert-icon">
              <CheckCircle2
                size={18}
              />
            </div>

            <div>
              <strong>
                Rescue workflow updated
              </strong>

              <p>
                {successMessage}
              </p>
            </div>

          </div>
        )}

        {/* =================================================
            HERO
            ================================================= */}

        <section className="rescue-hero">

          <div className="rescue-hero-copy">

            <div className="rescue-eyebrow">
              <span />
              STEP 04 · FOOD RESCUE
            </div>

            <h2>
              Rescue food.
              <br />
              <em>Restore impact.</em>
            </h2>

            <p>
              ReFeed has detected unused meals.
              Convert the surplus into a traceable
              community donation before its shelf
              life expires.
            </p>

            <div className="rescue-hero-actions">

              <div className="hero-status-pill">
                <HeartHandshake
                  size={14}
                />

                {surplusDetected
                  ? "Surplus detected"
                  : "Monitoring surplus"}
              </div>

              <div className="hero-status-pill">
                <Clock3
                  size={14}
                />

                {formattedShelfLife}
                {" "}
                shelf life
              </div>

            </div>

          </div>

          {/* =================================================
              3D RESCUE CORE
              ================================================= */}

          <div className="rescue-hero-visual">

            <div className="rescue-orbit orbit-a" />
            <div className="rescue-orbit orbit-b" />
            <div className="rescue-orbit orbit-c" />

            <div className="rescue-core-shadow" />

            <div className="rescue-core">

              <div className="rescue-core-ring">
                <HeartHandshake
                  size={39}
                />
              </div>

              <span>
                RESCUE
              </span>

              <strong>
                {remainingMeals}
              </strong>

              <small>
                MEALS
              </small>

            </div>

            <div className="floating-rescue-card card-food">

              <Leaf size={14} />

              <div>
                <span>
                  FOOD SAVED
                </span>

                <strong>
                  {estimatedWeight} kg
                </strong>
              </div>

            </div>

            <div className="floating-rescue-card card-ngo">

              <Users size={14} />

              <div>
                <span>
                  NGO NETWORK
                </span>

                <strong>
                  {DEMO_NGOS.length} nearby
                </strong>
              </div>

            </div>

            <div className="floating-rescue-card card-impact">

              <Zap size={14} />

              <div>
                <span>
                  CO₂ AVOIDED
                </span>

                <strong>
                  {estimatedCo2} kg
                </strong>
              </div>

            </div>

          </div>
        </section>

        {/* =================================================
            WORKFLOW
            ================================================= */}

        <section className="rescue-flow">

          <FlowStep
            number="01"
            title="Detect"
            active
            done
          />

          <FlowLine active />

          <FlowStep
            number="02"
            title="Record"
            active={
              Boolean(
                surplusEvent
              )
            }
            done={
              Boolean(
                surplusEvent
              )
            }
          />

          <FlowLine
            active={
              Boolean(
                surplusEvent
              )
            }
          />

          <FlowStep
            number="03"
            title="Select NGO"
            active={
              Boolean(
                selectedNgo
              )
            }
            done={
              Boolean(
                selectedNgo
              )
            }
          />

          <FlowLine
            active={
              Boolean(
                selectedNgo
              )
            }
          />

          <FlowStep
            number="04"
            title="Pickup"
            active={
              Boolean(
                donation
              )
            }
            done={
              Boolean(
                donation
              )
            }
          />

          <FlowLine
            active={
              Boolean(
                donation
              )
            }
          />

          <FlowStep
            number="05"
            title="Impact"
            active={
              Boolean(
                donation
              )
            }
          />

        </section>

        {/* =================================================
            SURPLUS STATUS
            ================================================= */}

        <section
          className={`surplus-status ${
            surplusDetected
              ? "active"
              : "inactive"
          }`}
        >

          <div className="surplus-status-main">

            <div className="surplus-status-icon">

              {surplusDetected ? (
                <HeartHandshake
                  size={25}
                />
              ) : (
                <ShieldCheck
                  size={25}
                />
              )}

            </div>

            <div>

              <span>
                SURPLUS DETECTION
              </span>

              <h3>
                {surplusDetected
                  ? `${remainingMeals} meals are ready for rescue`
                  : "No qualifying surplus detected"}
              </h3>

              <p>
                {surplusDetected
                  ? `Remaining meals are above the ${SURPLUS_THRESHOLD}-meal rescue threshold.`
                  : `Rescue activates when more than ${SURPLUS_THRESHOLD} meals remain.`}
              </p>

            </div>

          </div>

          <div className="surplus-status-number">
            <strong>
              {remainingMeals}
            </strong>

            <span>
              meals
            </span>
          </div>

        </section>

        {/* =================================================
            MAIN GRID
            ================================================= */}

        <section className="food-rescue-grid">

          {/* =================================================
              LEFT
              ================================================= */}

          <div className="food-rescue-main">

            {/* ---------------------------------------------
                STEP 01
                --------------------------------------------- */}

            <div className="rescue-card">

              <CardHeader
                step="01"
                title="Verify surplus"
                description="Confirm the operational numbers before creating the rescue event."
                icon={
                  <PackageCheck
                    size={18}
                  />
                }
              />

              <div className="operation-metrics">

                <OperationMetric
                  label="Meal date"
                  value={date}
                />

                <OperationMetric
                  label="Meal type"
                  value={mealType}
                />

                <OperationMetric
                  label="Predicted"
                  value={`${predictedMeals} meals`}
                />

                <OperationMetric
                  label="Prepared"
                  value={`${preparedMeals} meals`}
                />

                <OperationMetric
                  label="Served"
                  value={`${servedMeals} meals`}
                />

                <OperationMetric
                  label="Remaining"
                  value={`${remainingMeals} meals`}
                  highlight
                />

              </div>

              <div
                className={`detection-panel ${
                  surplusDetected
                    ? "detected"
                    : "not-detected"
                }`}
              >

                <div className="detection-icon">

                  {surplusDetected ? (
                    <CheckCircle2
                      size={21}
                    />
                  ) : (
                    <AlertCircle
                      size={21}
                    />
                  )}

                </div>

                <div className="detection-copy">

                  <strong>
                    {surplusDetected
                      ? "Surplus detected"
                      : "No qualifying surplus"}
                  </strong>

                  <p>
                    {surplusDetected
                      ? `${remainingMeals} meals remain and can be redirected to a nearby community partner.`
                      : `At least ${SURPLUS_THRESHOLD + 1} meals must remain before a rescue event can be created.`}
                  </p>

                </div>

                <div className="detection-badge">

                  {surplusDetected
                    ? "RESCUE READY"
                    : "MONITORING"}

                </div>

              </div>

              {!surplusEvent && (
                <button
                  className="primary-rescue-button"
                  onClick={
                    handleCreateSurplus
                  }
                  disabled={
                    creatingSurplus ||
                    !surplusDetected
                  }
                >

                  {creatingSurplus ? (
                    <>
                      <RefreshCw
                        size={16}
                        className="spin"
                      />

                      Creating rescue event...
                    </>
                  ) : (
                    <>
                      <PackageCheck
                        size={16}
                      />

                      Create Surplus Event

                      <ArrowRight
                        size={15}
                      />
                    </>
                  )}

                </button>
              )}

              {surplusEvent && (
                <div className="event-created">

                  <div className="event-created-icon">
                    <CheckCircle2
                      size={17}
                    />
                  </div>

                  <div>
                    <strong>
                      Surplus event created
                    </strong>

                    <span>
                      Event ID:{" "}
                      {surplusEvent.id}
                    </span>
                  </div>

                  <Check
                    size={17}
                  />

                </div>
              )}

            </div>

            {/* ---------------------------------------------
                STEP 02
                --------------------------------------------- */}

            <div className="rescue-card">

              <CardHeader
                step="02"
                title="Find the right NGO"
                description="Choose a nearby community partner. NGOs can receive part or all of the surplus based on their available capacity."
                icon={
                  <Users
                    size={18}
                  />
                }
              />

              {!surplusEvent ? (
                <LockedState
                  icon={
                    <ShieldCheck
                      size={23}
                    />
                  }
                  title="NGO selection locked"
                  text="Create the surplus event first to activate the rescue network."
                />
              ) : (
                <div className="ngo-grid">

                  {DEMO_NGOS.map(
                    (ngo) => {

                      /*
                       * Partial pickup is supported.
                       * An NGO can be selected even when
                       * its capacity is smaller than the
                       * total surplus.
                       */

                      const canHandle =
                        Number(
                          ngo.capacity || 0
                        ) > 0;

                      const pickupForNgo =
                        Math.min(
                          remainingMeals,
                          Number(
                            ngo.capacity || 0
                          )
                        );

                      const selected =
                        selectedNgo?.id ===
                        ngo.id;

                      return (
                        <button
                          key={ngo.id}
                          type="button"
                          className={`ngo-option ${
                            selected
                              ? "selected"
                              : ""
                          } ${
                            !canHandle
                              ? "disabled"
                              : ""
                          }`}
                          onClick={() =>
                            canHandle &&
                            handleSelectNgo(
                              ngo
                            )
                          }
                          disabled={
                            !canHandle
                          }
                        >

                          <div className="ngo-option-top">

                            <div className="ngo-avatar">
                              <HeartHandshake
                                size={18}
                              />
                            </div>

                            <div className="ngo-name">

                              <strong>
                                {ngo.name}
                              </strong>

                              <span>
                                Community partner
                              </span>

                            </div>

                            <div
                              className={`ngo-radio ${
                                selected
                                  ? "checked"
                                  : ""
                              }`}
                            >
                              {selected && (
                                <Check
                                  size={12}
                                />
                              )}
                            </div>

                          </div>

                          <div className="ngo-meta">

                            <span>
                              <MapPin
                                size={12}
                              />

                              {ngo.distance}
                            </span>

                            <span>
                              <PackageCheck
                                size={12}
                              />

                              {ngo.capacity} meals
                            </span>

                            <span>
                              <Clock3
                                size={12}
                              />

                              {ngo.responseTime}
                            </span>

                          </div>

                          <div className="ngo-capacity">

                            <div>

                              <span>
                                CAPACITY
                              </span>

                              <strong>
                                {ngo.capacity} meals
                              </strong>

                            </div>

                            <span
                              className={
                                canHandle
                                  ? "capacity-ok"
                                  : "capacity-bad"
                              }
                            >
                              {canHandle
                                ? `Can receive ${pickupForNgo}`
                                : "Unavailable"}
                            </span>

                          </div>

                          {selected && (
                            <div className="ngo-selected-banner">

                              <CheckCircle2
                                size={13}
                              />

                              NGO selected · pickup{" "}
                              {pickupForNgo} meals

                            </div>
                          )}

                        </button>
                      );
                    }
                  )}

                </div>
              )}

            </div>

            {/* ---------------------------------------------
                STEP 03
                --------------------------------------------- */}

            <div className="rescue-card">

              <CardHeader
                step="03"
                title="Pickup intelligence"
                description="Everything the pickup partner needs before arriving at the canteen."
                icon={
                  <Truck
                    size={18}
                  />
                }
              />

              <div className="pickup-grid">

                <PickupItem
                  icon={
                    <MapPin
                      size={15}
                    />
                  }
                  label="Pickup location"
                  value={
                    pickupLocation
                  }
                />

                <PickupItem
                  icon={
                    <Clock3
                      size={15}
                    />
                  }
                  label="Shelf life"
                  value={
                    formattedShelfLife
                  }
                />

                <PickupItem
                  icon={
                    <PackageCheck
                      size={15}
                    />
                  }
                  label="Available surplus"
                  value={`${remainingMeals} meals`}
                />

                <PickupItem
                  icon={
                    <Truck
                      size={15}
                    />
                  }
                  label="NGO pickup"
                  value={
                    selectedNgo
                      ? `${pickupMeals} meals`
                      : "Select NGO"
                  }
                />

                <PickupItem
                  icon={
                    <Users
                      size={15}
                    />
                  }
                  label="Selected NGO"
                  value={
                    selectedNgo?.name ||
                    "Not selected"
                  }
                />

              </div>

              <div className="pickup-alert">

                <div>
                  <Clock3
                    size={15}
                  />
                </div>

                <p>
                  Food rescue is time-sensitive.
                  The selected NGO should collect
                  the meals within the displayed
                  shelf-life window.
                </p>

              </div>

            </div>

            {/* ---------------------------------------------
                STEP 04
                --------------------------------------------- */}

            <div className="rescue-card">

              <CardHeader
                step="04"
                title="Send pickup notification"
                description="Create the donation request and move the rescue into tracking."
                icon={
                  <Send
                    size={18}
                  />
                }
              />

              {!selectedNgo ? (
                <LockedState
                  icon={
                    <Send
                      size={22}
                    />
                  }
                  title="Waiting for NGO selection"
                  text="Select an NGO above to prepare the pickup notification."
                />
              ) : (
                <div className="notification-preview">

                  <div className="notification-preview-icon">
                    <Send
                      size={19}
                    />
                  </div>

                  <div className="notification-preview-content">

                    <span>
                      PICKUP REQUEST READY
                    </span>

                    <strong>
                      Notify{" "}
                      {selectedNgo.name}
                    </strong>

                    <p>
                      {pickupMeals} meals
                      will be picked up from{" "}
                      {pickupLocation}.
                      Estimated NGO response:{" "}
                      {
                        selectedNgo.responseTime
                      }.
                      {remainingAfterPickup > 0 && (
                        <>
                          {" "}
                          {remainingAfterPickup} meals will remain
                          available for another rescue partner.
                        </>
                      )}
                    </p>

                    <div className="notification-phone">

                      <Phone
                        size={13}
                      />

                      {selectedNgo.phone}

                    </div>

                  </div>

                  <div className="notification-ready">

                    <span />

                    READY

                  </div>

                </div>
              )}

              <button
                className="primary-rescue-button notification-button"
                onClick={
                  handleSendNotification
                }
                disabled={
                  sendingDonation ||
                  !surplusEvent ||
                  !selectedNgo ||
                  Boolean(donation) ||
                  !selectedNgoCanHandle
                }
              >

                {sendingDonation ? (
                  <>
                    <RefreshCw
                      size={16}
                      className="spin"
                    />

                    Creating donation request...
                  </>
                ) : donation ? (
                  <>
                    <CheckCircle2
                      size={16}
                    />

                    Pickup Request Created

                    <ArrowRight
                      size={15}
                    />
                  </>
                ) : (
                  <>
                    <Send
                      size={16}
                    />

                    Send Pickup Notification
                    {selectedNgo &&
                      ` · ${pickupMeals} meals`}

                    <ArrowRight
                      size={15}
                    />
                  </>
                )}

              </button>

            </div>

          </div>

          {/* =================================================
              RIGHT SIDEBAR
              ================================================= */}

          <aside className="food-rescue-sidebar">

            {/* ---------------------------------------------
                RESCUE SUMMARY
                --------------------------------------------- */}

            <div className="rescue-summary-card">

              <div className="summary-card-top">

                <div>

                  <span>
                    LIVE RESCUE
                  </span>

                  <h3>
                    Rescue summary
                  </h3>

                </div>

                <div className="summary-live-dot">
                  <span />
                </div>

              </div>

              <div className="summary-big-number">

                {remainingMeals}

                <small>
                  meals
                </small>

              </div>

              <p>
                potential food diverted
                from waste
              </p>

              <div className="summary-divider" />

              <SummaryRow
                label="Threshold"
                value={`>${SURPLUS_THRESHOLD}`}
              />

              <SummaryRow
                label="Prepared"
                value={
                  preparedMeals
                }
              />

              <SummaryRow
                label="Served"
                value={
                  servedMeals
                }
              />

              <SummaryRow
                label="Remaining"
                value={
                  remainingMeals
                }
              />

              <SummaryRow
                label="Status"
                value={
                  donation
                    ? "Pickup Requested"
                    : surplusEvent
                    ? "Event Created"
                    : surplusDetected
                    ? "Ready"
                    : "No Surplus"
                }
                highlight={
                  surplusDetected
                }
              />

            </div>

            {/* ---------------------------------------------
                PROGRESS
                --------------------------------------------- */}

            <div className="rescue-progress-card">

              <div className="sidebar-card-heading">

                <div>

                  <span>
                    RESCUE PROGRESS
                  </span>

                  <strong>
                    Workflow completion
                  </strong>

                </div>

                <b>
                  {rescueProgress}%
                </b>

              </div>

              <div className="rescue-progress-track">

                <div
                  className="rescue-progress-fill"
                  style={{
                    width: `${rescueProgress}%`,
                  }}
                />

              </div>

              <div className="sidebar-workflow">

                <SidebarWorkflowStep
                  number="01"
                  title="Surplus detected"
                  done={
                    surplusDetected
                  }
                />

                <SidebarWorkflowStep
                  number="02"
                  title="Event recorded"
                  done={
                    Boolean(
                      surplusEvent
                    )
                  }
                />

                <SidebarWorkflowStep
                  number="03"
                  title="NGO selected"
                  done={
                    Boolean(
                      selectedNgo
                    )
                  }
                />

                <SidebarWorkflowStep
                  number="04"
                  title="Pickup requested"
                  done={
                    Boolean(
                      donation
                    )
                  }
                />

              </div>

            </div>

            {/* ---------------------------------------------
                SELECTED NGO
                --------------------------------------------- */}

            <div className="selected-ngo-card">

              <div className="sidebar-card-heading">

                <div>

                  <span>
                    PICKUP PARTNER
                  </span>

                  <strong>
                    Selected NGO
                  </strong>

                </div>

                <Users
                  size={16}
                />

              </div>

              {selectedNgo ? (
                <>

                  <div className="selected-ngo-main">

                    <div className="selected-ngo-avatar">
                      <HeartHandshake
                        size={18}
                      />
                    </div>

                    <div>

                      <strong>
                        {selectedNgo.name}
                      </strong>

                      <span>
                        {selectedNgo.distance}
                        {" · "}
                        {
                          selectedNgo.responseTime
                        }
                      </span>

                    </div>

                  </div>

                  <div className="selected-ngo-detail">

                    <MapPin
                      size={13}
                    />

                    <span>
                      {pickupLocation}
                    </span>

                  </div>

                  <div className="selected-ngo-detail">

                    <Phone
                      size={13}
                    />

                    <span>
                      {selectedNgo.phone}
                    </span>

                  </div>

                  <div className="selected-ngo-detail">

                    <PackageCheck
                      size={13}
                    />

                    <span>
                      Pickup quantity:{" "}
                      {pickupMeals} meals
                    </span>

                  </div>

                  {remainingAfterPickup > 0 && (
                    <div className="selected-ngo-detail">

                      <PackageCheck
                        size={13}
                      />

                      <span>
                        Remaining after pickup:{" "}
                        {remainingAfterPickup} meals
                      </span>

                    </div>
                  )}

                </>
              ) : (
                <div className="empty-ngo">

                  <div>
                    <Users
                      size={19}
                    />
                  </div>

                  <strong>
                    No NGO selected
                  </strong>

                  <span>
                    Select a partner from the
                    rescue network.
                  </span>

                </div>
              )}

            </div>

            {/* ---------------------------------------------
                IMPACT PREVIEW
                --------------------------------------------- */}

            <div className="impact-preview-card">

              <div className="impact-preview-icon">

                <Sparkles
                  size={17}
                />

              </div>

              <div>

                <span>
                  POTENTIAL IMPACT
                </span>

                <strong>
                  {estimatedWeight} kg food available for rescue
                </strong>

                <p>
                  ≈ {estimatedPeopleHelped} meals
                  can reach the community
                </p>

              </div>

            </div>

          </aside>

        </section>

        {/* =================================================
            FINAL IMPACT BANNER
            ================================================= */}

        <section className="rescue-impact-banner">

          <div className="impact-banner-content">

            <div className="impact-banner-icon">

              <Leaf
                size={24}
              />

            </div>

            <div>

              <span>
                REFEED IMPACT LOOP
              </span>

              <h2>
                One surplus meal can become
                one rescued meal.
              </h2>

              <p>
                Predict demand → prepare accurately
                → serve → rescue surplus → measure
                the impact.
              </p>

            </div>

          </div>

          <div className="impact-banner-metrics">

            <ImpactMetric
              value={
                remainingMeals
              }
              label="Meals available"
            />

            <ImpactMetric
              value={
                selectedNgo
                  ? `${pickupMeals}`
                  : "—"
              }
              label="NGO pickup meals"
            />

            <ImpactMetric
              value={`${estimatedWeight} kg`}
              label="Food saved"
            />

            <ImpactMetric
              value={`${estimatedCo2} kg`}
              label="CO₂ avoided*"
            />

          </div>

        </section>

        {/* =================================================
            BOTTOM ACTIONS
            ================================================= */}

        <section className="rescue-bottom-actions">

          <button
            className="secondary-rescue-button"
            onClick={handleBack}
          >

            <ArrowLeft
              size={15}
            />

            Meal Operations

          </button>

          <div>

            <button
              className="secondary-rescue-button"
              onClick={() =>
                navigate("/impact")
              }
            >

              View Impact Dashboard

              <ArrowRight
                size={15}
              />

            </button>

            {donation && (
              <button
                className="primary-rescue-button bottom-primary"
                onClick={() =>
                  navigate(
                    "/donations",
                    {
                      state: {
                        donationId:
                          donation.id,
                      },
                    }
                  )
                }
              >

                Track Donation

                <ArrowRight
                  size={15}
                />

              </button>
            )}

          </div>

        </section>

      </main>

    </div>
  );
}

/* =========================================================
   COMPONENTS
   ========================================================= */

function CardHeader({
  step,
  title,
  description,
  icon,
}) {
  return (
    <div className="rescue-card-header">

      <div className="card-header-left">

        <div className="card-step">
          STEP {step}
        </div>

        <h3>
          {title}
        </h3>

        <p>
          {description}
        </p>

      </div>

      <div className="card-header-icon">
        {icon}
      </div>

    </div>
  );
}

function OperationMetric({
  label,
  value,
  highlight = false,
}) {
  return (
    <div
      className={`operation-metric ${
        highlight
          ? "highlight"
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

function LockedState({
  icon,
  title,
  text,
}) {
  return (
    <div className="locked-state">

      <div className="locked-state-icon">
        {icon}
      </div>

      <strong>
        {title}
      </strong>

      <p>
        {text}
      </p>

    </div>
  );
}

function PickupItem({
  icon,
  label,
  value,
}) {
  return (
    <div className="pickup-item">

      <div className="pickup-item-icon">
        {icon}
      </div>

      <div>

        <span>
          {label}
        </span>

        <strong>
          {value}
        </strong>

      </div>

    </div>
  );
}

function SummaryRow({
  label,
  value,
  highlight = false,
}) {
  return (
    <div
      className={`summary-row ${
        highlight
          ? "highlight"
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

function FlowStep({
  number,
  title,
  active = false,
  done = false,
}) {
  return (
    <div
      className={`flow-step ${
        active
          ? "active"
          : ""
      } ${
        done
          ? "done"
          : ""
      }`}
    >

      <div className="flow-number">

        {done ? (
          <Check
            size={12}
          />
        ) : (
          number
        )}

      </div>

      <span>
        {title}
      </span>

    </div>
  );
}

function FlowLine({
  active = false,
}) {
  return (
    <div
      className={`flow-line ${
        active
          ? "active"
          : ""
      }`}
    />
  );
}

function SidebarWorkflowStep({
  number,
  title,
  done,
}) {
  return (
    <div
      className={`sidebar-workflow-step ${
        done
          ? "done"
          : ""
      }`}
    >

      <div className="sidebar-workflow-number">

        {done ? (
          <Check
            size={11}
          />
        ) : (
          number
        )}

      </div>

      <span>
        {title}
      </span>

    </div>
  );
}

function ImpactMetric({
  value,
  label,
}) {
  return (
    <div className="impact-banner-metric">

      <strong>
        {value}
      </strong>

      <span>
        {label}
      </span>

    </div>
  );
}