/**
 * Reference implementation of the nine calculator branches published on buildcalcs.io.
 *
 * This is a plain, dependency-free ES module so anyone can clone the repository and
 * verify the published numbers with `node --test`. The arithmetic is kept identical
 * to the site's calculation kernel; buildcalcs.io remains the source of truth for
 * page copy and displayed results.
 *
 * Unit conventions (inputs are normalized by the caller before reaching here):
 * - lengths are ft, linear dimensions are in, rates are $/yd³ or $/ft²
 * - volumes are computed in cubic feet, then ÷27 for cubic yards and
 *   ×0.028316846592 for cubic metres
 * - for post holes, depth stays in inches and is divided by 12 here
 */

/** 1 cubic foot = 0.028316846592 m³ (exact definition) */
export const CUBIC_FT_TO_M3 = 0.028316846592;
/** 1 cubic yard = 27 cubic feet (definition) */
export const CU_FT_PER_YD = 27;
/** UK/Australia dry-mix bag yields, m³ */
export const KG25_BAG_M3 = 0.0117;
export const KG20_BAG_M3 = 0.00936;
/** Blocks laid per 80 lb mortar bag (midpoint of the published 30–35 range) */
export const BLOCKS_PER_MORTAR_BAG = 32;
/** Stock length of a reinforcing bar, ft */
export const STICK_LENGTH_FT = 20;
/** Standard unit weights by bar number, lb/ft (table values, not computed) */
export const REBAR_WEIGHT = {
  "3": 0.376,
  "4": 0.668,
  "5": 1.043,
  "6": 1.502,
  "7": 2.044,
  "8": 2.67,
  "9": 3.4,
  "10": 4.303,
  "11": 5.313,
  "14": 7.65,
  "18": 13.6,
};

/** Regional bag-size caveat shown when metric results are displayed */
export const BAG_MARKET_NOTE =
  "kg bag counts use UK/Australia dry-mix yields (25 kg ≈ 0.0117 m³, 20 kg ≈ 0.0094 m³); lb rows are US retail sizes. In the UK and Australia ready-mix is ordered by the cubic metre — check the bag weight on the shelf before ordering.";

/** Display a number with thousands separators and at most two decimals. */
export const display = (v) =>
  v.toLocaleString("en-US", { maximumFractionDigits: 2 });

/**
 * The single calculation entry point. Pure: no network, DOM or framework dependency.
 *
 * ctx = {
 *   unitSystem: "us" | "metric",
 *   values: { length, width, thick, diameter, depth, ... },  // already normalized
 *   flags: { home, block, cost, steel, tube, holes, mix, isHole, round },
 *   shape, direction, bar, post, morePiers, priced
 * }
 */
export function calculateEstimate(ctx) {
  const { unitSystem, values, flags, direction, bar, post, morePiers, priced } =
    ctx;
  const { home, block, cost, steel, tube, holes, mix, isHole, round } = flags;
  const v = (key) => values[key] ?? 0;

  /**
   * Round a count up with a floating-point tolerance.
   * A bare Math.ceil adds a unit whenever the exact result is an integer but the
   * binary arithmetic lands just above it: 1.2 m at 300 mm gives
   * 4.000000000000001 spaces, which would become 5 and add a bar. The tolerance
   * scales with magnitude to cover wider ulps at large counts.
   */
  const ceilCount = (x) => Math.ceil(x - Math.max(1e-9, Math.abs(x) * 1e-12));

  const bag = (volume, yieldFt) => ceilCount(volume / yieldFt);
  const bagM3 = (volumeM3, yieldM3) => ceilCount(volumeM3 / yieldM3);

  const result = [];
  const add = (key, value, unit) =>
    result.push([key, `${display(value)} ${unit}`.trim()]);
  const money = (key, value) => result.push([key, `$${display(value)}`]);

  /**
   * Volume rows: metric leads with m³ and keeps yd³ alongside; imperial keeps
   * the original cubic-yards + metric order. Net volume is listed separately
   * when a waste allowance was applied.
   */
  const addVolume = (
    cubicFeet,
    ydLabel = "Concrete volume",
    netCubicFeet = cubicFeet,
  ) => {
    const hasWaste = netCubicFeet !== cubicFeet;
    if (unitSystem === "metric") {
      add(`${ydLabel} (m³)`, cubicFeet * CUBIC_FT_TO_M3, "cubic metres");
      add(`${ydLabel} (yd³)`, cubicFeet / CU_FT_PER_YD, "cubic yards");
      if (hasWaste) {
        add("Net volume (m³)", netCubicFeet * CUBIC_FT_TO_M3, "cubic metres");
        add("Net volume (yd³)", netCubicFeet / CU_FT_PER_YD, "cubic yards");
      }
    } else {
      add(ydLabel, cubicFeet / CU_FT_PER_YD, "cubic yards");
      add("Metric volume (m³)", cubicFeet * CUBIC_FT_TO_M3, "cubic metres");
    }
  };

  /** Bag rows: metric shows kg bags first, then the lb sizes for reference. */
  const addBags = (cubicFeet, usSizes) => {
    if (unitSystem === "metric") {
      const volumeM3 = cubicFeet * CUBIC_FT_TO_M3;
      add("25 kg bags", bagM3(volumeM3, KG25_BAG_M3), "bags");
      add("20 kg bags", bagM3(volumeM3, KG20_BAG_M3), "bags");
    }
    for (const [label, yieldFt] of usSizes) {
      add(label, bag(cubicFeet, yieldFt), "bags");
    }
  };

  const fail = (error) => ({ rows: [], error, note: "", bagNote: "" });
  const finish = (note) => ({
    rows: result,
    error: "",
    note,
    bagNote:
      unitSystem === "metric" && result.some(([label]) => /bags/i.test(label))
        ? BAG_MARKET_NOTE
        : "",
  });

  // Rectangular volume: thickness is entered in inches and divided by 12.
  const feet = (v("length") * v("width") * v("thick")) / 12;
  // Waste is entered as a percentage, e.g. 5 means +5%.
  const factor = 1 + v("waste") / 100;
  let note = "";

  if (steel) {
    /**
     * Rebar:
     *   runs(span) = ceil(span(in) / spacing(in)) + 1
     *   total length = (runs(width) × length + runs(length) × width) × (1 + lap%)
     *   sticks = ceil(total length / 20)
     *   weight = total length × unit weight (lb/ft)
     */
    const runs = (span) => ceilCount((span * 12) / v("spacing")) + 1;
    // Bars running along the length are spaced across the width.
    const along = runs(v("width"));
    // The perpendicular direction is zero when only one way is specified.
    const across = direction === "Both ways" ? runs(v("length")) : 0;
    const length =
      (along * v("length") + across * v("width")) * (1 + v("lap") / 100);
    const sticks = ceilCount(length / STICK_LENGTH_FT);
    add("Total bar length", length, "linear ft");
    add("Bars to cut", along + across, "pieces");
    add(`#${bar} stock (20 ft)`, sticks, "sticks");
    add("Total weight", length * (REBAR_WEIGHT[bar] ?? 0), "lb");
    if (priced) money("Estimated cost", sticks * v("price"));
    note =
      "Bar count comes from total length, not a cut list — check individual cuts and lap locations before ordering.";
  } else if (block) {
    /**
     * Masonry units:
     *   net blocks = ceil(length × height × 1.125)
     *   order = ceil(net × waste factor)
     *   mortar bags = ceil(order / 32)
     *   blocks per course = ceil(length(in) / 16)
     */
    const net = ceilCount(v("length") * v("height") * 1.125);
    const order = ceilCount(net * factor);
    add("Blocks with waste", order, "blocks");
    add("Net block count", net, "blocks");
    add("Mortar (80 lb)", ceilCount(order / BLOCKS_PER_MORTAR_BAG), "bags");
    add("Blocks per course", ceilCount((v("length") * 12) / 16), "blocks");
  } else if (cost) {
    /**
     * Installed cost:
     *   concrete = (volume / 27) × waste factor × $/yd³
     *   labor = area × $/ft², base and delivery are separate
     *   unit rate = total / area
     */
    const area = v("length") * v("width");
    const material = (feet / CU_FT_PER_YD) * factor * v("material");
    const labor = area * v("labor");
    const base = area * v("base");
    const total = material + labor + base + v("delivery");
    addVolume(feet * factor, "Concrete volume", feet);
    money("Estimated installed cost", total);
    money("Concrete", material);
    money("Labor", labor);
    money("Base & forms", base);
    money("Delivery", v("delivery"));
    money("Price per square foot", total / area);
  } else {
    /**
     * Volume branches (home / slab / yard / quikrete / post hole / sonotube):
     *   rectangular: L × W × T(in) / 12 × waste factor
     *   circular:    area = π × (diameter/24)²
     */
    let volume = feet * factor;
    if (round) {
      const diameter = v("diameter");
      const area = Math.PI * (diameter / 24) ** 2;
      // Hole depth is entered in inches; pier depth is already in feet.
      const depthFt = isHole ? v("depth") / 12 : v("depth");
      const gross = area * depthFt;
      let displaced = 0;
      if (isHole) {
        // A round post is checked by diameter; a square one by its diagonal.
        const span =
          post === "Round"
            ? v("postDiameter")
            : Math.hypot(v("postWidth"), v("postDepth"));
        if (post !== "None" && span >= diameter) {
          return fail("The post must fit inside the hole. Check its dimensions.");
        }
        displaced =
          post === "Square"
            ? ((v("postWidth") * v("postDepth")) / 144) * depthFt
            : post === "Round"
              ? Math.PI * (v("postDiameter") / 24) ** 2 * depthFt
              : 0;
      }
      // `per` is the net volume of one hole/pier; the order uses per × count.
      const per = gross - displaced;
      volume = per * v("count");
      if (isHole) {
        add("Hole volume", gross, "cubic feet");
        add("Minus post", displaced, "cubic feet");
        add("Concrete per hole", per, "cubic feet");
        // Bag counts are rounded up on the total, not once per hole.
        addBags(per, [
          ["50 lb bags per hole", 0.375],
          ["80 lb bags per hole", 0.6],
        ]);
        add("Total concrete", volume, "cubic feet");
        addVolume(volume, "Total concrete");
        addBags(volume, [
          ["Total 50 lb bags", 0.375],
          ["Total 80 lb bags", 0.6],
        ]);
        if (priced) money("Estimated bag cost", bag(volume, 0.375) * v("price"));
        if (!displaced) note = "No post? You only need the hole volume.";
      }
      if (tube) {
        // Additional piers arrive already normalized in the caller's units.
        for (const pier of morePiers) {
          volume += Math.PI * (pier.diameter / 24) ** 2 * pier.depth * pier.count;
        }
        add("Cross-section", area, "square feet");
        add("Volume per pier", per, "cubic feet");
        if (unitSystem === "metric") {
          add("Volume per pier (m³)", per * CUBIC_FT_TO_M3, "cubic metres");
          add("Volume per pier (yd³)", per / CU_FT_PER_YD, "cubic yards");
        } else {
          add("Volume per pier (yd³)", per / CU_FT_PER_YD, "cubic yards");
        }
        addBags(per, [
          ["80 lb bags per pier", 0.6],
          ["60 lb bags per pier", 0.45],
        ]);
        add("Total concrete", volume, "cubic feet");
        addVolume(volume, "Total concrete");
        if (priced) money("Estimated cost (80 lb)", bag(volume, 0.6) * v("price"));
      }
    }
    // Hole results already include a total; slab/piers get the standard rows.
    if (!isHole) {
      addVolume(volume, "Concrete volume", feet);
      add("Cubic feet", volume, "cubic feet");
      addBags(volume, [
        ["60 lb bags", 0.45],
        ["80 lb bags", 0.6],
        ...(mix
          ? [
              ["40 lb bags", 0.3],
              ["50 lb bags", 0.375],
              ["90 lb bags", 0.675],
            ]
          : []),
      ]);
      if (mix && priced) money("Estimated cost (80 lb)", bag(volume, 0.6) * v("price"));
      if (home) {
        result.push([
          "Ready-mix material",
          `$${display((volume / CU_FT_PER_YD) * 130)}–$${display((volume / CU_FT_PER_YD) * 180)}`,
        ]);
      }
      note =
        "Volume includes the waste allowance above; bag counts are rounded up after totaling the pour.";
    }
  }
  return finish(note);
}
