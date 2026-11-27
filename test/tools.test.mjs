/**
 * Verification suite for the three inline guide tools: yard coverage, curing
 * timeline and mix-ratio batching.
 *
 * Expected values are the published tables and worked examples on buildcalcs.io,
 * worked out by hand rather than read back from the implementation.
 * Run with `node --test` — no install step, no dependencies.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  BATCH_VOLUME_UNITS,
  COLD_BAND_MESSAGE,
  COVERAGE_THICKNESSES,
  CURING_BANDS,
  DEFAULT_BATCH_VOLUME,
  DEFAULT_COVERAGE_THICKNESS,
  DEFAULT_CURING_BAND,
  DEFAULT_MIX_RATIO,
  FREEZING_MESSAGE,
  HOT_BAND_NOTE,
  MIX_RATIOS,
  coverageAt,
  coverageSqFt,
  formatCoverage,
  formatParts,
  formatRange,
  formatVolume,
  runBatchTool,
  runCuringTool,
  todayIso,
} from "../src/tools.mjs";

/** Equivalent of Vitest's toBeCloseTo(expected, digits). */
const closeTo = (actual, expected, digits = 9) => {
  assert.ok(
    Math.abs(actual - expected) < 10 ** -digits / 2,
    `expected ${actual} to be close to ${expected} (${digits} digits)`,
  );
};

const POUR_DATE = "2026-11-26";

const windowOf = (pouredAt, band, stage) =>
  runCuringTool(band, pouredAt).rows.find((row) => row.stage === stage)?.window;

const at = (iso) => new Date(`${iso}T00:00:00Z`);

describe("Yard coverage slider", () => {
  it("offers six thicknesses and defaults to 4 in", () => {
    assert.deepStrictEqual(COVERAGE_THICKNESSES, [3, 3.5, 4, 5, 6, 8]);
    assert.strictEqual(DEFAULT_COVERAGE_THICKNESS, 4);
  });

  it("matches the published coverage row for every thickness", () => {
    assert.deepStrictEqual(
      COVERAGE_THICKNESSES.map((thickness) => coverageAt(thickness).display),
      ["108", "93", "81", "65", "54", "40.5"],
    );
  });

  it("is always 27 divided by thickness in feet", () => {
    for (const thickness of COVERAGE_THICKNESSES) {
      closeTo(coverageSqFt(thickness), 27 / (thickness / 12));
    }
  });

  it("shows whole square feet except an exact half", () => {
    assert.strictEqual(formatCoverage(108), "108");
    assert.strictEqual(formatCoverage(81), "81");
    assert.strictEqual(formatCoverage(40.5), "40.5");
    assert.strictEqual(formatCoverage(92.57142857142857), "93");
    assert.strictEqual(formatCoverage(64.8), "65");
  });
});

describe("Curing timeline: bands and stages", () => {
  it("has the five published temperature bands and defaults to 50–70°F", () => {
    assert.deepStrictEqual(
      CURING_BANDS.map((band) => band.label),
      [
        "50–70°F (10–21°C)",
        "Above 85°F (29°C)",
        "40–50°F (4–10°C)",
        "Below 40°F (4°C)",
        "Freezing",
      ],
    );
    assert.strictEqual(DEFAULT_CURING_BAND, "normal");
  });

  it("returns the five stages in order", () => {
    assert.deepStrictEqual(
      runCuringTool("normal", POUR_DATE).rows.map((row) => row.stage),
      [
        "Initial set",
        "Walkable",
        "Driveable (car)",
        "Forms off (vertical faces)",
        "Full design strength",
      ],
    );
  });
});

describe("Curing timeline: 50–70°F baseline", () => {
  it("places every stage on the calendar from 2026-11-26", () => {
    const { rows, error } = runCuringTool("normal", POUR_DATE);
    assert.strictEqual(error, "");
    assert.deepStrictEqual(
      rows.map((row) => row.window),
      ["26 Nov", "27–28 Nov", "3 Dec", "27 Nov", "24 Dec"],
    );
  });

  it("handles a pour that crosses the new year", () => {
    assert.strictEqual(windowOf("2026-12-20", "normal", "Full design strength"), "17 Jan");
    assert.strictEqual(windowOf("2026-12-20", "normal", "Walkable"), "21–22 Dec");
  });
});

describe("Curing timeline: hot and cold bands", () => {
  it("does not shorten the windows above 85°F, only adds the care note", () => {
    const normal = runCuringTool("normal", POUR_DATE);
    const hot = runCuringTool("hot", POUR_DATE);
    assert.deepStrictEqual(hot.rows, normal.rows);
    assert.strictEqual(hot.note, HOT_BAND_NOTE);
    assert.strictEqual(hot.message, "");
  });

  it("doubles every stage between 40 and 50°F", () => {
    assert.deepStrictEqual(
      runCuringTool("cool", POUR_DATE).rows.map((row) => row.window),
      ["26 Nov", "28–30 Nov", "10 Dec", "28 Nov", "21 Jan"],
    );
  });

  it("returns a warning instead of dates below 40°F and when freezing", () => {
    const cold = runCuringTool("cold", POUR_DATE);
    assert.deepStrictEqual(cold.rows, []);
    assert.strictEqual(cold.message, COLD_BAND_MESSAGE);

    const freezing = runCuringTool("freezing", POUR_DATE);
    assert.deepStrictEqual(freezing.rows, []);
    assert.strictEqual(freezing.message, FREEZING_MESSAGE);
    assert.ok(freezing.message.startsWith("Do not pour"));
  });
});

describe("Curing timeline: input and formatting", () => {
  it("rejects an empty or malformed pour date", () => {
    for (const bad of ["", "2026-13-40", "26/11/2026"]) {
      const { rows, error } = runCuringTool("normal", bad);
      assert.deepStrictEqual(rows, []);
      assert.strictEqual(error, "Pick a pour date to see the timeline.");
    }
  });

  it("collapses same-month ranges and writes both sides when months differ", () => {
    assert.strictEqual(formatRange(at("2026-11-27"), at("2026-11-28")), "27–28 Nov");
    assert.strictEqual(formatRange(at("2026-11-30"), at("2026-12-01")), "30 Nov – 1 Dec");
    assert.strictEqual(formatRange(at("2026-12-03"), at("2026-12-03")), "3 Dec");
  });

  it("uses the local calendar date for today", () => {
    assert.strictEqual(todayIso(new Date(2026, 0, 5)), "2026-01-05");
    assert.strictEqual(todayIso(new Date(2026, 11, 31)), "2026-12-31");
  });
});

describe("Mix-ratio batcher: ratios and defaults", () => {
  it("lists the five published ratios and defaults to 1:2:3 at 1 cu ft", () => {
    assert.deepStrictEqual(
      MIX_RATIOS.map((ratio) => ratio.label),
      ["1 : 2 : 3", "1 : 2 : 4", "1 : 3 : 3", "1 : 1.5 : 3", "1 : 3 : 6"],
    );
    assert.strictEqual(DEFAULT_MIX_RATIO, "1-2-3");
    assert.deepStrictEqual(BATCH_VOLUME_UNITS, ["cu ft", "cu yd"]);
    assert.strictEqual(DEFAULT_BATCH_VOLUME, 1);
  });

  it("splits 1 cu ft of 1:2:3 into 0.17 / 0.33 / 0.5 cu ft, six parts", () => {
    const { rows, totalParts, error } = runBatchTool(1, "cu ft", "1-2-3");
    assert.strictEqual(error, "");
    assert.deepStrictEqual(
      rows.map((row) => row.material),
      ["Cement", "Sand", "Gravel"],
    );
    assert.deepStrictEqual(
      rows.map((row) => row.cuFt),
      ["0.17", "0.33", "0.5"],
    );
    assert.strictEqual(totalParts, "6");
  });

  it("splits 1 cu yd of 1:2:3 into 0.17 / 0.33 / 0.5 cu yd", () => {
    const { rows } = runBatchTool(1, "cu yd", "1-2-3");
    assert.deepStrictEqual(
      rows.map((row) => row.cuYd),
      ["0.17", "0.33", "0.5"],
    );
    assert.deepStrictEqual(
      rows.map((row) => row.cuFt),
      ["4.5", "9", "13.5"],
    );
  });
});

describe("Mix-ratio batcher: other ratios", () => {
  it("1:2:4 is seven parts, cement is one seventh", () => {
    const { rows, totalParts } = runBatchTool(1, "cu ft", "1-2-4");
    assert.strictEqual(totalParts, "7");
    assert.deepStrictEqual(
      rows.map((row) => row.cuFt),
      ["0.14", "0.29", "0.57"],
    );
  });

  it("1:3:3 with 7 cu ft returns exact whole parts", () => {
    const { rows } = runBatchTool(7, "cu ft", "1-3-3");
    assert.deepStrictEqual(
      rows.map((row) => row.cuFt),
      ["1", "3", "3"],
    );
  });

  it("1:1.5:3 is 5.5 parts and 1:3:6 is 10 parts", () => {
    const rich = runBatchTool(5.5, "cu ft", "1-1.5-3");
    assert.strictEqual(rich.totalParts, "5.5");
    assert.deepStrictEqual(
      rich.rows.map((row) => row.cuFt),
      ["1", "1.5", "3"],
    );

    const fill = runBatchTool(10, "cu ft", "1-3-6");
    assert.strictEqual(fill.totalParts, "10");
    assert.deepStrictEqual(
      fill.rows.map((row) => row.cuFt),
      ["1", "3", "6"],
    );
  });

  it("falls back to 1:2:3 for an unknown ratio key", () => {
    assert.strictEqual(runBatchTool(1, "cu ft", "9-9-9").totalParts, "6");
  });
});

describe("Mix-ratio batcher: boundaries", () => {
  it("rejects zero, negative and non-numeric volumes", () => {
    for (const bad of [0, -1, Number.NaN, Number("")]) {
      const { rows, error } = runBatchTool(bad, "cu ft", "1-2-3");
      assert.deepStrictEqual(rows, []);
      assert.strictEqual(error, "Enter a volume greater than zero.");
    }
  });

  it("formats volumes with at most two decimals and no trailing zeros", () => {
    assert.strictEqual(formatVolume(0.1666666), "0.17");
    assert.strictEqual(formatVolume(0.5), "0.5");
    assert.strictEqual(formatVolume(1), "1");
    assert.strictEqual(formatVolume(13.5), "13.5");
    assert.strictEqual(formatParts(5.5), "5.5");
    assert.strictEqual(formatParts(6), "6");
  });
});
