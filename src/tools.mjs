/**
 * Reference implementation of the three inline tools published inside the practical
 * guides on buildcalcs.io: a yard-coverage slider, a curing-timeline date calculator
 * and a mix-ratio batcher.
 *
 * Dependency-free ES modules, same arithmetic as the site, verified by `node --test`.
 * Unit conventions follow ./calculations.mjs: volumes are cubic feet internally,
 * cubic yards divide by 27, and dates are calendar days with no time of day.
 */

import { CU_FT_PER_YD } from "./calculations.mjs";

/* ------------------------------------------------------------------ */
/* Yard coverage: one cubic yard spread at a given thickness            */
/* ------------------------------------------------------------------ */

/** Thicknesses offered by the slider, inches */
export const COVERAGE_THICKNESSES = [3, 3.5, 4, 5, 6, 8];

/** Default thickness, inches */
export const DEFAULT_COVERAGE_THICKNESS = 4;

/** Square feet covered by one cubic yard at a thickness in inches. */
export const coverageSqFt = (thicknessIn) => CU_FT_PER_YD / (thicknessIn / 12);

/**
 * Display rule: whole square feet, except an exact half (27 ÷ (8/12) = 40.5),
 * which keeps one decimal. 27 ÷ (3.5/12) = 92.57 shows as 93 and
 * 27 ÷ (5/12) = 64.8 shows as 65, matching the published coverage table.
 */
export const formatCoverage = (sqFt) => {
  const doubled = sqFt * 2;
  const isHalf = Math.abs(doubled - Math.round(doubled)) < 1e-9;
  return isHalf && !Number.isInteger(sqFt)
    ? sqFt.toFixed(1)
    : String(Math.round(sqFt));
};

/** Slider reading: thickness, raw area and the displayed value. */
export const coverageAt = (thicknessIn) => {
  const sqFt = coverageSqFt(thicknessIn);
  return { thicknessIn, sqFt, display: formatCoverage(sqFt) };
};

/* ------------------------------------------------------------------ */
/* Curing timeline: standard stage windows placed on a calendar        */
/* ------------------------------------------------------------------ */

const HOURS_PER_DAY = 24;
/** 40–50°F roughly doubles the wait for each stage; no other band is scaled. */
const COLD_BAND_MULTIPLIER = 2;

/** Temperature bands, in the order of the published curing table. */
export const CURING_BANDS = [
  { key: "normal", label: "50–70°F (10–21°C)" },
  { key: "hot", label: "Above 85°F (29°C)" },
  { key: "cool", label: "40–50°F (4–10°C)" },
  { key: "cold", label: "Below 40°F (4°C)" },
  { key: "freezing", label: "Freezing" },
];

/** Default band: the normal-weather timetable. */
export const DEFAULT_CURING_BAND = "normal";

/** Above 85°F the windows are not shortened — only the first-24-hour care changes. */
export const HOT_BAND_NOTE =
  "Above 85°F it sets and cures faster but cracks more. The dates above stay the same — what changes is that you must cover or mist the surface within the first 24 hours.";

/** Below 40°F no day count is reliable. */
export const COLD_BAND_MESSAGE =
  "Below 40°F (4°C) the cement reaction nearly stops, so no reliable day count applies. Protect the pour — insulation, blankets or a heated enclosure — and re-check once the temperature is back above 40°F.";

/** Freezing water destroys the mix; do not pour. */
export const FREEZING_MESSAGE =
  "Do not pour. Water freezing inside the mix expands and destroys the concrete — wait until the forecast stays above 40°F (4°C) day and night.";

/** Standard stage windows at 50–70°F, in hours; start === end is a single point. */
const NORMAL_WINDOWS = [
  { stage: "Initial set", startHours: 2, endHours: 4 },
  { stage: "Walkable", startHours: 24, endHours: 48 },
  {
    stage: "Driveable (car)",
    startHours: 7 * HOURS_PER_DAY,
    endHours: 7 * HOURS_PER_DAY,
  },
  { stage: "Forms off (vertical faces)", startHours: 24, endHours: 24 },
  {
    stage: "Full design strength",
    startHours: 28 * HOURS_PER_DAY,
    endHours: 28 * HOURS_PER_DAY,
  },
];

/** Today as a local calendar date, YYYY-MM-DD. */
export const todayIso = (now = new Date()) => {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const addHours = (isoDate, hours) =>
  new Date(Date.parse(`${isoDate}T00:00:00Z`) + hours * 60 * 60 * 1000);

const formatDay = (date) =>
  date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });

/**
 * Date range text: same-month ranges collapse to "27–28 Nov", ranges that start
 * and end on the same calendar day are written once ("26 Nov"), and a range across
 * months keeps both sides ("30 Nov – 1 Dec").
 */
export const formatRange = (start, end) => {
  const sameMonth =
    start.getUTCFullYear() === end.getUTCFullYear() &&
    start.getUTCMonth() === end.getUTCMonth();
  // A 2–4 hour window starts and ends on different timestamps but the same day.
  if (sameMonth && start.getUTCDate() === end.getUTCDate()) {
    return formatDay(start);
  }
  return sameMonth
    ? `${start.getUTCDate()}–${formatDay(end)}`
    : `${formatDay(start)} – ${formatDay(end)}`;
};

const windowsFor = (band) =>
  band === "cool"
    ? NORMAL_WINDOWS.map((window) => ({
        stage: window.stage,
        startHours: window.startHours * COLD_BAND_MULTIPLIER,
        endHours: window.endHours * COLD_BAND_MULTIPLIER,
      }))
    : NORMAL_WINDOWS;

/**
 * Stage dates for a pour date and temperature band.
 * Returns rows, a note, a message when no dates apply, or an error.
 */
export const runCuringTool = (band, pourDate) => {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(pourDate) ||
    Number.isNaN(Date.parse(`${pourDate}T00:00:00Z`))
  ) {
    return {
      rows: [],
      note: "",
      message: "",
      error: "Pick a pour date to see the timeline.",
    };
  }
  if (band === "freezing") {
    return { rows: [], note: "", message: FREEZING_MESSAGE, error: "" };
  }
  if (band === "cold") {
    return { rows: [], note: "", message: COLD_BAND_MESSAGE, error: "" };
  }
  return {
    rows: windowsFor(band).map((window) => ({
      stage: window.stage,
      window: formatRange(
        addHours(pourDate, window.startHours),
        addHours(pourDate, window.endHours),
      ),
    })),
    note: band === "hot" ? HOT_BAND_NOTE : "",
    message: "",
    error: "",
  };
};

/* ------------------------------------------------------------------ */
/* Mix-ratio batcher: volume x parts -> cement, sand and gravel        */
/* ------------------------------------------------------------------ */

/** Ratios by use, in the order of the published table. */
export const MIX_RATIOS = [
  { key: "1-2-3", label: "1 : 2 : 3", parts: [1, 2, 3] },
  { key: "1-2-4", label: "1 : 2 : 4", parts: [1, 2, 4] },
  { key: "1-3-3", label: "1 : 3 : 3", parts: [1, 3, 3] },
  { key: "1-1.5-3", label: "1 : 1.5 : 3", parts: [1, 1.5, 3] },
  { key: "1-3-6", label: "1 : 3 : 6", parts: [1, 3, 6] },
];

/** Default ratio. */
export const DEFAULT_MIX_RATIO = "1-2-3";

/** Volume input units. */
export const BATCH_VOLUME_UNITS = ["cu ft", "cu yd"];

/** Default volume, in cubic feet. */
export const DEFAULT_BATCH_VOLUME = 1;

const MATERIALS = ["Cement", "Sand", "Gravel"];

/** At most two decimals, trailing zeros dropped: 0.1667 -> 0.17, 0.5 -> 0.5. */
export const formatVolume = (value) => {
  const fixed = value.toFixed(2);
  return fixed.replace(/\.?0+$/, "") || "0";
};

/** Parts total as text: 6, or 5.5 for a 1 : 1.5 : 3 mix. */
export const formatParts = (parts) => String(parts);

/**
 * Material volumes for a given volume and ratio.
 * Water is deliberately not converted to a volume: it is specified as about
 * 0.5 of the cement weight, which needs a bulk density the page never states.
 */
export const runBatchTool = (volume, unit, ratioKey) => {
  const ratio = MIX_RATIOS.find((item) => item.key === ratioKey) ?? MIX_RATIOS[0];
  const parsed = Number(volume);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return { rows: [], totalParts: "", error: "Enter a volume greater than zero." };
  }
  const total = ratio.parts[0] + ratio.parts[1] + ratio.parts[2];
  const volumeCuFt = unit === "cu yd" ? parsed * CU_FT_PER_YD : parsed;
  return {
    rows: MATERIALS.map((material, index) => {
      const cuFt = (volumeCuFt * ratio.parts[index]) / total;
      return {
        material,
        cuFt: formatVolume(cuFt),
        cuYd: formatVolume(cuFt / CU_FT_PER_YD),
      };
    }),
    totalParts: formatParts(total),
    error: "",
  };
};
