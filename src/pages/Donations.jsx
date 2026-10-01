import { useEffect, useMemo, useState } from "react";

import { useNavigate } from "react-router-dom";

import {
  collection,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";

import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock3,
  HeartHandshake,
  Loader2,
  MapPin,
  PackageCheck,
  Phone,
  RefreshCw,
  ShieldCheck,
  Truck,
  UserRound,
  XCircle,
} from "lucide-react";

import {
  getDonation,
  updateDonationStatus,
} from "../services/donationService";

import { db } from "../firebase/auth";

import "./Donations.css";


/* =========================================================
   STATUS FLOW
   ========================================================= */

const STATUS_FLOW = [
  "Pickup Pending",
  "NGO Accepted",
  "Pickup In Progress",
  "Picked Up",
  "Completed",
];


const STATUS_DESCRIPTIONS = {
  "Pickup Pending":
    "A new food rescue request is waiting for NGO confirmation.",

  "NGO Accepted":
    "The NGO has accepted the pickup request.",

  "Pickup In Progress":
    "The NGO is currently travelling to collect the rescued food.",

  "Picked Up":
    "The NGO has collected the rescued meals from the canteen.",

  Completed:
    "The food rescue process has been completed successfully.",
};


/* =========================================================
   DATE HELPERS
   ========================================================= */

const formatDate = (dateValue) => {
  if (!dateValue) {
    return "—";
  }

  const date = new Date(
    `${dateValue}T00:00:00`
  );

  if (Number.isNaN(date.getTime())) {
    return String(dateValue);
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


const getTimestampDate = (value) => {
  if (!value) {
    return null;
  }

  if (
    typeof value === "object" &&
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
  const date = getTimestampDate(value);

  if (!date) {
    return "Not recorded";
  }

  return date.toLocaleString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
};


/* =========================================================
   STATUS HELPERS
   ========================================================= */

const getStatusIndex = (status) => {
  const index =
    STATUS_FLOW.indexOf(status);

  return index >= 0 ? index : 0;
};


const normalizeDonation = (record) => {
  if (!record) {
    return null;
  }

  return {
    ...record,

    ngo:
      record.ngo || {
        name: "NGO Partner",
        phone: "Not available",
        distance: "—",
        capacity: 0,
        responseTime: "—",
      },

    checklist:
      record.checklist || {
        requestSent: true,
        ngoAccepted:
          record.accepted === true ||
          record.status === "NGO Accepted",

        pickupLocationConfirmed:
          false,

        mealsConfirmed:
          false,

        pickupStarted:
          record.status ===
          "Pickup In Progress",

        foodCollected:
          record.status ===
          "Picked Up" ||
          record.status === "Completed",

        completed:
          record.status === "Completed",
      },
  };
};


/* =========================================================
   MAIN NGO PAGE
   ========================================================= */

export default function Donations() {
  const navigate = useNavigate();


  /* =======================================================
     STATE
     ======================================================= */

  const [donations, setDonations] =
    useState([]);

  const [selectedDonationId, setSelectedDonationId] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [updatingStatus, setUpdatingStatus] =
    useState(false);

  const [error, setError] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const [notificationCount, setNotificationCount] =
    useState(0);


  /* =======================================================
     FIREBASE REAL-TIME LISTENER
     ======================================================= */

  useEffect(() => {
    setLoading(true);
    setError("");

    const donationsQuery = query(
      collection(db, "donations"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      donationsQuery,
      (snapshot) => {
        const records =
          snapshot.docs.map((item) =>
            normalizeDonation({
              id: item.id,
              ...item.data(),
            })
          );

        setDonations(records);

        /*
         * Automatically select newest request
         * when nothing is selected.
         */

        setSelectedDonationId(
          (previousId) => {
            if (
              previousId &&
              records.some(
                (item) =>
                  item.id === previousId
              )
            ) {
              return previousId;
            }

            return records[0]?.id || null;
          }
        );

        /*
         * Count unread/new requests.
         */

        const unread = records.filter(
          (item) =>
            item.notificationStatus ===
              "Unread" ||
            item.notificationRead === false ||
            item.status === "Pickup Pending"
        ).length;

        setNotificationCount(unread);

        setLoading(false);
        setRefreshing(false);
      },
      (firebaseError) => {
        console.error(
          "NGO Firebase listener error:",
          firebaseError
        );

        setError(
          firebaseError?.message ||
            "Unable to receive pickup notifications from Firebase."
        );

        setLoading(false);
        setRefreshing(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);


  /* =======================================================
     SELECTED DONATION
     ======================================================= */

  const donation = useMemo(() => {
    if (!selectedDonationId) {
      return null;
    }

    return (
      donations.find(
        (item) =>
          item.id === selectedDonationId
      ) || null
    );
  }, [
    donations,
    selectedDonationId,
  ]);


  /* =======================================================
     DERIVED DATA
     ======================================================= */

  const currentStatus =
    donation?.status ||
    "Pickup Pending";


  const currentStatusIndex =
    getStatusIndex(currentStatus);


  const progressPercentage =
    Math.round(
      (currentStatusIndex /
        (STATUS_FLOW.length - 1)) *
        100
    );


  const ngo =
    donation?.ngo || {
      name: "NGO Partner",
      phone: "Not available",
      distance: "—",
      capacity: 0,
      responseTime: "—",
    };


  const surplusMeals =
    Number(
      donation?.surplus_meals ??
        donation?.surplusMeals ??
        donation?.pickupMeals
    ) || 0;


  const totalSurplusMeals =
    Number(
      donation?.totalSurplusMeals ??
        donation?.total_surplus_meals ??
        surplusMeals
    ) || surplusMeals;


  const preparedMeals =
    Number(
      donation?.prepared_meals ??
        donation?.preparedMeals
    ) || 0;


  const servedMeals =
    Number(
      donation?.served_meals ??
        donation?.servedMeals
    ) || 0;


  const predictedMeals =
    Number(
      donation?.predicted_meals ??
        donation?.predictedMeals
    ) || 0;


  const pickupLocation =
    donation?.pickup_location ||
    donation?.pickupLocation ||
    "Main Campus Canteen";


  const shelfLife =
    donation?.shelf_life ||
    donation?.shelfLife ||
    "2 hours";


  const isPending =
    currentStatus ===
    "Pickup Pending";


  const isAccepted =
    currentStatus ===
      "NGO Accepted" ||
    currentStatus ===
      "Pickup In Progress" ||
    currentStatus ===
      "Picked Up" ||
    currentStatus ===
      "Completed";


  const isInProgress =
    currentStatus ===
    "Pickup In Progress";


  const isPickedUp =
    currentStatus ===
      "Picked Up" ||
    currentStatus ===
      "Completed";


  const isCompleted =
    currentStatus ===
    "Completed";


  /* =======================================================
     ACCEPT PICKUP
     ======================================================= */

  const handleAcceptPickup = async () => {
    if (!donation?.id) {
      setError(
        "No pickup request is selected."
      );

      return;
    }

    try {
      setUpdatingStatus(true);
      setError("");
      setSuccessMessage("");

      await updateDonationStatus({
        donationId:
          donation.id,

        status:
          "NGO Accepted",
      });

      setSuccessMessage(
        "Pickup accepted successfully. The canteen has been notified."
      );
    } catch (statusError) {
      console.error(
        "Accept pickup error:",
        statusError
      );

      setError(
        statusError?.message ||
          "Unable to accept this pickup request."
      );
    } finally {
      setUpdatingStatus(false);
    }
  };


  /* =======================================================
     UPDATE PICKUP STATUS
     ======================================================= */

  const handleStatusUpdate =
    async (newStatus) => {
      if (!donation?.id) {
        setError(
          "No pickup request is selected."
        );

        return;
      }

      if (
        newStatus ===
        currentStatus
      ) {
        return;
      }

      /*
       * Do not allow skipping NGO acceptance.
       */

      if (
        newStatus !==
          "NGO Accepted" &&
        currentStatus ===
          "Pickup Pending"
      ) {
        setError(
          "Please accept the pickup request first."
        );

        return;
      }

      try {
        setUpdatingStatus(true);
        setError("");
        setSuccessMessage("");

        await updateDonationStatus({
          donationId:
            donation.id,

          status:
            newStatus,
        });

        setSuccessMessage(
          `Pickup status updated to "${newStatus}".`
        );
      } catch (statusError) {
        console.error(
          "Status update error:",
          statusError
        );

        setError(
          statusError?.message ||
            "Unable to update pickup status."
        );
      } finally {
        setUpdatingStatus(false);
      }
    };


  /* =======================================================
     REFRESH
     ======================================================= */

  const handleRefresh = () => {
    /*
     * onSnapshot is already real-time.
     * This visual state simply tells the user
     * that Firebase is being checked.
     */

    setRefreshing(true);

    window.setTimeout(() => {
      setRefreshing(false);
    }, 700);
  };


  /* =======================================================
     SELECT REQUEST
     ======================================================= */

  const handleSelectRequest = (
    donationId
  ) => {
    setSelectedDonationId(
      donationId
    );

    setError("");
    setSuccessMessage("");
  };


  /* =======================================================
     NAVIGATION
     ======================================================= */

  const handleBack = () => {
    navigate("/dashboard");
  };


  /* =======================================================
     LOADING
     ======================================================= */

  if (loading) {
    return (
      <div className="donations-page">

        <div
          className="donations-loading"
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: "16px",
            padding: "30px",
          }}
        >

          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "22px",
              display: "grid",
              placeItems: "center",
              background:
                "rgba(16,185,129,0.12)",
              color: "#34d399",
            }}
          >
            <Loader2
              size={34}
              className="spin"
            />
          </div>

          <h2
            style={{
              fontSize: "28px",
              margin: 0,
            }}
          >
            NGO Dashboard
          </h2>

          <p
            style={{
              fontSize: "16px",
              margin: 0,
              opacity: 0.7,
            }}
          >
            Connecting to Firebase pickup
            notifications...
          </p>

        </div>

      </div>
    );
  }


  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <div className="donations-page">

      {/* =================================================
          HEADER
          ================================================= */}

      <header className="donations-header">

        <div className="donations-header-inner">

          <button
            className="donations-back"
            onClick={handleBack}
          >
            <ArrowLeft size={19} />

            Dashboard
          </button>


          <div className="donations-title">

            <div className="donations-title-icon">
              <HeartHandshake
                size={25}
              />
            </div>

            <div>

              <h1>
                NGO Food Rescue Center
              </h1>

              <p>
                Receive and manage campus
                food pickup requests.
              </p>

            </div>

          </div>


          <button
            className="donations-refresh"
            onClick={handleRefresh}
            disabled={refreshing}
          >

            <RefreshCw
              size={17}
              className={
                refreshing
                  ? "spin"
                  : ""
              }
            />

            Refresh

          </button>

        </div>

      </header>


      <main className="donations-container">

        {/* =================================================
            NOTIFICATION BANNER
            ================================================= */}

        {notificationCount > 0 && (
          <section
            style={{
              marginBottom: "24px",
              padding: "24px",
              borderRadius: "20px",
              border:
                "2px solid rgba(16,185,129,0.35)",
              background:
                "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(15,23,42,0.92))",
              boxShadow:
                "0 20px 60px rgba(0,0,0,0.20)",
              display: "flex",
              alignItems: "center",
              justifyContent:
                "space-between",
              gap: "20px",
              flexWrap: "wrap",
            }}
          >

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "18px",
              }}
            >

              <div
                style={{
                  width: "58px",
                  height: "58px",
                  borderRadius: "18px",
                  display: "grid",
                  placeItems: "center",
                  background:
                    "#10b981",
                  color: "#052e1c",
                  flexShrink: 0,
                }}
              >
                <HeartHandshake
                  size={29}
                />
              </div>

              <div>

                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: 800,
                    letterSpacing:
                      "0.12em",
                    color: "#6ee7b7",
                    marginBottom:
                      "5px",
                  }}
                >
                  NEW FOOD RESCUE REQUEST
                </div>

                <h2
                  style={{
                    fontSize:
                      "clamp(20px, 3vw, 30px)",
                    margin: 0,
                    color: "#ecfdf5",
                  }}
                >
                  {notificationCount} pickup
                  {notificationCount > 1
                    ? " requests"
                    : " request"}{" "}
                  waiting for you
                </h2>

                <p
                  style={{
                    margin:
                      "6px 0 0",
                    color:
                      "#a7f3d0",
                    fontSize: "15px",
                  }}
                >
                  Fresh surplus food is
                  available from a campus
                  canteen.
                </p>

              </div>

            </div>

            <div
              style={{
                padding:
                  "10px 16px",
                borderRadius: "999px",
                background:
                  "rgba(255,255,255,0.08)",
                color: "#d1fae5",
                fontSize: "14px",
                fontWeight: 700,
              }}
            >
              LIVE FROM FIREBASE
            </div>

          </section>
        )}


        {/* =================================================
            ERROR
            ================================================= */}

        {error && (
          <div
            className="donation-alert error"
            style={{
              fontSize: "15px",
              padding: "16px",
            }}
          >

            <AlertCircle
              size={21}
            />

            <div>

              <strong>
                Action required
              </strong>

              <p>
                {error}
              </p>

            </div>

          </div>
        )}


        {/* =================================================
            SUCCESS
            ================================================= */}

        {successMessage && (
          <div
            className="donation-alert success"
            style={{
              fontSize: "15px",
              padding: "16px",
            }}
          >

            <CheckCircle2
              size={21}
            />

            <div>

              <strong>
                Firebase updated
              </strong>

              <p>
                {successMessage}
              </p>

            </div>

          </div>
        )}


        {/* =================================================
            NO REQUEST
            ================================================= */}

        {!donation && (
          <section
            style={{
              minHeight: "430px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              padding: "40px 20px",
            }}
          >

            <div
              style={{
                maxWidth: "560px",
              }}
            >

              <div
                style={{
                  width: "90px",
                  height: "90px",
                  margin: "0 auto 24px",
                  borderRadius: "28px",
                  display: "grid",
                  placeItems: "center",
                  background:
                    "rgba(16,185,129,0.10)",
                  color: "#34d399",
                }}
              >
                <HeartHandshake
                  size={42}
                />
              </div>

              <h2
                style={{
                  fontSize:
                    "clamp(28px, 5vw, 42px)",
                  margin:
                    "0 0 12px",
                }}
              >
                No pickup requests
              </h2>

              <p
                style={{
                  fontSize: "17px",
                  lineHeight: 1.7,
                  opacity: 0.7,
                  margin: 0,
                }}
              >
                Your NGO is connected to
                Firebase. When a campus
                canteen sends surplus food
                for rescue, the request will
                appear here automatically.
              </p>

            </div>

          </section>
        )}


        {donation && (
          <>

            {/* =================================================
                REQUEST SELECTOR
                ================================================= */}

            {donations.length > 1 && (
              <section
                style={{
                  marginBottom: "24px",
                }}
              >

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent:
                      "space-between",
                    gap: "15px",
                    marginBottom:
                      "12px",
                  }}
                >

                  <h2
                    style={{
                      fontSize: "20px",
                      margin: 0,
                    }}
                  >
                    Pickup Requests
                  </h2>

                  <span
                    style={{
                      fontSize: "13px",
                      opacity: 0.6,
                    }}
                  >
                    {donations.length} total
                  </span>

                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    overflowX:
                      "auto",
                    paddingBottom:
                      "5px",
                  }}
                >

                  {donations.map(
                    (item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() =>
                          handleSelectRequest(
                            item.id
                          )
                        }
                        style={{
                          minWidth:
                            "230px",
                          textAlign:
                            "left",
                          padding:
                            "14px 16px",
                          borderRadius:
                            "15px",
                          border:
                            item.id ===
                            selectedDonationId
                              ? "2px solid #10b981"
                              : "1px solid rgba(255,255,255,0.10)",
                          background:
                            item.id ===
                            selectedDonationId
                              ? "rgba(16,185,129,0.10)"
                              : "rgba(255,255,255,0.03)",
                          color:
                            "inherit",
                          cursor:
                            "pointer",
                        }}
                      >

                        <strong
                          style={{
                            display:
                              "block",
                            fontSize:
                              "15px",
                            marginBottom:
                              "5px",
                          }}
                        >
                          {Number(
                            item.surplus_meals ??
                              item.surplusMeals ??
                              0
                          )}{" "}
                          meals
                        </strong>

                        <span
                          style={{
                            display:
                              "block",
                            fontSize:
                              "13px",
                            opacity:
                              0.65,
                          }}
                        >
                          {item.meal_type ||
                            item.mealType ||
                            "Meal"}{" "}
                          ·{" "}
                          {formatDate(
                            item.date
                          )}
                        </span>

                        <span
                          style={{
                            display:
                              "inline-block",
                            marginTop:
                              "8px",
                            fontSize:
                              "11px",
                            fontWeight:
                              800,
                            color:
                              item.status ===
                              "Pickup Pending"
                                ? "#fbbf24"
                                : "#6ee7b7",
                          }}
                        >
                          {item.status ||
                            "Pickup Pending"}
                        </span>

                      </button>
                    )
                  )}

                </div>

              </section>
            )}


            {/* =================================================
                BIG REQUEST CARD
                ================================================= */}

            {isPending && (
              <section
                style={{
                  marginBottom:
                    "28px",
                  padding:
                    "clamp(24px, 4vw, 38px)",
                  borderRadius: "24px",
                  background:
                    "linear-gradient(135deg, #064e3b, #0f766e)",
                  color: "white",
                  boxShadow:
                    "0 25px 70px rgba(5,150,105,0.22)",
                  position:
                    "relative",
                  overflow:
                    "hidden",
                }}
              >

                <div
                  style={{
                    position:
                      "absolute",
                    width: "260px",
                    height: "260px",
                    borderRadius:
                      "50%",
                    right:
                      "-100px",
                    top:
                      "-100px",
                    background:
                      "rgba(255,255,255,0.08)",
                  }}
                />

                <div
                  style={{
                    position:
                      "relative",
                    zIndex: 1,
                  }}
                >

                  <div
                    style={{
                      display:
                        "inline-flex",
                      alignItems:
                        "center",
                      gap: "8px",
                      padding:
                        "8px 13px",
                      borderRadius:
                        "999px",
                      background:
                        "rgba(255,255,255,0.12)",
                      fontSize: "12px",
                      fontWeight: 800,
                      letterSpacing:
                        "0.08em",
                      marginBottom:
                        "18px",
                    }}
                  >

                    <span
                      style={{
                        width: "9px",
                        height: "9px",
                        borderRadius:
                          "50%",
                        background:
                          "#fbbf24",
                        boxShadow:
                          "0 0 0 5px rgba(251,191,36,0.15)",
                      }}
                    />

                    ACTION REQUIRED

                  </div>

                  <h2
                    style={{
                      fontSize:
                        "clamp(30px, 5vw, 52px)",
                      lineHeight:
                        1.05,
                      margin:
                        "0 0 12px",
                    }}
                  >
                    New food pickup
                    request
                  </h2>

                  <p
                    style={{
                      fontSize:
                        "clamp(16px, 2vw, 19px)",
                      lineHeight:
                        1.6,
                      maxWidth:
                        "750px",
                      color:
                        "#d1fae5",
                      margin:
                        "0 0 26px",
                    }}
                  >
                    The campus canteen has
                    prepared surplus food that
                    is ready for your NGO to
                    rescue.
                  </p>

                  <div
                    style={{
                      display:
                        "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(150px, 1fr))",
                      gap: "12px",
                      marginBottom:
                        "26px",
                    }}
                  >

                    <BigRequestStat
                      value={`${surplusMeals}`}
                      label="Meals to rescue"
                    />

                    <BigRequestStat
                      value={
                        donation?.meal_type ||
                        "Lunch"
                      }
                      label="Meal"
                    />

                    <BigRequestStat
                      value={
                        donation?.shelf_life ||
                        "2 hours"
                      }
                      label="Shelf life"
                    />

                    <BigRequestStat
                      value={
                        ngo.distance ||
                        `${ngo.distanceKm || 0} km`
                      }
                      label="Distance"
                    />

                  </div>

                  <button
                    type="button"
                    onClick={
                      handleAcceptPickup
                    }
                    disabled={
                      updatingStatus
                    }
                    style={{
                      width: "100%",
                      minHeight:
                        "68px",
                      border: "none",
                      borderRadius:
                        "18px",
                      background:
                        "white",
                      color:
                        "#065f46",
                      fontSize:
                        "18px",
                      fontWeight:
                        900,
                      letterSpacing:
                        "0.01em",
                      cursor:
                        updatingStatus
                          ? "not-allowed"
                          : "pointer",
                      display:
                        "flex",
                      alignItems:
                        "center",
                      justifyContent:
                        "center",
                      gap: "10px",
                      opacity:
                        updatingStatus
                          ? 0.7
                          : 1,
                    }}
                  >

                    {updatingStatus ? (
                      <>
                        <Loader2
                          size={22}
                          className="spin"
                        />

                        Accepting pickup...
                      </>
                    ) : (
                      <>
                        <CheckCircle2
                          size={23}
                        />

                        ACCEPT PICKUP
                      </>
                    )}

                  </button>

                </div>

              </section>
            )}


            {/* =================================================
                HERO
                ================================================= */}

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
                  {formatDate(
                    donation.date
                  )}{" "}
                  ·{" "}
                  {donation.meal_type ||
                    "Lunch"}
                </p>

              </div>

              <div className="donation-status-pill">

                <Clock3 size={17} />

                {currentStatus}

              </div>

            </section>


            {/* =================================================
                MAIN GRID
                ================================================= */}

            <div className="donations-grid">

              <div className="donations-main">

                {/* =============================================
                    PROGRESS
                    ============================================= */}

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

                    <Truck size={23} />

                  </div>


                  <div
                    className="progress-track"
                  >

                    <div
                      className="progress-fill"
                      style={{
                        width:
                          `${progressPercentage}%`,
                      }}
                    />

                  </div>


                  <div
                    className="status-timeline"
                  >

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
                            className={
                              `timeline-item ${
                                completed
                                  ? "completed"
                                  : ""
                              } ${
                                active
                                  ? "active"
                                  : ""
                              }`
                            }
                            key={
                              status
                            }
                          >

                            <div
                              className="timeline-dot"
                            >

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


                  <div
                    className="current-status-description"
                  >

                    <Clock3
                      size={17}
                    />

                    <span>
                      {
                        STATUS_DESCRIPTIONS[
                          currentStatus
                        ]
                      }
                    </span>

                  </div>

                </section>


                {/* =============================================
                    CHECKLIST
                    ============================================= */}

                <section className="donation-card">

                  <div
                    className="donation-card-heading"
                  >

                    <div>

                      <span>
                        NGO CHECKLIST
                      </span>

                      <h3>
                        Rescue Completion
                      </h3>

                    </div>

                    <ShieldCheck
                      size={23}
                    />

                  </div>


                  <ChecklistItem
                    label="Pickup request received"
                    done={
                      donation?.checklist
                        ?.requestSent !==
                        false
                    }
                  />

                  <ChecklistItem
                    label="NGO accepted pickup"
                    done={
                      donation?.checklist
                        ?.ngoAccepted ||
                      isAccepted
                    }
                  />

                  <ChecklistItem
                    label="Pickup location confirmed"
                    done={
                      donation?.checklist
                        ?.pickupLocationConfirmed ||
                      isAccepted
                    }
                  />

                  <ChecklistItem
                    label="Meals confirmed"
                    done={
                      donation?.checklist
                        ?.mealsConfirmed ||
                      isAccepted
                    }
                  />

                  <ChecklistItem
                    label="Pickup started"
                    done={
                      donation?.checklist
                        ?.pickupStarted ||
                      isInProgress ||
                      isPickedUp
                    }
                  />

                  <ChecklistItem
                    label="Food collected"
                    done={
                      donation?.checklist
                        ?.foodCollected ||
                      isPickedUp
                    }
                  />

                  <ChecklistItem
                    label="Rescue completed"
                    done={
                      donation?.checklist
                        ?.completed ||
                      isCompleted
                    }
                  />

                </section>


                {/* =============================================
                    NGO DETAILS
                    ============================================= */}

                <section className="donation-card">

                  <div
                    className="donation-card-heading"
                  >

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
                      size={23}
                    />

                  </div>


                  <div
                    className="ngo-profile"
                  >

                    <div
                      className="ngo-profile-icon"
                    >
                      <HeartHandshake
                        size={28}
                      />
                    </div>

                    <div
                      className="ngo-profile-info"
                    >

                      <strong>
                        {ngo.name ||
                          "NGO Partner"}
                      </strong>

                      <span>
                        Registered food
                        rescue partner
                      </span>

                    </div>

                  </div>


                  <div
                    className="ngo-contact-grid"
                  >

                    <div>

                      <MapPin
                        size={18}
                      />

                      <span>
                        Distance

                        <strong>
                          {ngo.distance ||
                            `${ngo.distanceKm || 0} km`}
                        </strong>
                      </span>

                    </div>


                    <div>

                      <Phone
                        size={18}
                      />

                      <span>
                        Phone

                        <strong>
                          {ngo.phone ||
                            "Not available"}
                        </strong>
                      </span>

                    </div>


                    <div>

                      <Clock3
                        size={18}
                      />

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


                {/* =============================================
                    PICKUP DETAILS
                    ============================================= */}

                <section className="donation-card">

                  <div
                    className="donation-card-heading"
                  >

                    <div>

                      <span>
                        PICKUP DETAILS
                      </span>

                      <h3>
                        Rescue Information
                      </h3>

                    </div>

                    <PackageCheck
                      size={23}
                    />

                  </div>


                  <div
                    className="pickup-detail-grid"
                  >

                    <DetailItem
                      icon={
                        <MapPin
                          size={19}
                        />
                      }
                      label="Pickup Location"
                      value={
                        pickupLocation
                      }
                    />

                    <DetailItem
                      icon={
                        <PackageCheck
                          size={19}
                        />
                      }
                      label="Rescue Quantity"
                      value={`${surplusMeals} meals`}
                    />

                    <DetailItem
                      icon={
                        <Clock3
                          size={19}
                        />
                      }
                      label="Shelf Life"
                      value={
                        shelfLife
                      }
                    />

                    <DetailItem
                      icon={
                        <UserRound
                          size={19}
                        />
                      }
                      label="NGO"
                      value={
                        ngo.name ||
                        "NGO Partner"
                      }
                    />

                  </div>

                </section>


                {/* =============================================
                    MEAL SUMMARY
                    ============================================= */}

                <section className="donation-card">

                  <div
                    className="donation-card-heading"
                  >

                    <div>

                      <span>
                        MEAL OPERATIONS
                      </span>

                      <h3>
                        Source Meal Summary
                      </h3>

                    </div>

                    <PackageCheck
                      size={23}
                    />

                  </div>


                  <div
                    className="meal-summary-grid"
                  >

                    <SummaryNumber
                      label="Predicted"
                      value={
                        predictedMeals
                      }
                    />

                    <SummaryNumber
                      label="Prepared"
                      value={
                        preparedMeals
                      }
                    />

                    <SummaryNumber
                      label="Served"
                      value={
                        servedMeals
                      }
                    />

                    <SummaryNumber
                      label="Rescued"
                      value={
                        surplusMeals
                      }
                      highlight
                    />

                  </div>

                </section>

              </div>


              {/* =================================================
                  SIDEBAR
                  ================================================= */}

              <aside className="donations-sidebar">

                {/* ===============================================
                    RESCUE SUMMARY
                    =============================================== */}

                <section
                  className="donation-summary"
                >

                  <span>
                    RESCUE SUMMARY
                  </span>

                  <strong>
                    {surplusMeals}
                  </strong>

                  <small>
                    meals redirected
                    from waste
                  </small>

                  <div
                    className="summary-line"
                  />

                  <div>
                    <span>
                      Meal
                    </span>

                    <strong>
                      {donation.meal_type ||
                        "Lunch"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Date
                    </span>

                    <strong>
                      {formatDate(
                        donation.date
                      )}
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


                {/* ===============================================
                    STATUS CONTROL
                    =============================================== */}

                <section
                  className="status-control-card"
                >

                  <span>
                    PICKUP MANAGEMENT
                  </span>

                  <h3>
                    Update Rescue Status
                  </h3>

                  <p>
                    Update the status as
                    your NGO completes
                    each pickup stage.
                  </p>


                  {isPending && (
                    <button
                      type="button"
                      onClick={
                        handleAcceptPickup
                      }
                      disabled={
                        updatingStatus
                      }
                      style={{
                        width: "100%",
                        minHeight:
                          "56px",
                        border: "none",
                        borderRadius:
                          "14px",
                        background:
                          "#10b981",
                        color:
                          "#052e1c",
                        fontSize:
                          "16px",
                        fontWeight:
                          900,
                        cursor:
                          "pointer",
                        display:
                          "flex",
                        alignItems:
                          "center",
                        justifyContent:
                          "center",
                        gap: "8px",
                        marginBottom:
                          "12px",
                      }}
                    >

                      {updatingStatus ? (
                        <>
                          <Loader2
                            size={18}
                            className="spin"
                          />

                          Accepting...
                        </>
                      ) : (
                        <>
                          <CheckCircle2
                            size={19}
                          />

                          ACCEPT PICKUP
                        </>
                      )}

                    </button>
                  )}


                  <div
                    className="status-buttons"
                  >

                    {STATUS_FLOW.map(
                      (status) => {

                        const selected =
                          currentStatus ===
                          status;

                        const disabled =
                          updatingStatus ||
                          status ===
                            "Pickup Pending" ||
                          (
                            currentStatus ===
                              "Pickup Pending" &&
                            status !==
                              "NGO Accepted"
                          );

                        return (
                          <button
                            key={status}
                            type="button"
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
                              disabled
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
                    <div
                      className="status-updating"
                    >

                      <RefreshCw
                        size={15}
                        className="spin"
                      />

                      Updating Firebase...

                    </div>
                  )}

                </section>


                {/* ===============================================
                    ACTIVITY
                    =============================================== */}

                <section
                  className="pickup-timestamps-card"
                >

                  <div
                    className="sidebar-section-title"
                  >

                    <span>
                      ACTIVITY
                    </span>

                    <Clock3
                      size={18}
                    />

                  </div>


                  <ActivityItem
                    icon={
                      <Check size={13} />
                    }
                    title="Pickup request received"
                    timestamp={
                      donation.createdAt
                    }
                  />

                  <ActivityItem
                    icon={
                      <Truck size={13} />
                    }
                    title="Pickup requested"
                    timestamp={
                      donation.pickup_requested_at
                    }
                  />

                  <ActivityItem
                    icon={
                      <CheckCircle2
                        size={13}
                      />
                    }
                    title="NGO accepted"
                    timestamp={
                      donation.acceptedAt
                    }
                  />

                  <ActivityItem
                    icon={
                      <Truck size={13} />
                    }
                    title="Pickup started"
                    timestamp={
                      donation.pickup_started_at
                    }
                  />

                  <ActivityItem
                    icon={
                      <PackageCheck
                        size={13}
                      />
                    }
                    title="Food collected"
                    timestamp={
                      donation.picked_up_at
                    }
                  />

                  <ActivityItem
                    icon={
                      <CheckCircle2
                        size={13}
                      />
                    }
                    title="Completed"
                    timestamp={
                      donation.completed_at
                    }
                  />

                </section>


                {/* ===============================================
                    COMPLETED
                    =============================================== */}

                {isCompleted && (
                  <section
                    className="completed-card"
                  >

                    <CheckCircle2
                      size={28}
                    />

                    <div>

                      <strong>
                        Rescue Completed
                      </strong>

                      <p>
                        The rescued meals
                        have successfully
                        completed the NGO
                        pickup workflow.
                      </p>

                    </div>

                  </section>
                )}

              </aside>

            </div>


            {/* =================================================
                BOTTOM
                ================================================= */}

            <section
              className="donation-bottom-actions"
            >

              <button
                type="button"
                onClick={handleBack}
              >

                <ArrowLeft
                  size={18}
                />

                Back to Dashboard

              </button>


              <button
                type="button"
                className="impact-button"
                onClick={() =>
                  navigate("/impact")
                }
              >

                View Impact Dashboard

                <CheckCircle2
                  size={18}
                />

              </button>

            </section>

          </>
        )}

      </main>


      <style>{`

        .spin {
          animation:
            donationSpin
            1s linear infinite;
        }

        @keyframes donationSpin {
          from {
            transform:
              rotate(0deg);
          }

          to {
            transform:
              rotate(360deg);
          }
        }

        .donation-alert {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          margin-bottom: 18px;
          border-radius: 14px;
        }

        .donation-alert p {
          margin:
            5px 0 0;
          line-height: 1.5;
        }

        .donation-alert.error {
          background:
            rgba(239,68,68,0.08);
          border:
            1px solid rgba(239,68,68,0.22);
        }

        .donation-alert.success {
          background:
            rgba(16,185,129,0.08);
          border:
            1px solid rgba(16,185,129,0.22);
        }

      `}</style>

    </div>
  );
}


/* =========================================================
   BIG REQUEST STAT
   ========================================================= */

function BigRequestStat({
  value,
  label,
}) {
  return (
    <div
      style={{
        padding: "17px",
        borderRadius: "16px",
        background:
          "rgba(255,255,255,0.09)",
        border:
          "1px solid rgba(255,255,255,0.10)",
      }}
    >

      <strong
        style={{
          display: "block",
          fontSize:
            "clamp(21px, 3vw, 28px)",
          lineHeight: 1.1,
          marginBottom: "6px",
        }}
      >
        {value}
      </strong>

      <span
        style={{
          fontSize: "12px",
          color: "#a7f3d0",
          fontWeight: 700,
        }}
      >
        {label}
      </span>

    </div>
  );
}


/* =========================================================
   CHECKLIST ITEM
   ========================================================= */

function ChecklistItem({
  label,
  done,
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "14px",
        padding:
          "14px 4px",
        borderBottom:
          "1px solid rgba(255,255,255,0.07)",
      }}
    >

      <div
        style={{
          width: "32px",
          height: "32px",
          borderRadius: "10px",
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
          background: done
            ? "rgba(16,185,129,0.15)"
            : "rgba(148,163,184,0.10)",
          color: done
            ? "#34d399"
            : "#64748b",
        }}
      >

        {done ? (
          <Check
            size={17}
          />
        ) : (
          <Clock3
            size={16}
          />
        )}

      </div>

      <span
        style={{
          fontSize: "15px",
          fontWeight: done
            ? 700
            : 500,
          color: done
            ? "#d1fae5"
            : "#94a3b8",
        }}
      >
        {label}
      </span>

      <span
        style={{
          marginLeft: "auto",
          fontSize: "12px",
          fontWeight: 800,
          color: done
            ? "#34d399"
            : "#64748b",
        }}
      >
        {done
          ? "DONE"
          : "PENDING"}
      </span>

    </div>
  );
}


/* =========================================================
   DETAIL ITEM
   ========================================================= */

function DetailItem({
  icon,
  label,
  value,
}) {
  return (
    <div>

      {icon}

      <span>

        {label}

        <strong>
          {value}
        </strong>

      </span>

    </div>
  );
}


/* =========================================================
   SUMMARY NUMBER
   ========================================================= */

function SummaryNumber({
  label,
  value,
  highlight = false,
}) {
  return (
    <div
      className={
        highlight
          ? "highlight"
          : ""
      }
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
   ACTIVITY ITEM
   ========================================================= */

function ActivityItem({
  icon,
  title,
  timestamp,
}) {
  return (
    <div
      className="activity-item"
    >

      <div
        className="activity-dot"
      >
        {icon}
      </div>

      <div>

        <strong>
          {title}
        </strong>

        <span>
          {formatTimestamp(
            timestamp
          )}
        </span>

      </div>

    </div>
  );
}