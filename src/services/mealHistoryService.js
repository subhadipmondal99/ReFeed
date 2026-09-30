import {
    addDoc,
    collection,
    getDocs,
    serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase/auth";

/* =========================================================
   COLLECTION
   ========================================================= */

const MEAL_HISTORY_COLLECTION = "meal_history";

/* =========================================================
   HELPERS
   ========================================================= */

const toNumber = (value, fallback = 0) => {
    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : fallback;
};

const isValidNumber = (value) => {
    return (
        value !== null &&
        value !== undefined &&
        value !== "" &&
        Number.isFinite(Number(value))
    );
};

const normalizeMealType = (mealType) => {
    if (!mealType) return "";

    const value = String(mealType)
        .trim()
        .toLowerCase();

    if (value === "lunch") {
        return "Lunch";
    }

    if (value === "dinner") {
        return "Dinner";
    }

    return String(mealType).trim();
};

const normalizeDate = (date) => {
    if (!date) return "";

    return String(date).slice(0, 10);
};

const sortAscending = (records) => {
    return [...records].sort((a, b) =>
        String(a.date || "").localeCompare(
            String(b.date || "")
        )
    );
};

const sortDescending = (records) => {
    return [...records].sort((a, b) =>
        String(b.date || "").localeCompare(
            String(a.date || "")
        )
    );
};

const normalizeMealRecord = (doc) => {
    const data = doc.data();

    return {
        id: doc.id,

        date: data.date || "",

        meal_type:
            data.meal_type ||
            data.mealType ||
            "",

        actual_headcount: isValidNumber(
            data.actual_headcount
        )
            ? Number(data.actual_headcount)
            : null,

        predicted_meals: isValidNumber(
            data.predicted_meals
        )
            ? Number(data.predicted_meals)
            : null,

        cooked_meals: isValidNumber(
            data.cooked_meals
        )
            ? Number(data.cooked_meals)
            : null,

        served_meals: isValidNumber(
            data.served_meals
        )
            ? Number(data.served_meals)
            : null,

        surplus_meals: isValidNumber(
            data.surplus_meals
        )
            ? Number(data.surplus_meals)
            : null,

        day_type:
            data.day_type ||
            "regular",

        campus_population: isValidNumber(
            data.campus_population
        )
            ? Number(data.campus_population)
            : 0,

        createdAt:
            data.createdAt || null,
    };
};

/* =========================================================
   ADD MEAL HISTORY
   ========================================================= */

/**
 * Save an actual meal operations record.
 *
 * actual_headcount is the ML target variable.
 */
export const addMealHistory = async ({
    date,
    mealType,
    actualHeadcount,
    predictedMeals = null,
    cookedMeals = null,
    servedMeals = null,
    surplusMeals = null,
    dayType = "regular",
    campusPopulation = 1000,
}) => {
    const normalizedDate =
        normalizeDate(date);

    const normalizedMealType =
        normalizeMealType(mealType);

    /* -------------------------------------------------------
       Validation
       ------------------------------------------------------- */

    if (!normalizedDate) {
        throw new Error(
            "Meal date is required."
        );
    }

    if (!normalizedMealType) {
        throw new Error(
            "Meal type is required."
        );
    }

    if (!isValidNumber(actualHeadcount)) {
        throw new Error(
            "Valid actual headcount is required."
        );
    }

    if (
        cookedMeals !== null &&
        cookedMeals !== undefined &&
        cookedMeals !== "" &&
        !isValidNumber(cookedMeals)
    ) {
        throw new Error(
            "Valid cooked meal count is required."
        );
    }

    if (
        servedMeals !== null &&
        servedMeals !== undefined &&
        servedMeals !== "" &&
        !isValidNumber(servedMeals)
    ) {
        throw new Error(
            "Valid served meal count is required."
        );
    }

    if (
        surplusMeals !== null &&
        surplusMeals !== undefined &&
        surplusMeals !== "" &&
        !isValidNumber(surplusMeals)
    ) {
        throw new Error(
            "Valid surplus meal count is required."
        );
    }

    const actual =
        Math.max(
            0,
            Math.round(
                Number(actualHeadcount)
            )
        );

    const predicted =
        predictedMeals !== null &&
            predictedMeals !== undefined &&
            predictedMeals !== ""
            ? Math.max(
                0,
                Math.round(
                    Number(predictedMeals)
                )
            )
            : null;

    const cooked =
        cookedMeals !== null &&
            cookedMeals !== undefined &&
            cookedMeals !== ""
            ? Math.max(
                0,
                Math.round(
                    Number(cookedMeals)
                )
            )
            : null;

    const served =
        servedMeals !== null &&
            servedMeals !== undefined &&
            servedMeals !== ""
            ? Math.max(
                0,
                Math.round(
                    Number(servedMeals)
                )
            )
            : actual;

    const calculatedSurplus =
        cooked !== null
            ? Math.max(
                0,
                cooked - served
            )
            : null;

    const surplus =
        surplusMeals !== null &&
            surplusMeals !== undefined &&
            surplusMeals !== ""
            ? Math.max(
                0,
                Math.round(
                    Number(surplusMeals)
                )
            )
            : calculatedSurplus;

    /* -------------------------------------------------------
       Firestore record
       ------------------------------------------------------- */

    const mealRecord = {
        date: normalizedDate,

        meal_type:
            normalizedMealType,

        actual_headcount:
            actual,

        predicted_meals:
            predicted,

        cooked_meals:
            cooked,

        served_meals:
            served,

        surplus_meals:
            surplus,

        day_type:
            dayType || "regular",

        campus_population:
            Math.max(
                0,
                Math.round(
                    toNumber(
                        campusPopulation,
                        1000
                    )
                )
            ),

        createdAt:
            serverTimestamp(),
    };

    /* -------------------------------------------------------
       Save
       ------------------------------------------------------- */

    const document = await addDoc(
        collection(
            db,
            MEAL_HISTORY_COLLECTION
        ),
        mealRecord
    );

    return {
        id: document.id,
        ...mealRecord,
    };
};

/* =========================================================
   GET ALL MEAL HISTORY
   ========================================================= */

/**
 * Fetch meal history without Firestore composite indexes.
 *
 * Filtering and sorting are intentionally performed
 * client-side.
 */
export const getMealHistory = async ({
    mealType = null,
    maxRecords = 1000,
} = {}) => {
    const snapshot =
        await getDocs(
            collection(
                db,
                MEAL_HISTORY_COLLECTION
            )
        );

    let records =
        snapshot.docs.map(
            normalizeMealRecord
        );

    if (mealType) {
        const normalized =
            normalizeMealType(
                mealType
            );

        records = records.filter(
            (record) =>
                normalizeMealType(
                    record.meal_type
                ) === normalized
        );
    }

    records =
        sortAscending(records);

    if (
        Number.isFinite(
            Number(maxRecords)
        ) &&
        Number(maxRecords) > 0
    ) {
        records = records.slice(
            0,
            Number(maxRecords)
        );
    }

    return records;
};

/* =========================================================
   GET HISTORY BY MEAL TYPE
   ========================================================= */

export const getMealHistoryByMealType =
    async (
        mealType,
        maxRecords = 1000
    ) => {
        if (!mealType) {
            throw new Error(
                "Meal type is required."
            );
        }

        return getMealHistory({
            mealType,
            maxRecords,
        });
    };

/* =========================================================
   GET HISTORICAL DEMAND BEFORE FORECAST DATE
   ========================================================= */

/**
 * Returns records:
 *
 * meal_type === selected meal type
 * AND
 * date < forecast date
 *
 * No composite Firestore index is required.
 */
export const getHistoricalDemandBeforeDate =
    async (
        mealType,
        forecastDate,
        maxRecords = 1000
    ) => {
        if (!mealType) {
            throw new Error(
                "Meal type is required."
            );
        }

        if (!forecastDate) {
            throw new Error(
                "Forecast date is required."
            );
        }

        const normalizedMealType =
            normalizeMealType(
                mealType
            );

        const normalizedForecastDate =
            normalizeDate(
                forecastDate
            );

        const snapshot =
            await getDocs(
                collection(
                    db,
                    MEAL_HISTORY_COLLECTION
                )
            );

        let records =
            snapshot.docs.map(
                normalizeMealRecord
            );

        /* -------------------------------------------------------
           Filter meal type
           ------------------------------------------------------- */

        records = records.filter(
            (record) =>
                normalizeMealType(
                    record.meal_type
                ) === normalizedMealType
        );

        /* -------------------------------------------------------
           Only historical records
           ------------------------------------------------------- */

        records = records.filter(
            (record) =>
                record.date &&
                String(record.date) <
                String(
                    normalizedForecastDate
                )
        );

        /* -------------------------------------------------------
           Chronological order
           ------------------------------------------------------- */

        records =
            sortAscending(records);

        /* -------------------------------------------------------
           Keep the most recent records
           ------------------------------------------------------- */

        if (
            Number.isFinite(
                Number(maxRecords)
            ) &&
            Number(maxRecords) > 0
        ) {
            records = records.slice(
                -Number(maxRecords)
            );
        }

        return records;
    };

/* =========================================================
   GET RECENT HISTORY
   ========================================================= */

export const getRecentMealHistory =
    async ({
        mealType = null,
        maxRecords = 30,
    } = {}) => {
        const snapshot =
            await getDocs(
                collection(
                    db,
                    MEAL_HISTORY_COLLECTION
                )
            );

        let records =
            snapshot.docs.map(
                normalizeMealRecord
            );

        if (mealType) {
            const normalized =
                normalizeMealType(
                    mealType
                );

            records = records.filter(
                (record) =>
                    normalizeMealType(
                        record.meal_type
                    ) === normalized
            );
        }

        records =
            sortDescending(records);

        if (
            Number.isFinite(
                Number(maxRecords)
            ) &&
            Number(maxRecords) > 0
        ) {
            records = records.slice(
                0,
                Number(maxRecords)
            );
        }

        return records;
    };

/* =========================================================
   SEED DEMO HISTORY
   ========================================================= */

/**
 * Creates 30 days of Lunch + Dinner demo data.
 *
 * Duplicate-safe:
 * Existing date + meal_type records are skipped.
 */
export const seedDemoMealHistory =
    async () => {
        const existing =
            await getMealHistory({
                maxRecords: 10000,
            });

        const existingKeys =
            new Set(
                existing.map(
                    (record) =>
                        `${record.date}_${normalizeMealType(
                            record.meal_type
                        )}`
                )
            );

        const demoRecords = [];

        const startDate =
            new Date("2026-08-01");

        /* -------------------------------------------------------
           Create 30 days
           ------------------------------------------------------- */

        for (
            let i = 0;
            i < 30;
            i += 1
        ) {
            const currentDate =
                new Date(startDate);

            currentDate.setDate(
                startDate.getDate() + i
            );

            const dateString =
                currentDate
                    .toISOString()
                    .split("T")[0];

            const dayOfWeek =
                currentDate.getDay();

            const isWeekend =
                dayOfWeek === 0 ||
                dayOfWeek === 6;

            const lunchBase =
                isWeekend
                    ? 420
                    : 580;

            const dinnerBase =
                isWeekend
                    ? 350
                    : 500;

            const variation =
                Math.floor(
                    Math.random() * 61
                ) - 30;

            /* -----------------------------------------------------
               Lunch
               ----------------------------------------------------- */

            const lunchActual =
                lunchBase + variation;

            const lunchCooked =
                lunchActual + 15;

            const lunchSurplus =
                Math.max(
                    0,
                    lunchCooked -
                    lunchActual
                );

            const lunchKey =
                `${dateString}_Lunch`;

            if (
                !existingKeys.has(
                    lunchKey
                )
            ) {
                demoRecords.push({
                    date: dateString,
                    mealType: "Lunch",

                    actualHeadcount:
                        lunchActual,

                    predictedMeals:
                        Math.max(
                            0,
                            lunchActual - 5
                        ),

                    cookedMeals:
                        lunchCooked,

                    servedMeals:
                        lunchActual,

                    surplusMeals:
                        lunchSurplus,

                    dayType:
                        isWeekend
                            ? "holiday"
                            : "regular",

                    campusPopulation:
                        1000,
                });
            }

            /* -----------------------------------------------------
               Dinner
               ----------------------------------------------------- */

            const dinnerActual =
                dinnerBase + variation;

            const dinnerCooked =
                dinnerActual + 15;

            const dinnerSurplus =
                Math.max(
                    0,
                    dinnerCooked -
                    dinnerActual
                );

            const dinnerKey =
                `${dateString}_Dinner`;

            if (
                !existingKeys.has(
                    dinnerKey
                )
            ) {
                demoRecords.push({
                    date: dateString,
                    mealType: "Dinner",

                    actualHeadcount:
                        dinnerActual,

                    predictedMeals:
                        Math.max(
                            0,
                            dinnerActual - 5
                        ),

                    cookedMeals:
                        dinnerCooked,

                    servedMeals:
                        dinnerActual,

                    surplusMeals:
                        dinnerSurplus,

                    dayType:
                        isWeekend
                            ? "holiday"
                            : "regular",

                    campusPopulation:
                        1000,
                });
            }
        }

        /* -------------------------------------------------------
           Save missing records
           ------------------------------------------------------- */

        const results = [];

        for (
            const record of demoRecords
        ) {
            const result =
                await addMealHistory(
                    record
                );

            results.push(result);
        }

        return {
            created:
                results.length,

            skipped:
                60 -
                results.length,

            records:
                results,
        };
    };