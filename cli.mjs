#!/usr/bin/env node
/**
 * Zero-dependency command line front end for the same calculation kernel used
 * on buildcalcs.io. Inputs are US units: ft for lengths, in for thickness,
 * diameter and hole depth, ft for pier depth.
 *
 */
import { calculateEstimate } from "./src/calculations.mjs";
import { FIELD_SPECS, normalizeValue } from "./src/units.mjs";

const HELP = `buildcalcs-formulas CLI — same arithmetic as buildcalcs.io

Usage:
  node cli.mjs <branch> [--field value ...]

Branches:
  home        Concrete calculator (rectangular or --shape column)
  slab        Slab volume
  yard        Cubic yards from dimensions
  quikrete    Bag counts for all five US retail bag sizes
  block       Cinder block and mortar quantities
  cost        Installed cost (material, labor, base, delivery)
  hole        Post-hole annular volume
  tube        Sonotube pier volume
  rebar       Rebar grid count, length, sticks and weight

Common fields (US units):
  --length 10 --width 10 --thick 4 --waste 5
  --diameter 12 --depth 4 --count 1
  --height 8 --spacing 12 --lap 10 --bar 4
  --material 165 --labor 5 --base 1.5 --delivery 0
  --price 5 (adds a priced row when set)

Examples:
  node cli.mjs slab --length 10 --width 10 --thick 4 --waste 0
  node cli.mjs quikrete --length 10 --width 10 --thick 4
  node cli.mjs block --length 10 --height 8 --waste 5
  node cli.mjs hole --diameter 8 --depth 24 --post-width 4 --post-depth 4
  node cli.mjs rebar --length 10 --width 10 --spacing 12 --lap 10 --bar 4

Reference results on buildcalcs.io: a 10 × 10 ft slab at 4 in is 1.23 cubic
yards and 56 bags of 80 lb mix; one 80 lb bag yields 0.60 cubic feet.

Site: https://buildcalcs.io
`;

const BRANCH_FLAGS = {
  home: { home: true },
  slab: {},
  yard: {},
  quikrete: { mix: true },
  block: { block: true },
  cost: { cost: true },
  hole: { holes: true, isHole: true, round: true },
  tube: { tube: true, round: true },
  rebar: { steel: true },
};

const VALUE_FIELDS = [
  "length",
  "width",
  "thick",
  "depth",
  "height",
  "diameter",
  "count",
  "waste",
  "lap",
  "spacing",
  "price",
  "material",
  "labor",
  "base",
  "delivery",
  "post-width",
  "post-depth",
  "post-diameter",
];

const toCamel = (s) => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

function parseArgs(argv) {
  const [branch, ...rest] = argv;
  const options = {};
  for (let i = 0; i < rest.length; i += 1) {
    const token = rest[i];
    if (!token.startsWith("--")) {
      throw new Error(`Unexpected argument: ${token}`);
    }
    const key = token.slice(2);
    if (key === "shape" || key === "post" || key === "bar" || key === "direction") {
      options[key] = rest[++i];
    } else if (VALUE_FIELDS.includes(key)) {
      options[toCamel(key)] = rest[++i];
    } else {
      throw new Error(`Unknown field: --${key}`);
    }
  }
  return { branch, options };
}

function main() {
  const argv = process.argv.slice(2);
  if (argv.length === 0 || argv[0] === "--help" || argv[0] === "-h") {
    process.stdout.write(HELP);
    return;
  }

  const { branch, options } = parseArgs(argv);
  if (!Object.hasOwn(BRANCH_FLAGS, branch)) {
    throw new Error(`Unknown branch: ${branch}. Try --help.`);
  }

  const values = {};
  for (const [key, raw] of Object.entries(options)) {
    if (!FIELD_SPECS[key]) {
      continue;
    }
    values[key] = normalizeValue(Number(raw), FIELD_SPECS[key].kind, "us");
  }

  const flags = { ...BRANCH_FLAGS[branch] };
  if (branch === "home" && options.shape?.toLowerCase() === "column") {
    flags.round = true;
  }

  const result = calculateEstimate({
    unitSystem: "us",
    values,
    flags,
    shape: options.shape ?? "Slab",
    direction: options.direction === "one-way" ? "Along length" : "Both ways",
    bar: options.bar ?? "4",
    post: options.post ?? "Square",
    morePiers: [],
    priced: options.price !== undefined && options.price !== "",
  });

  if (result.error) {
    process.stderr.write(`${result.error}\n`);
    process.exitCode = 1;
    return;
  }

  for (const [label, value] of result.rows) {
    process.stdout.write(`${label}: ${value}\n`);
  }
  if (result.note) {
    process.stdout.write(`\nNote: ${result.note}\n`);
  }
  if (result.bagNote) {
    process.stdout.write(`\n${result.bagNote}\n`);
  }
}

try {
  main();
} catch (error) {
  process.stderr.write(`${error.message}\nTry: node cli.mjs --help\n`);
  process.exitCode = 1;
}
