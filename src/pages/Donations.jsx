import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock3,
  HeartHandshake,
  MapPin,
  PackageCheck,
  Phone,
  RefreshCw,
  Truck,
  UserRound,
} from "lucide-react";

import {
  getDonation,
  updateDonationStatus,
} from "../services/donationService";

import "./Donations.css";

const STATUS_FLOW = [
  "Pickup Pending",
  "Pickup In Progress",
  "Picked Up",
  "Completed",
];

const STATUS_DESCRIPTIONS = {
  "Pickup Pending":
    "Waiting for the NGO to confirm and begin pickup.",

  "Pickup In Progress":
    "The NGO pickup is currently in progress.",

  "Picked Up":
    "The NGO has collected the rescued meals.",

  Completed:
    "The rescue process has been completed successfully.",
};

const FALLBACK_DONATION = {
  id: null,

  date: new Date()
    .toISOString()
    .split("T")[0],

  meal_type: "Lunch",

  predicted_meals: 596,

  prepared_meals: 626,

  served_meals: 580,

  surplus_meals: 46,

  pickup_location:
    "Main Campus Canteen",

  shelf_life: "2 hours",

  shelf_life_minutes: 120,

  status: "Pickup Pending",

  ngo: {
    id: "ngo-helping-hands",
    name: "Helping Hands",
    distance: "1.8 km",
    distanceKm: 1.8,
    capacity: 120,
    phone: "+91 98765 43210",
    responseTime: "15–20 min",
  },
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const formatDate = (dateValue) => {
  if (!dateValue) {
    return "—";
  }

  const date = new Date(
    `${dateValue}T00:00:00`
  );

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
};

const getStatusIndex = (status) => {
  const index =
    STATUS_FLOW.indexOf(status);

  return index >= 0 ? index : 0;
};

const getTimestampDate = (value) => {
  if (!value) {
    return null;
  }

  if (
    typeof value.toDate === "function"
  ) {
    return value.toDate();
  }

  if (value instanceof Date) {
    return value;
  }

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime())
    ? null
    : parsed;
};

const formatTimestamp = (value) => {
  const date =
    getTimestampDate(value);

  if (!date) {
    return "Not recorded";
  }

  return date.toLocaleString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
};

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function Donations() {
  const location = useLocation();
  const navigate = useNavigate();

  const incomingData =
    location.state || {};

  const incomingDonationId =
    incomingData.donationId ||
    incomingData.id ||
    null;

  const [donation, setDonation] =
    useState(
      incomingDonationId
        ? null
        : {
            ...FALLBACK_DONATION,
            ...incomingData,
          }
    );

  const [loading, setLoading] =
    useState(
      Boolean(incomingDonationId)
    );

  const [refreshing, setRefreshing] =
    useState(false);

  const [updatingStatus, setUpdatingStatus] =
    useState(false);

  const [error, setError] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  /* ------------------------------------------------------------------------ */
  /* Load donation                                                            */
  /* ------------------------------------------------------------------------ */

  const loadDonation = async (
    showRefresh = false
  ) => {
    if (!incomingDonationId) {
      return;
    }

    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const result =
        await getDonation(
          incomingDonationId
        );

      setDonation(result);
    } catch (loadError) {
      console.error(
        "Donation loading error:",
        loadError
      );

      setError(
        loadError?.message ||
          "Unable to load the donation record."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (incomingDonationId) {
      loadDonation();
    }
  }, [incomingDonationId]);

  /* ------------------------------------------------------------------------ */
  /* Derived values                                                           */
  /* ------------------------------------------------------------------------ */

  const currentStatus =
    donation?.status ||
    "Pickup Pending";

  const currentStatusIndex =
    getStatusIndex(
      currentStatus
    );

  const progressPercentage =
    Math.round(
      (currentStatusIndex /
        (STATUS_FLOW.length - 1)) *
        100
    );

  const ngo =
    donation?.ngo ||
    FALLBACK_DONATION.ngo;

  const formattedDate =
    formatDate(
      donation?.date
    );

  const surplusMeals =
    Number(
      donation?.surplus_meals
    ) || 0;

  const preparedMeals =
    Number(
      donation?.prepared_meals
    ) || 0;

  const servedMeals =
    Number(
      donation?.served_meals
    ) || 0;

  const isCompleted =
    currentStatus ===
    "Completed";

  /* ------------------------------------------------------------------------ */
  /* Update status                                                            */
  /* ------------------------------------------------------------------------ */

  const handleStatusUpdate =
    async (newStatus) => {
      if (!donation?.id) {
        setError(
          "This donation does not have a Firebase ID."
        );
        return;
      }

      if (
        newStatus ===
        currentStatus
      ) {
        return;
      }

      try {
        setUpdatingStatus(true);
        setError("");
        setSuccessMessage("");

        await updateDonationStatus({
          donationId:
            donation.id,

          status: newStatus,
        });

        /*
         * Reload the complete Firestore
         * document so timestamps and other
         * updated fields are reflected.
         */
        const updated =
          await getDonation(
            donation.id
          );

        setDonation(updated);

        setSuccessMessage(
          `Donation status updated to "${newStatus}".`
        );
      } catch (statusError) {
        console.error(
          "Donation status update error:",
          statusError
        );

        setError(
          statusError?.message ||
            "Unable to update the donation status."
        );
      } finally {
        setUpdatingStatus(false);
      }
    };

  /* ------------------------------------------------------------------------ */
  /* Navigation                                                               */
  /* ------------------------------------------------------------------------ */

  const handleBackToRescue = () => {
    navigate("/food-rescue", {
      state: {
        date:
          donation?.date,

        mealType:
          donation?.meal_type ||
          "Lunch",

        predictedMeals:
          donation?.predicted_meals ||
          0,

        cookedMeals:
          preparedMeals,

        preparedMeals,

        servedMeals,

        surplusMeals:
          surplusMeals,

        pickupLocation:
          donation?.pickup_location ||
          "Main Campus Canteen",

        shelfLife:
          donation?.shelf_life ||
          "2 hours",

        shelfLifeMinutes:
          donation?.shelf_life_minutes ||
          120,

        ngo,

        surplusEventId:
          donation?.surplus_event_id,

        donationId:
          donation?.id,

        status:
          currentStatus,

        notificationSent: true,
      },
    });
  };

  /* ------------------------------------------------------------------------ */
  /* Loading state                                                            */
  /* ------------------------------------------------------------------------ */

  if (loading) {
    return (
      <div className="donations-page">
        <div className="donations-loading">
          <div className="donations-loading-icon">
            <RefreshCw
              size={24}
              className="spin"
            />
          </div>

          <h2>
            Loading donation
          </h2>

          <p>
            Fetching the rescue record
            from Firebase...
          </p>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Render                                                                   */
  /* ------------------------------------------------------------------------ */

  return (
    <div className="donations-page">
      {/* ================================================================== */}
      {/* HEADER                                                             */}
      {/* ================================================================== */}

      <header className="donations-header">
        <div className="donations-header-inner">
          <button
            className="donations-back"
            onClick={
              handleBackToRescue
            }
          >
            <ArrowLeft size={18} />

            Food Rescue
          </button>

          <div className="donations-title">
            <div className="donations-title-icon">
              <Truck size={21} />
            </div>

            <div>
              <h1>
                Donation Tracking
              </h1>

              <p>
                Monitor the NGO pickup and
                rescue progress.
              </p>
            </div>
          </div>

          {incomingDonationId && (
            <button
              className="donations-refresh"
              onClick={() =>
                loadDonation(true)
              }
              disabled={refreshing}
            >
              <RefreshCw
                size={16}
                className={
                  refreshing
                    ? "spin"
                    : ""
                }
              />

              Refresh
            </button>
          )}
        </div>
      </header>

      <main className="donations-container">
        {/* ================================================================= */}
        {/* ERROR                                                             */}
        {/* ================================================================= */}

        {error && (
          <div className="donation-alert error">
            <AlertCircle size={19} />

            <div>
              <strong>
                Unable to complete action
              </strong>

              <p>{error}</p>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* SUCCESS                                                           */}
        {/* ================================================================= */}

        {successMessage && (
          <div className="donation-alert success">
            <CheckCircle2 size={19} />

            <div>
              <strong>
                Updated successfully
              </strong>

              <p>
                {successMessage}
              </p>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* HERO                                                              */}
        {/* ================================================================= */}

        <section className="donation-hero">
          <div>
            <span>
              FOOD RESCUE DISPATCH
            </span>

            <h2>
              {surplusMeals} meals
              scheduled for rescue
            </h2>

            <p>
              {formattedDate} ·{" "}
              {donation?.meal_type ||
                "Lunch"}
            </p>
          </div>

          <div className="donation-status-pill">
            <Clock3 size={16} />

            {currentStatus}
          </div>
        </section>

        {/* ================================================================= */}
        {/* MAIN GRID                                                         */}
        {/* ================================================================= */}

        <div className="donations-grid">
          <div className="donations-main">
            {/* ============================================================= */}
            {/* PROGRESS                                                       */}
            {/* ============================================================= */}

            <section className="donation-card">
              <div className="donation-card-heading">
                <div>
                  <span>
                    PICKUP TRACKING
                  </span>

                  <h3>
                    Rescue Progress
                  </h3>
                </div>

                <Truck size={21} />
              </div>

              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{
                    width: `${progressPercentage}%`,
                  }}
                />
              </div>

              <div className="status-timeline">
                {STATUS_FLOW.map(
                  (
                    status,
                    index
                  ) => {
                    const completed =
                      index <=
                      currentStatusIndex;

                    const active =
                      status ===
                      currentStatus;

                    return (
                      <div
                        className={`timeline-item ${
                          completed
                            ? "completed"
                            : ""
                        } ${
                          active
                            ? "active"
                            : ""
                        }`}
                        key={status}
                      >
                        <div className="timeline-dot">
                          {completed ? (
                            <CheckCircle2
                              size={17}
                            />
                          ) : (
                            index + 1
                          )}
                        </div>

                        <span>
                          {status}
                        </span>
                      </div>
                    );
                  }
                )}
              </div>

              <div className="current-status-description">
                <Clock3 size={16} />

                <span>
                  {
                    STATUS_DESCRIPTIONS[
                      currentStatus
                    ]
                  }
                </span>
              </div>
            </section>

            {/* ============================================================= */}
            {/* NGO                                                            */}
            {/* ============================================================= */}

            <section className="donation-card">
              <div className="donation-card-heading">
                <div>
                  <span>
                    NGO PARTNER
                  </span>

                  <h3>
                    {ngo.name ||
                      "NGO Partner"}
                  </h3>
                </div>

                <HeartHandshake
                  size={21}
                />
              </div>

              <div className="ngo-profile">
                <div className="ngo-profile-icon">
                  <HeartHandshake
                    size={25}
                  />
                </div>

                <div className="ngo-profile-info">
                  <strong>
                    {ngo.name ||
                      "NGO Partner"}
                  </strong>

                  <span>
                    Registered food rescue
                    partner
                  </span>
                </div>
              </div>

              <div className="ngo-contact-grid">
                <div>
                  <MapPin size={17} />

                  <span>
                    Distance

                    <strong>
                      {ngo.distance ||
                        `${ngo.distanceKm || 0} km`}
                    </strong>
                  </span>
                </div>

                <div>
                  <Phone size={17} />

                  <span>
                    Phone

                    <strong>
                      {ngo.phone ||
                        "Not available"}
                    </strong>
                  </span>
                </div>

                <div>
                  <Clock3 size={17} />

                  <span>
                    Response time

                    <strong>
                      {ngo.responseTime ||
                        "—"}
                    </strong>
                  </span>
                </div>
              </div>
            </section>

            {/* ============================================================= */}
            {/* PICKUP DETAILS                                                 */}
            {/* ============================================================= */}

            <section className="donation-card">
              <div className="donation-card-heading">
                <div>
                  <span>
                    PICKUP DETAILS
                  </span>

                  <h3>
                    Rescue Information
                  </h3>
                </div>

                <PackageCheck
                  size={21}
                />
              </div>

              <div className="pickup-detail-grid">
                <div>
                  <MapPin size={18} />

                  <span>
                    Pickup Location

                    <strong>
                      {donation?.pickup_location ||
                        "Main Campus Canteen"}
                    </strong>
                  </span>
                </div>

                <div>
                  <PackageCheck
                    size={18}
                  />

                  <span>
                    Rescue Quantity

                    <strong>
                      {surplusMeals} meals
                    </strong>
                  </span>
                </div>

                <div>
                  <Clock3 size={18} />

                  <span>
                    Shelf Life

                    <strong>
                      {donation?.shelf_life ||
                        "2 hours"}
                    </strong>
                  </span>
                </div>

                <div>
                  <UserRound size={18} />

                  <span>
                    Recipient

                    <strong>
                      {ngo.name ||
                        "NGO Partner"}
                    </strong>
                  </span>
                </div>
              </div>
            </section>

            {/* ============================================================= */}
            {/* MEAL SUMMARY                                                   */}
            {/* ============================================================= */}

            <section className="donation-card">
              <div className="donation-card-heading">
                <div>
                  <span>
                    MEAL OPERATIONS
                  </span>

                  <h3>
                    Source Meal Summary
                  </h3>
                </div>

                <PackageCheck
                  size={21}
                />
              </div>

              <div className="meal-summary-grid">
                <div>
                  <span>
                    Predicted
                  </span>

                  <strong>
                    {Number(
                      donation?.predicted_meals
                    ) || 0}
                  </strong>
                </div>

                <div>
                  <span>
                    Prepared
                  </span>

                  <strong>
                    {preparedMeals}
                  </strong>
                </div>

                <div>
                  <span>
                    Served
                  </span>

                  <strong>
                    {servedMeals}
                  </strong>
                </div>

                <div className="highlight">
                  <span>
                    Rescued
                  </span>

                  <strong>
                    {surplusMeals}
                  </strong>
                </div>
              </div>
            </section>
          </div>

          {/* =============================================================== */}
          {/* SIDEBAR                                                         */}
          {/* =============================================================== */}

          <aside className="donations-sidebar">
            {/* ============================================================= */}
            {/* SUMMARY                                                        */}
            {/* ============================================================= */}

            <section className="donation-summary">
              <span>
                RESCUE SUMMARY
              </span>

              <strong>
                {surplusMeals}
              </strong>

              <small>
                meals redirected from waste
              </small>

              <div className="summary-line" />

              <div>
                <span>
                  Meal
                </span>

                <strong>
                  {donation?.meal_type ||
                    "Lunch"}
                </strong>
              </div>

              <div>
                <span>
                  Date
                </span>

                <strong>
                  {formattedDate}
                </strong>
              </div>

              <div>
                <span>
                  Status
                </span>

                <strong>
                  {currentStatus}
                </strong>
              </div>
            </section>

            {/* ============================================================= */}
            {/* STATUS CONTROL                                                 */}
            {/* ============================================================= */}

            <section className="status-control-card">
              <span>
                UPDATE STATUS
              </span>

              <h3>
                Pickup Management
              </h3>

              <p>
                Update the rescue stage as the
                NGO pickup progresses.
              </p>

              <div className="status-buttons">
                {STATUS_FLOW.map(
                  (status) => {
                    const selected =
                      currentStatus ===
                      status;

                    return (
                      <button
                        key={status}
                        className={
                          selected
                            ? "selected"
                            : ""
                        }
                        onClick={() =>
                          handleStatusUpdate(
                            status
                          )
                        }
                        disabled={
                          updatingStatus
                        }
                      >
                        {selected && (
                          <CheckCircle2
                            size={15}
                          />
                        )}

                        {status}
                      </button>
                    );
                  }
                )}
              </div>

              {updatingStatus && (
                <div className="status-updating">
                  <RefreshCw
                    size={15}
                    className="spin"
                  />

                  Updating Firebase...
                </div>
              )}
            </section>

            {/* ============================================================= */}
            {/* TIMESTAMPS                                                     */}
            {/* ============================================================= */}

            <section className="pickup-timestamps-card">
              <div className="sidebar-section-title">
                <span>
                  ACTIVITY
                </span>

                <Clock3 size={18} />
              </div>

              <div className="activity-item">
                <div className="activity-dot">
                  <Check size={13} />
                </div>

                <div>
                  <strong>
                    Donation created
                  </strong>

                  <span>
                    {formatTimestamp(
                      donation?.createdAt
                    )}
                  </span>
                </div>
              </div>

              <div className="activity-item">
                <div className="activity-dot">
                  <Truck size={13} />
                </div>

                <div>
                  <strong>
                    Pickup requested
                  </strong>

                  <span>
                    {formatTimestamp(
                      donation?.pickup_requested_at
                    )}
                  </span>
                </div>
              </div>

              <div className="activity-item">
                <div className="activity-dot">
                  <PackageCheck
                    size={13}
                  />
                </div>

                <div>
                  <strong>
                    Picked up
                  </strong>

                  <span>
                    {formatTimestamp(
                      donation?.picked_up_at
                    )}
                  </span>
                </div>
              </div>

              <div className="activity-item">
                <div className="activity-dot">
                  <CheckCircle2
                    size={13}
                  />
                </div>

                <div>
                  <strong>
                    Completed
                  </strong>

                  <span>
                    {formatTimestamp(
                      donation?.completed_at
                    )}
                  </span>
                </div>
              </div>
            </section>

            {/* ============================================================= */}
            {/* COMPLETED                                                      */}
            {/* ============================================================= */}

            {isCompleted && (
              <section className="completed-card">
                <CheckCircle2 size={24} />

                <div>
                  <strong>
                    Rescue Completed
                  </strong>

                  <p>
                    The rescued meals have
                    successfully completed the
                    pickup workflow.
                  </p>
                </div>
              </section>
            )}
          </aside>
        </div>

        {/* ================================================================= */}
        {/* BOTTOM ACTIONS                                                    */}
        {/* ================================================================= */}

        <section className="donation-bottom-actions">
          <button
            onClick={
              handleBackToRescue
            }
          >
            <ArrowLeft size={17} />

            Back to Food Rescue
          </button>

          <button
            className="impact-button"
            onClick={() =>
              navigate("/impact")
            }
          >
            View Impact Dashboard

            <CheckCircle2 size={17} />
          </button>
        </section>
      </main>
    </div>
  );
}