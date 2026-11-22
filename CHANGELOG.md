# Changelog

All notable changes to the public reference implementation behind the [calculators on buildcalcs.io](https://buildcalcs.io/) are recorded here.

## v0.1.0 — 2026-11-23

First tagged release.

- Published the nine calculator branches as a dependency-free ESM reference implementation, with unit conversions, bag yields, waste allowances and upward rounding kept identical to buildcalcs.io.
- Ported all 40 site test cases to `node:test`; `node --test` runs the full suite with no install step.
- Added a zero-dependency CLI for reproducing published [slab quantities](https://buildcalcs.io/concrete/slab-calculator) from dimensions.
- Documented plain-text formulas, assumptions, limitations and sources for every branch, plus the bag-yield tables, guide numbers and source registry.
- Added a test workflow that runs `node --test` on every push and pull request, with a README status badge.
- Added internal document navigation maintained by `scripts/generate-links.mjs`.
- Set the domain contact address `devinkong@buildcalcs.io`.
