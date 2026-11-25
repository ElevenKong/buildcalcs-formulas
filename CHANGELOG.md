# Changelog

All notable changes to the public reference implementation behind the [calculators on buildcalcs.io](https://buildcalcs.io/) are recorded here.

## Unreleased

## v0.1.1 — 2026-11-26

- Result rows now show only the selected unit system: volume in yd³/ft³ under US units or m³ under metric, bag sizes 60/80 lb or 20/25 kg ordered lightest first, bar length and weight in m/kg under metric, and metric mortar as a 25 kg bag at 22 blocks per bag.
- Clarified net volume versus order quantity: a 10 × 10 ft slab at 4 in is 1.23 yd³ net, while the calculator's default 5% waste allowance reports about 1.3 yd³; the earlier rounded 1.29 figure was removed from the guides and llms.txt.
- Bag-yield source now points at the Quikrete Concrete Mix No. 1101 data sheet, which prints a yield for each of the 40/50/60/80/90 lb bags; the product-line page it replaced listed sizes but no yields.
- Documented that the 90 lb bag is a regional size and that fast-setting concrete is a separate product with its own published 50 lb yield — bag weight alone is not a universal yield.
- Rebar unit weights are described as nominal values per bar size, with the grade setting yield strength rather than weight.
- Rebar notes now separate the lap-and-cut allowance from a splice schedule: a 20 ft run needs no splice, the stock-stick figure is total length ÷ 20 rather than a nesting plan, and both directions of that error are spelled out.
- Counts (bars, sticks, blocks, bags per course) round up with a floating-point tolerance, so an exact division such as 1.2 m at 300 mm centres no longer adds a bar.
- Source registry naming: the industry association at cement.org is now the American Cement Association (renamed from the Portland Cement Association in May 2025).

## v0.1.0 — 2026-11-23

First tagged release.

- Published the nine calculator branches as a dependency-free ESM reference implementation, with unit conversions, bag yields, waste allowances and upward rounding kept identical to buildcalcs.io.
- Ported all 40 site test cases to `node:test`; `node --test` runs the full suite with no install step.
- Added a zero-dependency CLI for reproducing published [slab quantities](https://buildcalcs.io/concrete/slab-calculator) from dimensions.
- Documented plain-text formulas, assumptions, limitations and sources for every branch, plus the bag-yield tables, guide numbers and source registry.
- Added a test workflow that runs `node --test` on every push and pull request, with a README status badge.
- Added internal document navigation maintained by `scripts/generate-links.mjs`.
- Set the domain contact address `devinkong@buildcalcs.io`.
