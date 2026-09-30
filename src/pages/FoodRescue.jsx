import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  HeartHandshake,
  MapPin,
  PackageCheck,
  Phone,
  RefreshCw,
  Send,
  ShieldCheck,
  Truck,
  Users,
} from "lucide-react";

import {
  createSurplusEvent,
  calculateRemainingMeals,
  isSurplus,
  SURPLUS_THRESHOLD,
} from "../services/surplusService";

import { createDonation } from "../services/donationService";

import "./FoodRescue.css";

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

export default function FoodRescue() {
  const location = useLocation();
  const navigate = useNavigate();

  const rescueData = location.state || {};

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

          prepared: preparedMeals,

          served: servedMeals,

          dayType,

          campusPopulation,

          location: pickupLocation,

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
      remainingMeals >
      Number(selectedNgo.capacity || 0)
    ) {
      setError(
        `${selectedNgo.name} can currently handle ${selectedNgo.capacity} meals, but ${remainingMeals} meals are available.`
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

          surplusMeals:
            remainingMeals,

          pickupLocation,

          shelfLife: `${Math.round(
            shelfLifeMinutes / 60
          )} hours`,

          shelfLifeMinutes,

          ngo: selectedNgo,

          status: "Pickup Pending",

          notes:
            "Surplus generated from campus canteen meal operations.",
        });

      setDonation(result);

      setSuccessMessage(
        `${selectedNgo.name} has been notified for pickup.`
      );

      navigate("/donations", {
        state: {
          donationId: result.id,
          surplusEventId:
            surplusEvent.id,

          date,
          mealType,
          predictedMeals,
          preparedMeals,
          servedMeals,
          surplusMeals:
            remainingMeals,

          pickupLocation,
          shelfLifeMinutes,

          ngo: selectedNgo,
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

  const handleBack = () => {
    navigate("/meal-operations", {
      state: {
        date,
        mealType,
        predictedMeals,
        cookedMeals: preparedMeals,
        servedMeals,
        dayType,
        campusPopulation,
      },
    });
  };

  return (
    <div className="food-rescue-page">
      {/* Header */}
      <header className="food-rescue-header">
        <div className="food-rescue-header-inner">
          <button
            className="food-rescue-back"
            onClick={handleBack}
          >
            <ArrowLeft size={16} />
            Meal Operations
          </button>

          <div className="food-rescue-title">
            <div className="food-rescue-title-icon">
              <HeartHandshake size={21} />
            </div>

            <div>
              <h1>
                Food Rescue
              </h1>

              <p>
                Convert surplus meals into
                community donations.
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="food-rescue-container">
        {/* Error */}
        {error && (
          <div className="food-rescue-alert error">
            <AlertCircle size={18} />

            <div>
              <strong>
                Action required
              </strong>

              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Success */}
        {successMessage && (
          <div className="food-rescue-alert success">
            <CheckCircle2 size={18} />

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

        {/* Hero */}
        <section className="food-rescue-hero">
          <div>
            <span>
              SURPLUS FOOD DETECTION
            </span>

            <h2>
              Rescue meals before
              they become waste.
            </h2>

            <p>
              Identify unused meals, find
              a suitable NGO, and create a
              traceable pickup request.
            </p>
          </div>

          <div className="food-rescue-hero-stat">
            <strong>
              {remainingMeals}
            </strong>

            <span>
              meals available
            </span>
          </div>
        </section>

        {/* Operation summary */}
        <section className="food-rescue-grid">
          <div className="food-rescue-main">
            <div className="food-rescue-card">
              <div className="food-rescue-card-heading">
                <div>
                  <span>
                    STEP 01
                  </span>

                  <h3>
                    Surplus verification
                  </h3>
                </div>

                <PackageCheck
                  size={19}
                />
              </div>

              <div className="food-rescue-operation-grid">
                <InfoItem
                  label="Meal Date"
                  value={date}
                />

                <InfoItem
                  label="Meal Type"
                  value={mealType}
                />

                <InfoItem
                  label="Predicted"
                  value={`${predictedMeals} meals`}
                />

                <InfoItem
                  label="Prepared"
                  value={`${preparedMeals} meals`}
                />

                <InfoItem
                  label="Served"
                  value={`${servedMeals} meals`}
                />

                <InfoItem
                  label="Remaining"
                  value={`${remainingMeals} meals`}
                  highlight
                />
              </div>

              <div
                className={`surplus-detection ${
                  surplusDetected
                    ? "detected"
                    : "not-detected"
                }`}
              >
                {surplusDetected ? (
                  <>
                    <CheckCircle2
                      size={21}
                    />

                    <div>
                      <strong>
                        Surplus detected
                      </strong>

                      <p>
                        {remainingMeals} meals
                        remain, exceeding the
                        {` ${SURPLUS_THRESHOLD}-meal `}
                        rescue threshold.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle
                      size={21}
                    />

                    <div>
                      <strong>
                        No qualifying surplus
                      </strong>

                      <p>
                        At least{" "}
                        {SURPLUS_THRESHOLD +
                          1}{" "}
                        meals must remain
                        before a rescue event
                        can be created.
                      </p>
                    </div>
                  </>
                )}
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
                      Creating event...
                    </>
                  ) : (
                    <>
                      <PackageCheck
                        size={16}
                      />
                      Create Surplus Event
                    </>
                  )}
                </button>
              )}

              {surplusEvent && (
                <div className="event-created">
                  <CheckCircle2
                    size={18}
                  />

                  <div>
                    <strong>
                      Surplus event created
                    </strong>

                    <span>
                      Event ID:{" "}
                      {surplusEvent.id}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* NGO selection */}
            <div className="food-rescue-card">
              <div className="food-rescue-card-heading">
                <div>
                  <span>
                    STEP 02
                  </span>

                  <h3>
                    Select NGO for pickup
                  </h3>
                </div>

                <Users size={19} />
              </div>

              {!surplusEvent ? (
                <div className="locked-section">
                  <ShieldCheck size={22} />

                  <p>
                    Create the surplus event
                    first to enable NGO
                    selection.
                  </p>
                </div>
              ) : (
                <div className="ngo-list">
                  {DEMO_NGOS.map((ngo) => {
                    const canHandle =
                      remainingMeals <=
                      Number(
                        ngo.capacity || 0
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
                            ? "capacity-warning"
                            : ""
                        }`}
                        onClick={() =>
                          canHandle &&
                          setSelectedNgo(
                            ngo
                          )
                        }
                        disabled={!canHandle}
                      >
                        <div className="ngo-option-icon">
                          <HeartHandshake
                            size={19}
                          />
                        </div>

                        <div className="ngo-option-content">
                          <strong>
                            {ngo.name}
                          </strong>

                          <div className="ngo-option-meta">
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
                              Capacity{" "}
                              {
                                ngo.capacity
                              }
                            </span>

                            <span>
                              <Clock3
                                size={12}
                              />
                              {
                                ngo.responseTime
                              }
                            </span>
                          </div>

                          {!canHandle && (
                            <small>
                              Insufficient
                              capacity for
                              this donation
                            </small>
                          )}
                        </div>

                        {selected && (
                          <CheckCircle2
                            className="ngo-selected-icon"
                            size={20}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Pickup */}
            <div className="food-rescue-card">
              <div className="food-rescue-card-heading">
                <div>
                  <span>
                    STEP 03
                  </span>

                  <h3>
                    Pickup information
                  </h3>
                </div>

                <Truck size={19} />
              </div>

              <div className="pickup-info-grid">
                <InfoItem
                  label="Pickup Location"
                  value={pickupLocation}
                  icon={
                    <MapPin size={15} />
                  }
                />

                <InfoItem
                  label="Shelf Life"
                  value={`${Math.round(
                    shelfLifeMinutes /
                      60
                  )} hours`}
                  icon={
                    <Clock3 size={15} />
                  }
                />

                <InfoItem
                  label="Available Meals"
                  value={`${remainingMeals} meals`}
                  icon={
                    <PackageCheck
                      size={15}
                    />
                  }
                />

                <InfoItem
                  label="Selected NGO"
                  value={
                    selectedNgo?.name ||
                    "Not selected"
                  }
                  icon={
                    <Users size={15} />
                  }
                />
              </div>
            </div>

            {/* Notification */}
            <div className="food-rescue-card">
              <div className="food-rescue-card-heading">
                <div>
                  <span>
                    STEP 04
                  </span>

                  <h3>
                    Send pickup notification
                  </h3>
                </div>

                <Send size={19} />
              </div>

              {!selectedNgo ? (
                <div className="locked-section">
                  <Send size={22} />

                  <p>
                    Select an eligible NGO
                    before sending the
                    pickup notification.
                  </p>
                </div>
              ) : (
                <div className="notification-preview">
                  <div className="notification-icon">
                    <Send size={19} />
                  </div>

                  <div className="notification-content">
                    <strong>
                      Ready to notify{" "}
                      {selectedNgo.name}
                    </strong>

                    <p>
                      {remainingMeals} meals
                      are ready for pickup at{" "}
                      {pickupLocation}.
                      Expected response:{" "}
                      {
                        selectedNgo.responseTime
                      }.
                    </p>

                    <div className="notification-contact">
                      <Phone size={13} />
                      {
                        selectedNgo.phone
                      }
                    </div>
                  </div>
                </div>
              )}

              <button
                className="primary-rescue-button send-button"
                onClick={
                  handleSendNotification
                }
                disabled={
                  sendingDonation ||
                  !surplusEvent ||
                  !selectedNgo ||
                  Boolean(donation)
                }
              >
                {sendingDonation ? (
                  <>
                    <RefreshCw
                      size={16}
                      className="spin"
                    />
                    Sending notification...
                  </>
                ) : donation ? (
                  <>
                    <CheckCircle2
                      size={16}
                    />
                    Notification Sent
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Send Pickup Notification
                    <ArrowRight
                      size={15}
                    />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="food-rescue-sidebar">
            <div className="rescue-summary-card">
              <span>
                RESCUE SUMMARY
              </span>

              <strong>
                {remainingMeals}
              </strong>

              <small>
                surplus meals
              </small>

              <div className="summary-divider" />

              <SummaryRow
                label="Threshold"
                value={`>${SURPLUS_THRESHOLD}`}
              />

              <SummaryRow
                label="Prepared"
                value={preparedMeals}
              />

              <SummaryRow
                label="Served"
                value={servedMeals}
              />

              <SummaryRow
                label="Status"
                value={
                  surplusEvent
                    ? "Event Created"
                    : surplusDetected
                      ? "Ready"
                      : "No Surplus"
                }
              />
            </div>

            <div className="rescue-workflow-card">
              <span>
                RESCUE WORKFLOW
              </span>

              <WorkflowStep
                number="01"
                title="Detect"
                active
                done={surplusDetected}
              />

              <WorkflowStep
                number="02"
                title="Create Event"
                active={Boolean(
                  surplusEvent
                )}
                done={Boolean(
                  surplusEvent
                )}
              />

              <WorkflowStep
                number="03"
                title="Select NGO"
                active={Boolean(
                  selectedNgo
                )}
                done={Boolean(
                  selectedNgo
                )}
              />

              <WorkflowStep
                number="04"
                title="Notify"
                active={Boolean(
                  donation
                )}
                done={Boolean(
                  donation
                )}
              />
            </div>

            <div className="rescue-info-card">
              <ShieldCheck size={19} />

              <div>
                <strong>
                  Traceable rescue
                </strong>

                <p>
                  Every surplus event and
                  donation is stored in
                  Firebase for impact
                  reporting.
                </p>
              </div>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}

function InfoItem({
  label,
  value,
  highlight = false,
  icon = null,
}) {
  return (
    <div
      className={
        highlight
          ? "info-item highlight"
          : "info-item"
      }
    >
      {icon && (
        <div className="info-item-icon">
          {icon}
        </div>
      )}

      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
}) {
  return (
    <div className="summary-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function WorkflowStep({
  number,
  title,
  active,
  done,
}) {
  return (
    <div
      className={`workflow-step ${
        active ? "active" : ""
      } ${done ? "done" : ""}`}
    >
      <div className="workflow-number">
        {done ? (
          <CheckCircle2 size={15} />
        ) : (
          number
        )}
      </div>

      <span>{title}</span>
    </div>
  );
}