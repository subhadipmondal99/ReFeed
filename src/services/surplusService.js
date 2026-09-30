import { addDocument } from "../firebase/firestore";

export const SURPLUS_THRESHOLD = 20;

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
  return Number(remainingMeals) > SURPLUS_THRESHOLD;
};

export const createSurplusEvent = async ({
  canteenId,
  prepared,
  served,
  location,
  shelfLifeMinutes = 120,
}) => {
  const remaining =
    calculateRemainingMeals({
      prepared,
      served,
    });

  if (!isSurplus(remaining)) {
    return {
      surplus: false,
      remaining,
    };
  }

  const surplusData = {
    canteenId,
    prepared,
    served,
    remaining,
    location,
    shelfLifeMinutes,
    status: "available",
    detectedAt: new Date().toISOString(),
  };

  const id = await addDocument(
    "surplus_events",
    surplusData
  );

  return {
    surplus: true,
    remaining,
    id,
  };
};