/**
 * Full verification suite for the nine calculator branches published on buildcalcs.io.
 *
 * These cases mirror the site's test suite one-for-one. Every expected value was
 * worked out by hand from the published formula, not read back from the implementation.
 * Run with `node --test` — no install step, no dependencies.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  BLOCKS_PER_MORTAR_BAG,
  CUBIC_FT_TO_M3,
  KG20_BAG_M3,
  KG25_BAG_M3,
  REBAR_WEIGHT,
  STICK_LENGTH_FT,
  calculateEstimate,
  display,
} from "../src/calculations.mjs";
import {
  convertValue,
  defaultsFor,
  normalizeValue,
  pierDefaults,
  preferredUnitSystem,
} from "../src/units.mjs";

/** Equivalent of Vitest's toBeCloseTo(expected, digits). */
const closeTo = (actual, expected, digits = 2) => {
  assert.ok(
    Math.abs(actual - expected) < 10 ** -digits / 2,
    `expected ${actual} to be close to ${expected} (${digits} digits)`,
  );
};

const noFlags = {
  home: false,
  block: false,
  cost: false,
  steel: false,
  tube: false,
  holes: false,
  mix: false,
  isHole: false,
  round: false,
};

const ctx = (o = {}) => ({
  unitSystem: "us",
  values: {},
  flags: noFlags,
  shape: "Slab",
  direction: "Both ways",
  bar: "4",
  post: "Square",
  morePiers: [],
  priced: false,
  ...o,
});

/** Value of a result row by label; undefined when the row is absent. */
const valueOf = (rows, label) => rows.find(([key]) => key === label)?.[1];

describe("Shared helpers: display, conversion, defaults", () => {
  it("display uses thousands separators and at most two decimals", () => {
    assert.strictEqual(display(1234.5), "1,234.5");
    assert.strictEqual(display(1.23456), "1.23");
    assert.strictEqual(display(0), "0");
  });

  it("exact conversion constants match their definitions", () => {
    closeTo(CUBIC_FT_TO_M3, 0.028316846592, 12);
    closeTo(1 / CUBIC_FT_TO_M3, 35.31466672148859, 6);
  });

  it("normalizeValue: display value → formula base ft / in / $ per yd³", () => {
    assert.strictEqual(normalizeValue(10, "length", "us"), 10);
    closeTo(normalizeValue(3.048, "length", "metric"), 10, 10);
    closeTo(normalizeValue(25.4, "linear", "metric"), 1, 10);
    closeTo(normalizeValue(165, "volumeRate", "metric"), 126.0, 0);
    assert.strictEqual(normalizeValue(5, "percent", "metric"), 5);
  });

  it("convertValue: round trip, empty values preserved, four decimals", () => {
    assert.strictEqual(convertValue(10, "length", "us", "metric"), 3.048);
    assert.strictEqual(convertValue(3, "length", "metric", "us"), 9.8425);
    assert.strictEqual(convertValue("", "length", "us", "metric"), "");
    assert.strictEqual(convertValue("abc", "length", "us", "metric"), "abc");
  });

  it("preferredUnitSystem: bare en means US, other English variants metric", () => {
    assert.strictEqual(preferredUnitSystem("en-US"), "us");
    assert.strictEqual(preferredUnitSystem("en"), "us");
    assert.strictEqual(preferredUnitSystem("en-CA"), "metric");
    assert.strictEqual(preferredUnitSystem("fr-FR"), "metric");
    assert.strictEqual(preferredUnitSystem(), "metric");
  });

  it("defaultsFor / pierDefaults: page context and unit system", () => {
    // Every calculator opens on a worked example, so no required default may be blank.
    for (const system of ["us", "metric"]) {
      for (const pageCtx of [
        { holes: false, tube: false },
        { holes: true, tube: false },
        { holes: false, tube: true },
      ]) {
        for (const [key, value] of Object.entries(defaultsFor(system, pageCtx))) {
          // price is the one optional input: empty means "no cost line"
          if (key === "price") {
            continue;
          }
          assert.strictEqual(typeof value, "number", `${system}.${key}`);
        }
      }
    }
    assert.strictEqual(
      defaultsFor("us", { holes: true, tube: false }).depth,
      24,
    );
    assert.strictEqual(
      defaultsFor("us", { holes: false, tube: true }).diameter,
      12,
    );
    assert.deepStrictEqual(pierDefaults("metric"), {
      diameter: 300,
      depth: 1.2,
      count: 1,
    });
  });
});

describe("Rectangular volume (home / slab / yard)", () => {
  const slab = (waste, unitSystem = "us") =>
    ctx({
      unitSystem,
      flags: noFlags,
      values:
        unitSystem === "us"
          ? { length: 10, width: 10, thick: 4, waste }
          : {
              length: 3 / 0.3048,
              width: 3 / 0.3048,
              thick: 100 / 25.4,
              waste,
            },
    });

  it("10×10 ft × 4 in, 0% waste: 1.23 yd³ / 33.33 ft³", () => {
    const { rows, error } = calculateEstimate(slab(0));
    assert.strictEqual(error, "");
    assert.strictEqual(valueOf(rows, "Concrete volume"), "1.23 yd³");
    assert.strictEqual(valueOf(rows, "Metric volume (m³)"), undefined);
    assert.strictEqual(valueOf(rows, "Volume for bags"), "33.33 ft³");
    assert.strictEqual(valueOf(rows, "80 lb bags"), "56 bags");
    assert.strictEqual(valueOf(rows, "60 lb bags"), "75 bags");
  });

  it("5% waste applies to volume and bags; net volume is a separate row (metric)", () => {
    const { rows } = calculateEstimate(slab(5, "metric"));
    assert.strictEqual(valueOf(rows, "Concrete volume"), "0.95 m³");
    assert.strictEqual(valueOf(rows, "Concrete volume (yd³)"), undefined);
    assert.strictEqual(valueOf(rows, "Net volume"), "0.9 m³");
    assert.strictEqual(valueOf(rows, "Net volume (yd³)"), undefined);
    assert.strictEqual(valueOf(rows, "20 kg bags"), "101 bags");
    assert.strictEqual(valueOf(rows, "25 kg bags"), "81 bags");
    assert.strictEqual(valueOf(rows, "80 lb bags"), undefined);
    assert.deepStrictEqual(
      rows.filter(([label]) => /bags/i.test(label)).map(([label]) => label),
      ["20 kg bags", "25 kg bags"],
    );
  });

  it("bag yield constants match the published size table", () => {
    closeTo(KG25_BAG_M3, 0.0117, 6);
    closeTo(KG20_BAG_M3, 0.00936, 6);
    assert.strictEqual(REBAR_WEIGHT["4"], 0.668);
    assert.strictEqual(STICK_LENGTH_FT, 20);
  });

  it("home shows a ready-mix price range; slab does not", () => {
    const home = calculateEstimate({
      ...slab(0),
      flags: { ...noFlags, home: true },
    });
    assert.strictEqual(
      valueOf(home.rows, "Ready-mix material"),
      "$160.49–$222.22",
    );
    assert.strictEqual(
      valueOf(calculateEstimate(slab(0)).rows, "Ready-mix material"),
      undefined,
    );
  });

  it("floating point boundary: an exact bag count must not round up twice", () => {
    const { rows } = calculateEstimate(
      ctx({ values: { length: 10, width: 10.08, thick: 4, waste: 0 } }),
    );
    assert.strictEqual(valueOf(rows, "80 lb bags"), "56 bags");
  });

  it("boundary: an extremely thin slab produces no Infinity", () => {
    const { rows, error } = calculateEstimate(
      ctx({ values: { length: 10, width: 10, thick: 0.000001, waste: 0 } }),
    );
    assert.strictEqual(error, "");
    assert.strictEqual(valueOf(rows, "Volume for bags"), "0 ft³");
  });
});

describe("Quikrete branch", () => {
  it("10×10×4 in, 0% waste: all five US retail bag sizes", () => {
    const { rows } = calculateEstimate(
      ctx({
        flags: { ...noFlags, mix: true },
        values: { length: 10, width: 10, thick: 4, waste: 0 },
      }),
    );
    assert.strictEqual(valueOf(rows, "40 lb bags"), "112 bags");
    assert.strictEqual(valueOf(rows, "50 lb bags"), "89 bags");
    assert.strictEqual(valueOf(rows, "60 lb bags"), "75 bags");
    assert.strictEqual(valueOf(rows, "80 lb bags"), "56 bags");
    assert.strictEqual(valueOf(rows, "90 lb bags"), "50 bags");
  });

  it("price row appears only when price is set, and uses 80 lb bag count", () => {
    const base = {
      flags: { ...noFlags, mix: true },
      values: { length: 10, width: 10, thick: 4, waste: 0 },
    };
    assert.strictEqual(
      valueOf(calculateEstimate(ctx(base)).rows, "Estimated cost (80 lb)"),
      undefined,
    );
    assert.strictEqual(
      valueOf(
        calculateEstimate(
          ctx({
            ...base,
            values: { ...base.values, price: 5 },
            priced: true,
          }),
        ).rows,
        "Estimated cost (80 lb)",
      ),
      "$280",
    );
  });
});

describe("Masonry block branch", () => {
  const blockCtx = (waste) =>
    ctx({
      flags: { ...noFlags, block: true },
      values: { length: 10, height: 8, waste },
    });

  it("10×8 ft wall, 0% waste: net 90 blocks, 3 mortar bags, 8 per course", () => {
    const { rows } = calculateEstimate(blockCtx(0));
    assert.strictEqual(valueOf(rows, "Net block count"), "90 blocks");
    assert.strictEqual(valueOf(rows, "Blocks with waste"), "90 blocks");
    assert.strictEqual(valueOf(rows, "Mortar (80 lb)"), "3 bags");
    assert.strictEqual(valueOf(rows, "Blocks per course"), "8 blocks");
    assert.strictEqual(BLOCKS_PER_MORTAR_BAG, 32);
  });

  it("metric 4.064 m wall: 10 blocks per course, no extra block from float drift", () => {
    const { rows } = calculateEstimate(
      ctx({
        unitSystem: "metric",
        flags: { ...noFlags, block: true },
        values: { length: 4.064 / 0.3048, height: 2.4 / 0.3048, waste: 0 },
      }),
    );
    assert.strictEqual(valueOf(rows, "Blocks per course"), "10 blocks");
    assert.strictEqual(valueOf(rows, "Mortar (25 kg)"), "6 bags");
    assert.strictEqual(valueOf(rows, "Mortar (80 lb)"), undefined);
  });

  it("5% waste: net 90 → order 95 blocks, mortar still 3 bags", () => {
    const { rows } = calculateEstimate(blockCtx(5));
    assert.strictEqual(valueOf(rows, "Blocks with waste"), "95 blocks");
    assert.strictEqual(valueOf(rows, "Mortar (80 lb)"), "3 bags");
  });

  it("boundary: a 1×1 ft wall still rounds up to 2 blocks", () => {
    const { rows } = calculateEstimate(
      ctx({
        flags: { ...noFlags, block: true },
        values: { length: 1, height: 1, waste: 0 },
      }),
    );
    assert.strictEqual(valueOf(rows, "Net block count"), "2 blocks");
    assert.strictEqual(valueOf(rows, "Blocks per course"), "1 blocks");
  });
});

describe("Installed cost branch", () => {
  const costCtx = (delivery) =>
    ctx({
      flags: { ...noFlags, cost: true },
      values: {
        length: 10,
        width: 10,
        thick: 4,
        waste: 5,
        material: 165,
        labor: 5,
        base: 1.5,
        delivery,
      },
    });

  it("divide by 27 before applying $/yd³; labor and base use area", () => {
    const { rows } = calculateEstimate(costCtx(0));
    assert.strictEqual(valueOf(rows, "Concrete"), "$213.89");
    assert.strictEqual(valueOf(rows, "Labor"), "$500");
    assert.strictEqual(valueOf(rows, "Base & forms"), "$150");
    assert.strictEqual(valueOf(rows, "Estimated installed cost"), "$863.89");
    assert.strictEqual(valueOf(rows, "Price per square foot"), "$8.64");
  });

  it("delivery is added to the total but not the concrete or labor rows", () => {
    const { rows } = calculateEstimate(costCtx(50));
    assert.strictEqual(valueOf(rows, "Delivery"), "$50");
    assert.strictEqual(valueOf(rows, "Estimated installed cost"), "$913.89");
    assert.strictEqual(valueOf(rows, "Concrete"), "$213.89");
  });

  it("boundary: non-integer area uses total area for the unit rate", () => {
    const { rows } = calculateEstimate(
      ctx({
        flags: { ...noFlags, cost: true },
        values: {
          length: 12.5,
          width: 8,
          thick: 6,
          waste: 0,
          material: 150,
          labor: 4,
          base: 0,
          delivery: 0,
        },
      }),
    );
    const material = ((12.5 * 8 * 0.5) / 27) * 150;
    const labor = 100 * 4;
    assert.strictEqual(
      valueOf(rows, "Estimated installed cost"),
      `$${display(material + labor)}`,
    );
    assert.strictEqual(
      valueOf(rows, "Price per square foot"),
      `$${display((material + labor) / 100)}`,
    );
  });
});

describe("Rebar branch", () => {
  const steelCtx = (overrides = {}) =>
    ctx({
      flags: { ...noFlags, steel: true },
      values: { length: 10, width: 10, spacing: 12, lap: 10 },
      bar: "4",
      direction: "Both ways",
      ...overrides,
    });

  it("two-way #4 @12 in with 10% lap: 22 bars / 242 ft / 13 sticks / 161.66 lb", () => {
    const { rows, note } = calculateEstimate(steelCtx());
    assert.strictEqual(valueOf(rows, "Bars to cut"), "22 pieces");
    assert.strictEqual(valueOf(rows, "Total bar length"), "242 linear ft");
    assert.strictEqual(valueOf(rows, "#4 stock (20 ft)"), "13 sticks");
    assert.strictEqual(valueOf(rows, "Total weight"), "161.66 lb");
    assert.ok(note.includes("not a cut list"));
  });

  it("one-way layout: the other direction is zero, length and sticks halve", () => {
    const { rows } = calculateEstimate(
      steelCtx({ direction: "Along length" }),
    );
    assert.strictEqual(valueOf(rows, "Bars to cut"), "11 pieces");
    assert.strictEqual(valueOf(rows, "Total bar length"), "121 linear ft");
    assert.strictEqual(valueOf(rows, "#4 stock (20 ft)"), "7 sticks");
  });

  it("metric 1.2 m at 300 mm centres: 4 exact spaces, 5 bars — no extra bar from float drift", () => {
    const { rows } = calculateEstimate(
      steelCtx({
        unitSystem: "metric",
        values: { length: 1.2 / 0.3048, width: 1.2 / 0.3048, spacing: 300 / 25.4, lap: 0 },
      }),
    );
    assert.strictEqual(valueOf(rows, "Bars to cut"), "10 pieces");
    assert.strictEqual(valueOf(rows, "Total bar length"), "12 m");
    assert.strictEqual(valueOf(rows, "#4 stock (20 ft)"), "2 sticks");
  });

  it("metric 3 m × 3 m at 300 mm centres converts to the same result as feet and inches", () => {
    const { rows } = calculateEstimate(
      steelCtx({
        unitSystem: "metric",
        values: { length: 3 / 0.3048, width: 3 / 0.3048, spacing: 300 / 25.4, lap: 10 },
      }),
    );
    assert.strictEqual(valueOf(rows, "Bars to cut"), "22 pieces");
    assert.strictEqual(valueOf(rows, "Total bar length"), "72.6 m");
    assert.strictEqual(valueOf(rows, "#4 stock (20 ft)"), "12 sticks");
    assert.strictEqual(valueOf(rows, "Total weight"), "72.17 kg");
  });

  it("different bar numbers use different unit weights (#3 vs #11)", () => {
    const light = calculateEstimate(steelCtx({ bar: "3" }));
    const heavy = calculateEstimate(steelCtx({ bar: "11" }));
    assert.strictEqual(valueOf(light.rows, "Total weight"), "90.99 lb");
    assert.strictEqual(valueOf(heavy.rows, "Total weight"), "1,285.75 lb");
  });

  it("spacing wider than span still gives two bars per direction", () => {
    const { rows } = calculateEstimate(
      steelCtx({ values: { length: 10, width: 10, spacing: 120, lap: 0 } }),
    );
    assert.strictEqual(valueOf(rows, "Bars to cut"), "4 pieces");
    assert.strictEqual(valueOf(rows, "Total bar length"), "40 linear ft");
  });

  it("boundary: sticks round up once on total length, not per bar", () => {
    const { rows } = calculateEstimate(
      steelCtx({ values: { length: 9.5, width: 9.5, spacing: 12, lap: 0 } }),
    );
    assert.strictEqual(valueOf(rows, "Total bar length"), "209 linear ft");
    assert.strictEqual(valueOf(rows, "#4 stock (20 ft)"), "11 sticks");
  });

  it("price uses stick count × unit price, not bar count", () => {
    const { rows } = calculateEstimate(
      steelCtx({
        values: { length: 10, width: 10, spacing: 12, lap: 10, price: 12 },
        priced: true,
      }),
    );
    assert.strictEqual(valueOf(rows, "Estimated cost"), "$156");
  });
});

describe("Post-hole branch (annular volume + fit check)", () => {
  const holeCtx = (overrides = {}) =>
    ctx({
      flags: { ...noFlags, holes: true, isHole: true, round: true },
      values: {
        diameter: 8,
        depth: 24,
        postWidth: 4,
        postDepth: 4,
        count: 1,
        waste: 5,
      },
      post: "Square",
      ...overrides,
    });

  it("8 in hole / 4×4 in post / 24 in deep: 0.48 cu ft net", () => {
    const { rows, error } = calculateEstimate(holeCtx());
    assert.strictEqual(error, "");
    assert.strictEqual(valueOf(rows, "Hole volume"), "0.7 ft³");
    assert.strictEqual(valueOf(rows, "Minus post"), "0.22 ft³");
    assert.strictEqual(valueOf(rows, "Concrete per hole"), "0.48 ft³");
    assert.strictEqual(valueOf(rows, "50 lb bags per hole"), "2 bags");
    assert.strictEqual(valueOf(rows, "80 lb bags per hole"), "1 bags");
  });

  it("round volumes ignore the waste allowance: 50% and 0% agree", () => {
    const a = calculateEstimate(
      holeCtx({ values: { ...holeCtx().values, waste: 0 } }),
    );
    const b = calculateEstimate(
      holeCtx({ values: { ...holeCtx().values, waste: 50 } }),
    );
    assert.deepStrictEqual(a.rows, b.rows);
  });

  it("total bags round up once on the total, not per hole", () => {
    const { rows } = calculateEstimate(
      holeCtx({
        values: {
          diameter: 10,
          depth: 24,
          postWidth: 4,
          postDepth: 4,
          count: 2,
          waste: 0,
        },
      }),
    );
    assert.strictEqual(valueOf(rows, "80 lb bags per hole"), "2 bags");
    assert.strictEqual(valueOf(rows, "Total 80 lb bags"), "3 bags");
  });

  it("a round post displaces πr² rather than width × depth", () => {
    const { rows } = calculateEstimate(
      holeCtx({ post: "Round", values: { ...holeCtx().values, postDiameter: 4 } }),
    );
    assert.strictEqual(valueOf(rows, "Minus post"), "0.17 ft³");
  });

  it("boundary: a post whose diagonal reaches the hole diameter is rejected", () => {
    const { rows, error } = calculateEstimate(
      holeCtx({
        values: {
          diameter: 4,
          depth: 24,
          postWidth: 4,
          postDepth: 4,
          count: 1,
          waste: 0,
        },
      }),
    );
    assert.strictEqual(
      error,
      "The post must fit inside the hole. Check its dimensions.",
    );
    assert.deepStrictEqual(rows, []);
  });

  it("with no post: displacement is zero and a note is shown", () => {
    const { rows, note } = calculateEstimate(
      holeCtx({
        post: "None",
        values: { diameter: 8, depth: 24, count: 1, waste: 0 },
      }),
    );
    assert.strictEqual(valueOf(rows, "Minus post"), "0 ft³");
    assert.strictEqual(note, "No post? You only need the hole volume.");
  });

  it("WYSIWYG: hole depth is entered in inches, not multiplied by 12", () => {
    const { rows } = calculateEstimate(
      holeCtx({
        post: "None",
        values: { diameter: 12, depth: 12, count: 1, waste: 0 },
      }),
    );
    assert.strictEqual(valueOf(rows, "Hole volume"), "0.79 ft³");
  });
});

describe("Sonotube branch (cylinder + extra piers)", () => {
  const tubeCtx = (overrides = {}) =>
    ctx({
      flags: { ...noFlags, tube: true, round: true },
      values: { diameter: 12, depth: 4, count: 1, waste: 5 },
      ...overrides,
    });

  it("12 in × 4 ft single pier: 0.79 ft² section, 3.14 ft³", () => {
    const { rows } = calculateEstimate(tubeCtx());
    assert.strictEqual(valueOf(rows, "Cross-section"), "0.79 square feet");
    assert.strictEqual(valueOf(rows, "Volume per pier"), "3.14 ft³");
    assert.strictEqual(valueOf(rows, "Volume for bags"), "3.14 ft³");
    assert.strictEqual(valueOf(rows, "80 lb bags per pier"), "6 bags");
    assert.strictEqual(valueOf(rows, "60 lb bags per pier"), "7 bags");
  });

  it("additional piers add to the total but not the per-pier row", () => {
    const { rows } = calculateEstimate(
      tubeCtx({ morePiers: [{ diameter: 12, depth: 4, count: 1 }] }),
    );
    assert.strictEqual(valueOf(rows, "Volume per pier"), "3.14 ft³");
    assert.strictEqual(valueOf(rows, "Total concrete"), "0.23 yd³");
    assert.strictEqual(valueOf(rows, "Concrete volume"), "0.23 yd³");
  });

  it("metric shows m³ only and kg bags with the regional caveat", () => {
    const { rows, bagNote } = calculateEstimate(tubeCtx({ unitSystem: "metric" }));
    assert.strictEqual(valueOf(rows, "Volume per pier"), "0.09 m³");
    assert.strictEqual(valueOf(rows, "Volume per pier (yd³)"), undefined);
    assert.notStrictEqual(valueOf(rows, "25 kg bags"), undefined);
    assert.notStrictEqual(valueOf(rows, "20 kg bags"), undefined);
    assert.strictEqual(valueOf(rows, "80 lb bags per pier"), undefined);
    assert.ok(bagNote.includes("check the bag weight on the shelf"));
  });

  it("boundary: zero quantity yields zero total, not NaN", () => {
    const { rows } = calculateEstimate(
      tubeCtx({ values: { diameter: 12, depth: 4, count: 0, waste: 0 } }),
    );
    assert.strictEqual(valueOf(rows, "Total concrete"), "0 yd³");
  });
});

describe("Irregular shapes: split into rectangles and add", () => {
  it("an L shape split into two pieces equals the bounding rectangle minus the corner", () => {
    const pieceA = calculateEstimate(
      ctx({ values: { length: 10, width: 6, thick: 4, waste: 0 } }),
    );
    const pieceB = calculateEstimate(
      ctx({ values: { length: 4, width: 4, thick: 4, waste: 0 } }),
    );
    const bounding = calculateEstimate(
      ctx({ values: { length: 10, width: 10, thick: 4, waste: 0 } }),
    );
    const ft = (r) =>
      Number(valueOf(r.rows, "Volume for bags").replace(/,/g, "").split(" ")[0]);
    closeTo(ft(pieceA) + ft(pieceB), ft(bounding) - 8, 1);
  });

  it("waste is applied once to the whole order, not to each piece", () => {
    const withWaste = calculateEstimate(
      ctx({ values: { length: 10, width: 10, thick: 4, waste: 5 } }),
    );
    const netOnly = calculateEstimate(
      ctx({ values: { length: 10, width: 10, thick: 4, waste: 0 } }),
    );
    const netFt = Number(valueOf(netOnly.rows, "Volume for bags").split(" ")[0]);
    const grossFt = Number(
      valueOf(withWaste.rows, "Volume for bags").split(" ")[0],
    );
    closeTo(grossFt, netFt * 1.05, 1);
  });
});

describe("Home Column shape (round, but no post to subtract)", () => {
  it("12 in × 4 ft column matches a single Sonotube pier without per-pier rows", () => {
    const { rows } = calculateEstimate(
      ctx({
        flags: { ...noFlags, home: true, round: true },
        values: { diameter: 12, depth: 4, count: 1, waste: 0 },
      }),
    );
    assert.strictEqual(valueOf(rows, "Concrete volume"), "0.12 yd³");
    assert.strictEqual(valueOf(rows, "Volume for bags"), "3.14 ft³");
    assert.strictEqual(valueOf(rows, "Volume per pier"), undefined);
  });
});

describe("Volume rows follow the selected unit system", () => {
  it("US shows no metric volume row; yd³ is the order unit and ft³ the bag basis", () => {
    const { rows } = calculateEstimate(
      ctx({ values: { length: 10, width: 10, thick: 4, waste: 5 } }),
    );
    assert.ok(
      !rows.some(([label, value]) => `${label} ${value}`.includes("m³")),
    );
    assert.strictEqual(valueOf(rows, "Concrete volume"), "1.3 yd³");
    assert.strictEqual(valueOf(rows, "Volume for bags"), "35 ft³");
  });

  it("metric shows no yd³ or ft³ volume row", () => {
    const { rows } = calculateEstimate(
      ctx({
        unitSystem: "metric",
        values: {
          length: 3 / 0.3048,
          width: 3 / 0.3048,
          thick: 100 / 25.4,
          waste: 5,
        },
      }),
    );
    assert.ok(
      !rows.some(([label, value]) => /yd³|ft³/.test(`${label} ${value}`)),
    );
    assert.strictEqual(valueOf(rows, "Concrete volume"), "0.95 m³");
    assert.strictEqual(valueOf(rows, "Net volume"), "0.9 m³");
  });

  it("bag sizes use only the current system, lightest first", () => {
    const values = { length: 10, width: 10, thick: 4, waste: 0 };
    const us = calculateEstimate(ctx({ values })).rows;
    const metric = calculateEstimate(
      ctx({ unitSystem: "metric", values }),
    ).rows;
    assert.ok(!us.some(([label]) => /kg bags/.test(label)));
    assert.ok(!metric.some(([label]) => /lb bags/.test(label)));
    assert.deepStrictEqual(
      us.filter(([label]) => /lb bags/.test(label)).map(([label]) => label),
      ["60 lb bags", "80 lb bags"],
    );
    assert.deepStrictEqual(
      metric.filter(([label]) => /kg bags/.test(label)).map(([label]) => label),
      ["20 kg bags", "25 kg bags"],
    );
  });
});
