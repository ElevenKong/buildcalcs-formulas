/**
 * Unit systems, field metadata, defaults and conversion helpers used by the
 * calculators on buildcalcs.io. Copy of the site's shared unit configuration as
 * plain, dependency-free ESM so the numbers can be reproduced independently.
 *
 * Conversion direction:
 * - length / linear: imperial defaults ft / in, metric display m / mm
 * - volumeRate / areaRate: imperial $/yd³ and $/ft², metric $/m³ and $/m²
 *   (a price per unit goes the other way, hence factors greater than one)
 * - percent / count / price: unit-system independent
 */

/** Exact conversion factors: 1 ft = 0.3048 m, 1 in = 25.4 mm, 1 m³ = 1.30795 yd³, 1 m² = 10.7639 ft² */
const FT_TO_M = 0.3048;
const IN_TO_MM = 25.4;
const M3_TO_YD3 = 1.30795061931439;
const M2_TO_FT2 = 10.7639104167097;

/** Imperial base value → metric display value; 1 means the value does not change */
const METRIC_FACTOR = {
  length: FT_TO_M,
  linear: IN_TO_MM,
  percent: 1,
  count: 1,
  price: 1,
  volumeRate: M3_TO_YD3,
  areaRate: M2_TO_FT2,
};

/** Display suffixes, shared by form labels and accessibility text */
const UNIT_SUFFIX = {
  us: {
    length: "ft",
    linear: "in",
    percent: "%",
    count: "",
    price: "$",
    volumeRate: "$/yd³",
    areaRate: "$/ft²",
  },
  metric: {
    length: "m",
    linear: "mm",
    percent: "%",
    count: "",
    price: "$",
    volumeRate: "$/m³",
    areaRate: "$/m²",
  },
};

/** Full unit names for screen readers */
const UNIT_WORDS = {
  ft: "feet",
  in: "inches",
  m: "metres",
  mm: "millimetres",
  "%": "percent",
};

/** Field metadata: label, measurement kind and validation flags */
export const FIELD_SPECS = {
  length: { label: "Length", kind: "length" },
  width: { label: "Width", kind: "length" },
  depth: { label: "Depth", kind: "length" },
  height: { label: "Wall height", kind: "length" },
  thick: { label: "Thickness", kind: "linear" },
  diameter: { label: "Diameter", kind: "linear" },
  postWidth: { label: "Post width", kind: "linear", optional: true },
  postDepth: { label: "Post breadth", kind: "linear", optional: true },
  postDiameter: { label: "Post diameter", kind: "linear", optional: true },
  count: { label: "Quantity", kind: "count" },
  waste: { label: "Waste allowance", kind: "percent", optional: true, nonnegative: true },
  lap: { label: "Lap splices + cut waste", kind: "percent", optional: true, nonnegative: true },
  spacing: { label: "Bar spacing", kind: "linear" },
  price: { label: "Unit price (optional)", kind: "price", optional: true, nonnegative: true },
  material: { label: "Ready-mix rate", kind: "volumeRate", nonnegative: true },
  labor: { label: "Labor rate", kind: "areaRate", nonnegative: true },
  base: { label: "Base & forms", kind: "areaRate", optional: true, nonnegative: true },
  delivery: { label: "Delivery fee", kind: "price", optional: true, nonnegative: true },
};

const US_DEFAULTS = {
  length: 10,
  width: 10,
  thick: 4,
  depth: 2,
  holeDepth: 24,
  tubeDepth: 4,
  height: 8,
  diameter: 8,
  tubeDiameter: 12,
  postWidth: 4,
  postDepth: 4,
  postDiameter: 4,
  count: 1,
  waste: 5,
  lap: 10,
  spacing: 12,
  price: "",
  material: 165,
  labor: 5,
  base: 1.5,
  delivery: 0,
};

// Near-equivalent physical sizes, rounded to numbers commonly used in each system:
// 3 m ≈ 10 ft, 100 mm ≈ 4 in, 600 mm ≈ 24 in, 200 mm ≈ 8 in, 300 mm ≈ 12 in.
const METRIC_DEFAULTS = {
  length: 3,
  width: 3,
  thick: 100,
  depth: 0.6,
  holeDepth: 600,
  tubeDepth: 1.2,
  height: 2.4,
  diameter: 200,
  tubeDiameter: 300,
  postWidth: 100,
  postDepth: 100,
  postDiameter: 100,
  count: 1,
  waste: 5,
  lap: 10,
  spacing: 300,
  price: "",
  material: 216,
  labor: 54,
  base: 16,
  delivery: 0,
};

export const UNIT_SYSTEMS = {
  us: { defaults: US_DEFAULTS },
  metric: { defaults: METRIC_DEFAULTS },
};

/** Only these three page flags affect the default set selected. */
export const defaultsFor = (system, ctx) => {
  const { depth, holeDepth, tubeDepth, diameter, tubeDiameter, ...rest } =
    UNIT_SYSTEMS[system].defaults;
  return {
    ...rest,
    length: ctx.steel ? "" : rest.length,
    width: ctx.steel ? "" : rest.width,
    depth: ctx.holes ? holeDepth : ctx.tube ? tubeDepth : depth,
    diameter: ctx.tube ? tubeDiameter : diameter,
  };
};

/** Defaults for an additional Sonotube pier group, from the same source. */
export const pierDefaults = (system) => {
  const d = UNIT_SYSTEMS[system].defaults;
  return { diameter: d.tubeDiameter, depth: d.tubeDepth, count: d.count };
};

/**
 * Imperial is the default only where SI has not been formally adopted:
 * the United States, Liberia and Myanmar. Bare `en` is treated as US English.
 * Other English variants and all non-English languages default to metric.
 */
const IMPERIAL_LANGUAGES = /^en(-(us|lr|mm))?$/;

export const preferredUnitSystem = (lang) =>
  IMPERIAL_LANGUAGES.test((lang || "").toLowerCase()) ? "us" : "metric";

const factor = (kind, system) =>
  system === "metric" ? METRIC_FACTOR[kind] : 1;

/** Display value → formula base value (ft / in / $ per yd³ / $ per ft²) */
export const normalizeValue = (raw, kind, system) =>
  Number(raw) / factor(kind, system);

/**
 * Convert the same quantity between display systems.
 * Empty values stay empty; results keep four decimals to avoid repeating
 * fractions leaking into input fields.
 */
export const convertValue = (raw, kind, from, to) => {
  if (raw === "" || raw === null || raw === undefined) {
    return "";
  }
  const value = Number(raw);
  if (Number.isNaN(value)) {
    return raw;
  }
  const converted = (value / factor(kind, from)) * factor(kind, to);
  return Number(converted.toFixed(4));
};

/** Suffix shown for a field in the given unit system. */
export const unitOf = (kind, system) => UNIT_SUFFIX[system][kind];

/** Readable word for a suffix; empty string when there is no match. */
export const unitWord = (suffix) => UNIT_WORDS[suffix] ?? "";
