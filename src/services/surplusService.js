import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "../firebase/auth";

export const SURPLUS_THRESHOLD = 20;

const SURPLUS_COLLECTION = "surplus_events";

export const calculateRemainingMeals = ({
  prepared,
  served,
}) => {
  return Math.max(
    0,
    Number(prepared || 0) -
      Number(served || 0)
  );
};

export const isSurplus = (remainingMeals) => {
  return (
    Number(remainingMeals) >
    SURPLUS_THRESHOLD
  );
};

export const createSurplusEvent = async ({
  canteenId = "main-campus-canteen",
  date = "",
  mealType = "",
  predictedMeals = 0,
  prepared = 0,
  served = 0,
  dayType = "regular",
  campusPopulation = 1000,
  location = "Main Campus Canteen",
  shelfLifeMinutes = 120,
}) => {
  if (!date) {
    throw new Error(
      "Surplus date is required."
    );
  }

  if (!mealType) {
    throw new Error(
      "Meal type is required."
    );
  }

  const preparedMeals =
    Number(prepared) || 0;

  const servedMeals =
    Number(served) || 0;

  const remaining =
    calculateRemainingMeals({
      prepared: preparedMeals,
      served: servedMeals,
    });

  if (!isSurplus(remaining)) {
    return {
      surplus: false,
      remaining,
      message: `Surplus threshold not reached. At least ${SURPLUS_THRESHOLD + 1} meals are required.`,
    };
  }

  const surplusData = {
    canteen_id: canteenId,

    date,
    meal_type: mealType,

    predicted_meals:
      Number(predictedMeals) || 0,

    prepared_meals: preparedMeals,

    served_meals: servedMeals,

    remaining_meals: remaining,

    surplus_meals: remaining,

    day_type: dayType,

    campus_population:
      Number(campusPopulation) || 0,

    location,

    shelf_life_minutes:
      Number(shelfLifeMinutes) || 120,

    status: "available",

    donation_id: null,

    detectedAt: serverTimestamp(),

    createdAt: serverTimestamp(),

    updatedAt: serverTimestamp(),
  };

  const surplusRef = await addDoc(
    collection(db, SURPLUS_COLLECTION),
    surplusData
  );

  return {
    surplus: true,

    id: surplusRef.id,

    remaining,

    data: {
      id: surplusRef.id,
      ...surplusData,
    },
  };
};

export const getSurplusEvent = async (
  surplusEventId
) => {
  if (!surplusEventId) {
    throw new Error(
      "Surplus event ID is required."
    );
  }

  const surplusRef = doc(
    db,
    SURPLUS_COLLECTION,
    surplusEventId
  );

  const snapshot = await getDoc(
    surplusRef
  );

  if (!snapshot.exists()) {
    throw new Error(
      "Surplus event was not found."
    );
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
};

export const getSurplusEvents = async () => {
  const surplusRef = collection(
    db,
    SURPLUS_COLLECTION
  );

  const surplusQuery = query(
    surplusRef,
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(
    surplusQuery
  );

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));
};

export const updateSurplusEvent = async ({
  surplusEventId,
  status,
  donationId = null,
}) => {
  if (!surplusEventId) {
    throw new Error(
      "Surplus event ID is required."
    );
  }

  const surplusRef = doc(
    db,
    SURPLUS_COLLECTION,
    surplusEventId
  );

  const updateData = {
    updatedAt: serverTimestamp(),
  };

  if (status) {
    updateData.status = status;
  }

  if (donationId) {
    updateData.donation_id = donationId;
  }

  await updateDoc(
    surplusRef,
    updateData
  );

  return {
    id: surplusEventId,
    status,
    donationId,
  };
};