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

import {
  updateSurplusEvent,
} from "./surplusService";

const DONATIONS_COLLECTION =
  "donations";

export const createDonation = async ({
  surplusEventId,
  date,
  mealType,
  predictedMeals = 0,
  preparedMeals = 0,
  servedMeals = 0,
  surplusMeals = 0,
  pickupLocation =
    "Main Campus Canteen",
  shelfLife = "2 hours",
  shelfLifeMinutes = 120,
  ngo,
  status = "Pickup Pending",
  notes = "",
}) => {
  if (!surplusEventId) {
    throw new Error(
      "Surplus event ID is required."
    );
  }

  if (!date) {
    throw new Error(
      "Donation date is required."
    );
  }

  if (!mealType) {
    throw new Error(
      "Meal type is required."
    );
  }

  if (!ngo?.id) {
    throw new Error(
      "NGO information is required."
    );
  }

  const donationMeals =
    Number(surplusMeals) || 0;

  if (donationMeals <= 0) {
    throw new Error(
      "Donation must contain at least one meal."
    );
  }

  const donationData = {
    surplus_event_id:
      surplusEventId,

    date,

    meal_type: mealType,

    predicted_meals:
      Number(predictedMeals) || 0,

    prepared_meals:
      Number(preparedMeals) || 0,

    served_meals:
      Number(servedMeals) || 0,

    surplus_meals:
      donationMeals,

    pickup_location:
      pickupLocation,

    shelf_life: shelfLife,

    shelf_life_minutes:
      Number(shelfLifeMinutes) || 120,

    ngo: {
      id: ngo.id,

      name: ngo.name || "",

      distance: ngo.distance || "",

      distanceKm:
        Number(ngo.distanceKm) || 0,

      capacity:
        Number(ngo.capacity) || 0,

      phone: ngo.phone || "",

      responseTime:
        ngo.responseTime || "",
    },

    status,

    notes,

    notification_sent: true,

    pickup_requested_at:
      serverTimestamp(),

    createdAt:
      serverTimestamp(),

    updatedAt:
      serverTimestamp(),
  };

  const donationRef =
    await addDoc(
      collection(
        db,
        DONATIONS_COLLECTION
      ),
      donationData
    );

  const donationId =
    donationRef.id;

  /*
   * Link donation back to
   * the surplus event.
   */
  try {
    await updateSurplusEvent({
      surplusEventId,
      status: "Donation Created",
      donationId,
    });
  } catch (error) {
    console.error(
      "Unable to link surplus event:",
      error
    );
  }

  return {
    id: donationId,
    ...donationData,
  };
};

export const getDonation = async (
  donationId
) => {
  if (!donationId) {
    throw new Error(
      "Donation ID is required."
    );
  }

  const donationRef = doc(
    db,
    DONATIONS_COLLECTION,
    donationId
  );

  const snapshot = await getDoc(
    donationRef
  );

  if (!snapshot.exists()) {
    throw new Error(
      "Donation record was not found."
    );
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
};

export const getDonations = async () => {
  const donationsRef =
    collection(
      db,
      DONATIONS_COLLECTION
    );

  const donationsQuery = query(
    donationsRef,
    orderBy("createdAt", "desc")
  );

  const snapshot =
    await getDocs(
      donationsQuery
    );

  return snapshot.docs.map(
    (item) => ({
      id: item.id,
      ...item.data(),
    })
  );
};

export const updateDonationStatus =
  async ({
    donationId,
    status,
    notes = null,
  }) => {
    if (!donationId) {
      throw new Error(
        "Donation ID is required."
      );
    }

    if (!status) {
      throw new Error(
        "Donation status is required."
      );
    }

    const donationRef = doc(
      db,
      DONATIONS_COLLECTION,
      donationId
    );

    const updateData = {
      status,
      updatedAt:
        serverTimestamp(),
    };

    if (notes !== null) {
      updateData.notes = notes;
    }

    if (
      status ===
      "Pickup In Progress"
    ) {
      updateData.pickup_started_at =
        serverTimestamp();
    }

    if (status === "Picked Up") {
      updateData.picked_up_at =
        serverTimestamp();
    }

    if (status === "Completed") {
      updateData.completed_at =
        serverTimestamp();
    }

    await updateDoc(
      donationRef,
      updateData
    );

    /*
     * Keep the linked surplus event
     * synchronized with donation status.
     */
    const donationSnapshot =
      await getDoc(donationRef);

    const donation =
      donationSnapshot.data();

    if (
      donation?.surplus_event_id
    ) {
      try {
        await updateSurplusEvent({
          surplusEventId:
            donation.surplus_event_id,
          status,
          donationId,
        });
      } catch (error) {
        console.error(
          "Unable to update linked surplus event:",
          error
        );
      }
    }

    return {
      id: donationId,
      status,
    };
  };