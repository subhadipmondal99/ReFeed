import {
  useMemo,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  Database,
  HeartHandshake,
  Leaf,
  Loader2,
  MapPin,
  PackageCheck,
  Phone,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Truck,
  Users,
} from "lucide-react";

import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase/auth";

import {
  createSurplusEvent,
  calculateRemainingMeals,
  isSurplus,
  SURPLUS_THRESHOLD,
} from "../services/surplusService";

import "./FoodRescue.css";


/* =========================================================
   DEMO NGO DATA

   Later this can come directly from:
   Firestore -> ngos collection
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
    capacity: 180,
    phone: "+91 91234 56789",
    responseTime: "20–25 min",
  },

  {
    id: "ngo-community-kitchen",
    name: "Community Kitchen",
    distance: "3.4 km",
    distanceKm: 3.4,
    capacity: 250,
    phone: "+91 99887 66554",
    responseTime: "25–30 min",
  },
];


/* =========================================================
   HELPERS
   ========================================================= */

const getToday = () => {
  return new Date()
    .toISOString()
    .split("T")[0];
};


const formatNumber = (value) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "0";
  }

  return number.toLocaleString("en-IN");
};


const formatShelfLife = (minutes) => {
  const value = Number(minutes) || 120;

  if (value >= 60) {
    const hours = Math.floor(value / 60);
    const mins = value % 60;

    return `${hours} hour${hours !== 1 ? "s" : ""
      }${mins ? ` ${mins} min` : ""}`;
  }

  return `${value} min`;
};


const formatDate = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(
    `${value}T00:00:00`
  );

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      weekday: "long",
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
};


/* =========================================================
   MAIN COMPONENT
   ========================================================= */

export default function FoodRescue() {
  const location = useLocation();
  const navigate = useNavigate();

  const incomingData =
    location.state || {};


  /* =======================================================
     INPUT DATA
     ======================================================= */

  const date =
    incomingData.date ||
    getToday();

  const mealType =
    incomingData.mealType ||
    incomingData.meal_type ||
    "Lunch";

  const predictedMeals =
    Number(
      incomingData.predictedMeals ??
      incomingData.predicted_meals ??
      0
    ) || 0;

  const preparedMeals =
    Number(
      incomingData.cookedMeals ??
      incomingData.preparedMeals ??
      incomingData.prepared ??
      incomingData.recommendedCooking ??
      0
    ) || 0;

  const servedMeals =
    Number(
      incomingData.servedMeals ??
      incomingData.served ??
      0
    ) || 0;

  const dayType =
    incomingData.dayType ||
    incomingData.day_type ||
    "regular";

  const campusPopulation =
    Number(
      incomingData.campusPopulation ??
      incomingData.campus_population ??
      1000
    ) || 1000;

  const pickupLocation =
    incomingData.pickupLocation ||
    incomingData.location ||
    "Main Campus Canteen";

  const shelfLifeMinutes =
    Number(
      incomingData.shelfLifeMinutes ??
      120
    ) || 120;


  /* =======================================================
     SURPLUS
     ======================================================= */

  const remainingMeals = useMemo(() => {
    return calculateRemainingMeals({
      prepared: preparedMeals,
      served: servedMeals,
    });
  }, [
    preparedMeals,
    servedMeals,
  ]);


  const surplusDetected =
    isSurplus(remainingMeals);


  /* =======================================================
     STATE
     ======================================================= */

  const [
    selectedNgo,
    setSelectedNgo,
  ] = useState(null);

  const [
    surplusEvent,
    setSurplusEvent,
  ] = useState(null);

  const [
    donation,
    setDonation,
  ] = useState(null);

  const [
    creatingSurplus,
    setCreatingSurplus,
  ] = useState(false);

  const [
    sendingDonation,
    setSendingDonation,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");


  /* =======================================================
     DERIVED
     ======================================================= */

  const pickupMeals = selectedNgo
    ? Math.min(
      remainingMeals,
      Number(
        selectedNgo.capacity || 0
      )
    )
    : 0;


  const remainingAfterPickup =
    Math.max(
      0,
      remainingMeals -
      pickupMeals
    );


  const formattedShelfLife =
    formatShelfLife(
      shelfLifeMinutes
    );


  const progress =
    donation
      ? 100
      : selectedNgo
        ? 75
        : surplusEvent
          ? 50
          : surplusDetected
            ? 25
            : 0;


  /* =======================================================
     CREATE SURPLUS EVENT
     ======================================================= */

  const handleCreateSurplus =
    async () => {

      setError("");
      setSuccessMessage("");

      if (!surplusDetected) {
        setError(
          `Rescue activates only when more than ${SURPLUS_THRESHOLD} meals remain.`
        );

        return;
      }


      if (
        preparedMeals <= 0
      ) {
        setError(
          "Please provide a valid prepared meal count."
        );

        return;
      }


      if (
        servedMeals < 0 ||
        servedMeals > preparedMeals
      ) {
        setError(
          "Served meals must be between 0 and the prepared meal count."
        );

        return;
      }


      try {

        setCreatingSurplus(
          true
        );


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


        if (
          !result?.surplus
        ) {
          setError(
            result?.message ||
            `Only ${remainingMeals} meals remain.`
          );

          return;
        }


        setSurplusEvent(
          result
        );


        setSuccessMessage(
          `Surplus event saved to Firebase: ${result.remaining} meals are ready for rescue.`
        );

      } catch (err) {

        console.error(
          "Surplus creation error:",
          err
        );

        setError(
          err?.message ||
          "Unable to save the surplus event."
        );

      } finally {

        setCreatingSurplus(
          false
        );

      }
    };


  /* =======================================================
     SELECT NGO
     ======================================================= */

  const handleSelectNgo =
    (ngo) => {

      setError("");
      setSuccessMessage("");

      if (!ngo) {
        return;
      }


      if (
        Number(
          ngo.capacity || 0
        ) <= 0
      ) {
        setError(
          `${ngo.name} currently has no available pickup capacity.`
        );

        return;
      }


      setSelectedNgo(
        ngo
      );
    };


  /* =======================================================
     SEND PICKUP REQUEST

     IMPORTANT:
     This directly writes the notification into:

       donations/{auto-generated-id}

     BEFORE navigating anywhere.

     Therefore the request survives page changes.
     ======================================================= */

  const handleSendPickupRequest =
    async () => {

      setError("");
      setSuccessMessage("");


      if (!surplusEvent?.id) {
        setError(
          "Please record the surplus before sending the pickup request."
        );

        return;
      }


      if (!selectedNgo) {
        setError(
          "Please select an NGO first."
        );

        return;
      }


      if (
        pickupMeals <= 0
      ) {
        setError(
          "There are no meals available for this pickup."
        );

        return;
      }


      try {

        setSendingDonation(
          true
        );


        /* ---------------------------------------------
           FIREBASE DONATION DOCUMENT
           --------------------------------------------- */

        const donationData = {

          /* Identity */

          notificationType:
            "pickup_request",

          workflow:
            "food_rescue",

          source:
            "campus_canteen",


          /* Surplus reference */

          surplusEventId:
            surplusEvent.id,


          /* Meal */

          date,

          mealType,

          predictedMeals:
            Number(
              predictedMeals
            ),

          preparedMeals:
            Number(
              preparedMeals
            ),

          servedMeals:
            Number(
              servedMeals
            ),


          /* Surplus */

          totalSurplusMeals:
            Number(
              remainingMeals
            ),

          surplusMeals:
            Number(
              pickupMeals
            ),

          pickupMeals:
            Number(
              pickupMeals
            ),

          remainingAfterPickup:
            Number(
              remainingAfterPickup
            ),


          /* Pickup */

          pickupLocation,

          shelfLife:
            formattedShelfLife,

          shelfLifeMinutes:
            Number(
              shelfLifeMinutes
            ),


          /* NGO */

          ngo: {
            id:
              selectedNgo.id,

            name:
              selectedNgo.name,

            phone:
              selectedNgo.phone,

            distance:
              selectedNgo.distance,

            distanceKm:
              Number(
                selectedNgo.distanceKm ||
                0
              ),

            capacity:
              Number(
                selectedNgo.capacity ||
                0
              ),

            responseTime:
              selectedNgo.responseTime,
          },


          /* -----------------------------------------
             WORKFLOW STATUS

             These fields are important because the
             NGO page and Dashboard will read them.
             ----------------------------------------- */

          status:
            "Pickup Pending",

          ngoStatus:
            "Pending",

          notificationStatus:
            "Unread",

          notificationRead:
            false,

          accepted:
            false,

          acceptedAt:
            null,

          acceptedBy:
            null,

          pickupStarted:
            false,

          pickedUp:
            false,

          completed:
            false,


          /* Checklist */

          checklist: {
            requestSent:
              true,

            ngoAccepted:
              false,

            pickupLocationConfirmed:
              false,

            mealsConfirmed:
              false,

            pickupStarted:
              false,

            foodCollected:
              false,

            completed:
              false,
          },


          /* Extra */

          dayType,

          campusPopulation:
            Number(
              campusPopulation
            ),

          notes:
            "Surplus generated from campus canteen meal operations.",


          /* Firebase */

          createdAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp(),
        };


        /* ---------------------------------------------
           SAVE FIRST
           --------------------------------------------- */

        const donationRef =
          await addDoc(
            collection(
              db,
              "donations"
            ),
            donationData
          );


        /* ---------------------------------------------
           LOCAL SUCCESS
           --------------------------------------------- */

        const savedDonation = {
          id:
            donationRef.id,

          ...donationData,
        };


        setDonation(
          savedDonation
        );


        setSuccessMessage(
          `Pickup request sent to ${selectedNgo.name}. The request is now stored in Firebase.`
        );


        /* ---------------------------------------------
           IMPORTANT:

           Navigate only AFTER Firebase succeeds.
           --------------------------------------------- */

        setTimeout(() => {

          navigate(
            "/donations",
            {
              state: {
                donationId:
                  donationRef.id,
              },
            }
          );

        }, 700);


      } catch (err) {

        console.error(
          "Firebase pickup request error:",
          err
        );

        setError(
          err?.message ||
          "Pickup request could not be saved to Firebase."
        );

      } finally {

        setSendingDonation(
          false
        );

      }
    };


  /* =======================================================
     BACK
     ======================================================= */

  const handleBack =
    () => {

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
     RESET
     ======================================================= */

  const handleReset =
    () => {

      setSelectedNgo(null);
      setSurplusEvent(null);
      setDonation(null);
      setError("");
      setSuccessMessage("");
    };


  /* =======================================================
     RENDER
     ======================================================= */

  return (

    <div className="food-rescue-page">

      {/* BACKGROUND */}

      <div
        className="rescue-background"
        aria-hidden="true"
      >
        <div className="rescue-glow glow-one" />
        <div className="rescue-glow glow-two" />
        <div className="rescue-grid" />
      </div>


      {/* ===================================================
          HEADER
          =================================================== */}

      <header className="food-rescue-header">

        <div className="food-rescue-header-inner">

          <button
            type="button"
            className="rescue-back-button"
            onClick={handleBack}
          >
            <ArrowLeft size={18} />

            <span>
              Meal Operations
            </span>
          </button>


          <div className="rescue-brand">

            <div className="rescue-brand-icon">
              <HeartHandshake
                size={21}
              />
            </div>

            <div>

              <strong>
                Food Rescue
              </strong>

              <span>
                Surplus → Community
              </span>

            </div>

          </div>


          <div className="firebase-status">

            <span />

            Firebase connected

          </div>

        </div>

      </header>


      {/* ===================================================
          MAIN
          =================================================== */}

      <main className="food-rescue-container">


        {/* =================================================
            ALERT
            ================================================= */}

        {error && (

          <div className="rescue-alert error">

            <AlertCircle
              size={22}
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


        {successMessage && (

          <div className="rescue-alert success">

            <CheckCircle2
              size={22}
            />

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

          <div className="hero-content">

            <div className="hero-eyebrow">

              <span />

              FOOD RESCUE COMMAND CENTER

            </div>


            <h1>
              Rescue surplus
              <em> before it becomes waste.</em>
            </h1>


            <p>
              ReFeed identifies unused meals,
              records the surplus, finds a pickup
              partner and creates a traceable
              donation request.
            </p>


            <div className="hero-tags">

              <div>
                <Database size={15} />
                Firebase tracked
              </div>

              <div>
                <HeartHandshake size={15} />
                NGO dispatch
              </div>

              <div>
                <CheckCircle2 size={15} />
                Full workflow
              </div>

            </div>

          </div>


          <div className="hero-visual">

            <div className="rescue-orbit orbit-one" />
            <div className="rescue-orbit orbit-two" />

            <div className="rescue-core">

              <div className="rescue-core-icon">
                <HeartHandshake
                  size={38}
                />
              </div>

              <strong>
                RESCUE
              </strong>

              <span>
                SMART DISPATCH
              </span>

            </div>


            <div className="floating-card floating-food">

              <PackageCheck
                size={18}
              />

              <div>
                <span>
                  SURPLUS
                </span>

                <strong>
                  {formatNumber(
                    remainingMeals
                  )} meals
                </strong>
              </div>

            </div>


            <div className="floating-card floating-ngo">

              <Users
                size={18}
              />

              <div>
                <span>
                  NGO NETWORK
                </span>

                <strong>
                  {DEMO_NGOS.length} partners
                </strong>
              </div>

            </div>

          </div>

        </section>


        {/* =================================================
            FLOW
            ================================================= */}

        <section className="rescue-flow">

          <FlowStep
            number="01"
            title="Detect"
            active
            done
          />

          <FlowLine
            active={
              Boolean(
                surplusEvent
              )
            }
          />

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
                selectedNgo
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
                donation
              )
            }
          />

          <FlowStep
            number="04"
            title="Notify"
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
            title="Track"
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
          className={
            surplusDetected
              ? "surplus-banner active"
              : "surplus-banner"
          }
        >

          <div className="surplus-main">

            <div className="surplus-icon">

              {surplusDetected ? (
                <HeartHandshake
                  size={27}
                />
              ) : (
                <ShieldCheck
                  size={27}
                />
              )}

            </div>


            <div>

              <span>
                SURPLUS DETECTION
              </span>

              <h2>
                {surplusDetected
                  ? `${formatNumber(
                    remainingMeals
                  )} meals are ready for rescue`
                  : "No qualifying surplus yet"}
              </h2>

              <p>
                {surplusDetected
                  ? `The available surplus is above the ${SURPLUS_THRESHOLD}-meal rescue threshold.`
                  : `Rescue activates when more than ${SURPLUS_THRESHOLD} meals remain.`}
              </p>

            </div>

          </div>


          <div className="surplus-number">

            <strong>
              {formatNumber(
                remainingMeals
              )}
            </strong>

            <span>
              meals
            </span>

          </div>

        </section>


        {/* =================================================
            MAIN GRID
            ================================================= */}

        <section className="rescue-main-grid">


          {/* ===============================================
              LEFT COLUMN
              =============================================== */}

          <div className="rescue-left">


            {/* MEAL SUMMARY */}

            <section className="rescue-card">

              <CardHeader
                step="01"
                title="Meal rescue summary"
                description="The current canteen operation that produced the surplus."
                icon={
                  <PackageCheck
                    size={20}
                  />
                }
              />


              <div className="summary-grid">

                <SummaryItem
                  icon={
                    <Users size={18} />
                  }
                  label="Expected demand"
                  value={`${formatNumber(
                    predictedMeals
                  )} meals`}
                />

                <SummaryItem
                  icon={
                    <Truck size={18} />
                  }
                  label="Prepared"
                  value={`${formatNumber(
                    preparedMeals
                  )} meals`}
                />

                <SummaryItem
                  icon={
                    <HeartHandshake
                      size={18}
                    />
                  }
                  label="Served"
                  value={`${formatNumber(
                    servedMeals
                  )} meals`}
                />

                <SummaryItem
                  icon={
                    <Leaf size={18} />
                  }
                  label="Available surplus"
                  value={`${formatNumber(
                    remainingMeals
                  )} meals`}
                  highlight
                />

              </div>


              <div className="operation-details">

                <div>

                  <span>
                    DATE
                  </span>

                  <strong>
                    {formatDate(
                      date
                    )}
                  </strong>

                </div>


                <div>

                  <span>
                    MEAL
                  </span>

                  <strong>
                    {mealType}
                  </strong>

                </div>


                <div>

                  <span>
                    PICKUP LOCATION
                  </span>

                  <strong>
                    {pickupLocation}
                  </strong>

                </div>

              </div>

            </section>


            {/* RECORD SURPLUS */}

            <section className="rescue-card">

              <CardHeader
                step="02"
                title="Record surplus"
                description="Save the detected surplus to Firebase before contacting an NGO."
                icon={
                  <Database size={20} />
                }
              />


              {!surplusEvent ? (

                <div className="record-box">

                  <div className="record-box-icon">
                    <Database
                      size={24}
                    />
                  </div>

                  <div>

                    <h3>
                      Save this surplus event
                    </h3>

                    <p>
                      This creates a permanent
                      record in Firebase so the
                      rescue can be tracked later.
                    </p>

                  </div>


                  <button
                    type="button"
                    className="primary-button"
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
                        <Loader2
                          size={18}
                          className="spin"
                        />

                        Saving...

                      </>

                    ) : (

                      <>
                        <Database
                          size={18}
                        />

                        Save surplus event

                      </>

                    )}

                  </button>

                </div>

              ) : (

                <div className="saved-event">

                  <div className="saved-event-icon">
                    <CheckCircle2
                      size={25}
                    />
                  </div>

                  <div>

                    <strong>
                      Surplus event saved
                    </strong>

                    <span>
                      Firebase record created successfully.
                    </span>

                  </div>

                  <div className="saved-event-id">

                    ID:
                    <strong>
                      {surplusEvent.id}
                    </strong>

                  </div>

                </div>

              )}

            </section>


            {/* NGO SELECTION */}

            <section className="rescue-card">

              <CardHeader
                step="03"
                title="Choose pickup partner"
                description="Select an NGO that can receive the available meals."
                icon={
                  <HeartHandshake
                    size={20}
                  />
                }
              />


              {!surplusEvent ? (

                <LockedState
                  title="Record the surplus first"
                  text="Save the surplus event before selecting an NGO."
                />

              ) : (

                <div className="ngo-list">

                  {DEMO_NGOS.map(
                    (ngo) => {

                      const selected =
                        selectedNgo?.id ===
                        ngo.id;

                      const canReceive =
                        Number(
                          ngo.capacity
                        ) > 0;

                      const pickupForNgo =
                        Math.min(
                          remainingMeals,
                          Number(
                            ngo.capacity
                          )
                        );


                      return (

                        <button
                          type="button"
                          key={ngo.id}
                          className={
                            selected
                              ? "ngo-card selected"
                              : "ngo-card"
                          }
                          onClick={() =>
                            handleSelectNgo(
                              ngo
                            )
                          }
                          disabled={
                            !canReceive
                          }
                        >

                          <div className="ngo-icon">

                            <HeartHandshake
                              size={21}
                            />

                          </div>


                          <div className="ngo-content">

                            <div className="ngo-top">

                              <div>

                                <strong>
                                  {ngo.name}
                                </strong>

                                <span>
                                  <MapPin
                                    size={13}
                                  />

                                  {ngo.distance}
                                </span>

                              </div>


                              {selected && (

                                <CheckCircle2
                                  size={24}
                                  className="selected-check"
                                />

                              )}

                            </div>


                            <div className="ngo-meta">

                              <span>
                                <PackageCheck
                                  size={14}
                                />

                                Capacity{" "}
                                {formatNumber(
                                  ngo.capacity
                                )}
                              </span>

                              <span>
                                <Clock3
                                  size={14}
                                />

                                {ngo.responseTime}
                              </span>

                            </div>


                            <div className="ngo-capacity">

                              <div>

                                <span>
                                  CAN RECEIVE
                                </span>

                                <strong>
                                  {formatNumber(
                                    pickupForNgo
                                  )} meals
                                </strong>

                              </div>

                              <span className="capacity-ready">
                                Available
                              </span>

                            </div>


                            {selected && (

                              <div className="ngo-selected">

                                <CheckCircle2
                                  size={15}
                                />

                                NGO selected ·{" "}
                                {formatNumber(
                                  pickupForNgo
                                )} meals

                              </div>

                            )}

                          </div>

                        </button>

                      );

                    }
                  )}

                </div>

              )}

            </section>


            {/* PICKUP INFORMATION */}

            <section className="rescue-card">

              <CardHeader
                step="04"
                title="Pickup information"
                description="Everything the NGO needs before arriving."
                icon={
                  <Truck size={20} />
                }
              />


              <div className="pickup-grid">

                <PickupItem
                  icon={
                    <MapPin size={18} />
                  }
                  label="Pickup location"
                  value={
                    pickupLocation
                  }
                />

                <PickupItem
                  icon={
                    <Clock3 size={18} />
                  }
                  label="Shelf life"
                  value={
                    formattedShelfLife
                  }
                />

                <PickupItem
                  icon={
                    <PackageCheck
                      size={18}
                    />
                  }
                  label="Meals for NGO"
                  value={
                    selectedNgo
                      ? `${formatNumber(
                        pickupMeals
                      )} meals`
                      : "Select NGO"
                  }
                />

                <PickupItem
                  icon={
                    <Users size={18} />
                  }
                  label="Pickup partner"
                  value={
                    selectedNgo?.name ||
                    "Not selected"
                  }
                />

              </div>


              <div className="time-warning">

                <Clock3
                  size={19}
                />

                <div>

                  <strong>
                    Food rescue is time-sensitive
                  </strong>

                  <span>
                    The NGO should collect the meals
                    within the displayed shelf-life window.
                  </span>

                </div>

              </div>

            </section>


            {/* SEND REQUEST */}

            <section className="send-card">

              <div className="send-card-header">

                <div className="send-icon">
                  <Send size={24} />
                </div>

                <div>

                  <span>
                    FINAL STEP
                  </span>

                  <h2>
                    Send pickup request
                  </h2>

                  <p>
                    The request will be saved to Firebase
                    before the NGO page opens.
                  </p>

                </div>

              </div>


              {selectedNgo ? (

                <div className="request-preview">

                  <div className="request-preview-main">

                    <div className="request-preview-icon">
                      <HeartHandshake
                        size={23}
                      />
                    </div>

                    <div>

                      <span>
                        PICKUP REQUEST READY
                      </span>

                      <strong>
                        {selectedNgo.name}
                      </strong>

                      <p>
                        {formatNumber(
                          pickupMeals
                        )} meals ·{" "}
                        {pickupLocation}
                      </p>

                    </div>

                  </div>


                  <div className="request-status">
                    <span />
                    Ready
                  </div>

                </div>

              ) : (

                <LockedState
                  title="Select an NGO first"
                  text="Choose a pickup partner above to create the request."
                />

              )}


              <button
                type="button"
                className="send-button"
                disabled={
                  sendingDonation ||
                  !selectedNgo ||
                  !surplusEvent ||
                  Boolean(donation)
                }
                onClick={
                  handleSendPickupRequest
                }
              >

                {sendingDonation ? (

                  <>
                    <Loader2
                      size={20}
                      className="spin"
                    />

                    Saving pickup request...

                  </>

                ) : donation ? (

                  <>
                    <CheckCircle2
                      size={20}
                    />

                    Pickup request saved

                  </>

                ) : (

                  <>
                    <Send size={20} />

                    Send pickup request

                    <ArrowRight
                      size={18}
                    />

                  </>

                )}

              </button>


              {donation && (

                <div className="firebase-confirmation">

                  <CheckCircle2
                    size={18}
                  />

                  <div>

                    <strong>
                      Notification stored in Firebase
                    </strong>

                    <span>
                      Donation ID: {donation.id}
                    </span>

                  </div>

                </div>

              )}

            </section>

          </div>


          {/* ===============================================
              RIGHT COLUMN
              =============================================== */}

          <aside className="rescue-sidebar">


            {/* PROGRESS */}

            <section className="progress-card">

              <div className="progress-header">

                <div>

                  <span>
                    RESCUE PROGRESS
                  </span>

                  <h3>
                    {progress}% complete
                  </h3>

                </div>

                <HeartHandshake
                  size={22}
                />

              </div>


              <div className="progress-track">

                <div
                  className="progress-fill"
                  style={{
                    width: `${progress}%`,
                  }}
                />

              </div>


              <div className="checklist">

                <ChecklistItem
                  checked
                  title="Surplus detected"
                  text={`${formatNumber(
                    remainingMeals
                  )} meals available`}
                />

                <ChecklistItem
                  checked={
                    Boolean(
                      surplusEvent
                    )
                  }
                  title="Surplus saved"
                  text={
                    surplusEvent
                      ? "Firebase record created"
                      : "Waiting for record"
                  }
                />

                <ChecklistItem
                  checked={
                    Boolean(
                      selectedNgo
                    )
                  }
                  title="NGO selected"
                  text={
                    selectedNgo?.name ||
                    "Waiting for selection"
                  }
                />

                <ChecklistItem
                  checked={
                    Boolean(
                      donation
                    )
                  }
                  title="Pickup request sent"
                  text={
                    donation
                      ? "Notification stored"
                      : "Waiting for notification"
                  }

                />

                <ChecklistItem
                  checked={false}
                  title="NGO accepted"
                  text="Waiting for NGO response"
                />

                <ChecklistItem
                  checked={false}
                  title="Food collected"
                  text="Waiting for pickup"
                />

              </div>

            </section>


            {/* PICKUP CARD */}

            <section className="sidebar-card">

              <div className="sidebar-card-heading">

                <div>

                  <span>
                    PICKUP DETAILS
                  </span>

                  <h3>
                    Rescue handoff
                  </h3>

                </div>

                <MapPin
                  size={20}
                />

              </div>


              <div className="sidebar-location">

                <div className="location-icon">
                  <MapPin size={21} />
                </div>

                <div>

                  <span>
                    PICKUP LOCATION
                  </span>

                  <strong>
                    {pickupLocation}
                  </strong>

                </div>

              </div>


              <div className="sidebar-details">

                <div>

                  <span>
                    MEALS
                  </span>

                  <strong>
                    {formatNumber(
                      pickupMeals ||
                      remainingMeals
                    )}
                  </strong>

                </div>


                <div>

                  <span>
                    SHELF LIFE
                  </span>

                  <strong>
                    {formattedShelfLife}
                  </strong>

                </div>

              </div>

            </section>


            {/* NGO CARD */}

            <section className="sidebar-card">

              <div className="sidebar-card-heading">

                <div>

                  <span>
                    PICKUP PARTNER
                  </span>

                  <h3>
                    {selectedNgo
                      ? selectedNgo.name
                      : "Not selected"}
                  </h3>

                </div>

                <HeartHandshake
                  size={20}
                />

              </div>


              {selectedNgo ? (

                <>

                  <div className="selected-ngo-details">

                    <div>

                      <MapPin
                        size={17}
                      />

                      <span>
                        {selectedNgo.distance}
                      </span>

                    </div>

                    <div>

                      <Phone
                        size={17}
                      />

                      <span>
                        {selectedNgo.phone}
                      </span>

                    </div>

                    <div>

                      <PackageCheck
                        size={17}
                      />

                      <span>
                        Capacity{" "}
                        {formatNumber(
                          selectedNgo.capacity
                        )}
                      </span>

                    </div>

                  </div>

                  <div className="ngo-response">

                    <span />

                    Expected response{" "}
                    {selectedNgo.responseTime}

                  </div>

                </>

              ) : (

                <div className="sidebar-empty">

                  <Users size={26} />

                  <strong>
                    No NGO selected
                  </strong>

                  <span>
                    Select a pickup partner
                    from the list.
                  </span>

                </div>

              )}

            </section>


            {/* FIREBASE WORKFLOW */}

            <section className="firebase-card">

              <div className="firebase-card-icon">
                <Database size={21} />
              </div>

              <div>

                <span>
                  FIREBASE WORKFLOW
                </span>

                <h3>
                  Persistent rescue tracking
                </h3>

                <p>
                  Pickup requests remain available
                  even after you leave this page.
                  The NGO and Dashboard can read
                  the same donation record.
                </p>

              </div>

            </section>

          </aside>

        </section>


        {/* =================================================
            BOTTOM ACTIONS
            ================================================= */}

        <section className="bottom-actions">

          <button
            type="button"
            className="secondary-action"
            onClick={handleBack}
          >
            <ArrowLeft size={17} />

            Back to meal operations

          </button>


          <button
            type="button"
            className="secondary-action"
            onClick={handleReset}
          >
            <RefreshCw size={17} />

            Reset rescue flow

          </button>


          <button
            type="button"
            className="primary-action"
            disabled={!donation}
            onClick={() =>
              navigate(
                "/dashboard"
              )
            }
          >

            Open Dashboard

            <ArrowRight size={17} />

          </button>

        </section>


        {/* =================================================
            FOOTER
            ================================================= */}

        <footer className="rescue-footer">

          <div>

            <div className="footer-logo">
              <Leaf size={16} />
            </div>

            <div>

              <strong>
                ReFeed
              </strong>

              <span>
                Predict · Prepare · Serve · Rescue · Measure
              </span>

            </div>

          </div>


          <p>
            Every saved pickup request creates a traceable
            rescue record.
          </p>

        </footer>

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

      <div className="card-step">
        {step}
      </div>

      <div className="card-header-icon">
        {icon}
      </div>

      <div>

        <h2>
          {title}
        </h2>

        <p>
          {description}
        </p>

      </div>

    </div>
  );
}


function SummaryItem({
  icon,
  label,
  value,
  highlight = false,
}) {
  return (
    <div
      className={
        highlight
          ? "summary-item highlight"
          : "summary-item"
      }
    >

      <div className="summary-icon">
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


function PickupItem({
  icon,
  label,
  value,
}) {
  return (
    <div className="pickup-item">

      <div className="pickup-icon">
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


function LockedState({
  title,
  text,
}) {
  return (
    <div className="locked-state">

      <div className="locked-icon">
        <ShieldCheck size={23} />
      </div>

      <div>

        <strong>
          {title}
        </strong>

        <span>
          {text}
        </span>

      </div>

    </div>
  );
}


function ChecklistItem({
  checked,
  title,
  text,
}) {
  return (
    <div
      className={
        checked
          ? "checklist-item checked"
          : "checklist-item"
      }
    >

      <div className="check-circle">

        {checked && (
          <Check size={14} />
        )}

      </div>

      <div>

        <strong>
          {title}
        </strong>

        <span>
          {text}
        </span>

      </div>

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
      className={
        active
          ? "flow-step active"
          : "flow-step"
      }
    >

      <div className="flow-number">

        {done ? (
          <Check size={14} />
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
      className={
        active
          ? "flow-line active"
          : "flow-line"
      }
    />
  );
}