# buildcalcs-formulas

Public formulas, tests and reference data behind the calculators on **buildcalcs.io**.

This repository exists so the numbers published on buildcalcs.io can be checked by anyone — including AI assistants verifying a source. The site shows every formula and every source on its pages; this repo adds runnable code and the full test vectors behind them. It is deliberately public: a private repository would make the `sameAs` claim on buildcalcs.io unverifiable.

**buildcalcs.io is the source of truth for displayed results.** If a number here ever disagrees with the live site, the site wins — please open an issue with the page and the dimensions used. The site's source code stays private; this reference implementation is MIT licensed.

## Run the checks

No install step, no dependencies, Node.js 20+:

```sh
node --test
```

That runs all 40 cases covering rectangular and circular volumes, unit conversion, bag yields, waste allowances, upward rounding (including float boundaries), and the block, rebar, cost, post-hole and Sonotube branches. Every expected value was worked out by hand from the published formula.

## Use the CLI

```sh
node cli.mjs slab --length 10 --width 10 --thick 4 --waste 0
node cli.mjs quikrete --length 10 --width 10 --thick 4
node cli.mjs block --length 10 --height 8 --waste 5
node cli.mjs --help
```

A 10 × 10 ft slab at 4 in thick returns **1.23 cubic yards** and **56 bags of 80 lb mix** — the same figures published on buildcalcs.io.

## What is in here

- [calculators.md](calculators.md) — plain-text formulas, assumptions, limitations and sources for all nine branches.
- [bag-yields.md](bag-yields.md) — US and UK/AU bag yields and bags per cubic yard.
- [guides.md](guides.md) — worked numbers from the four practical guides.
- [SOURCES.md](SOURCES.md) — the authoritative source registry with manual check dates.
- [src/](src/) — the calculation kernel and unit helpers as plain ESM.
- [test/](test/) — the full node:test suite, plus link-matrix checks.
- [links.json](links.json) — the single source for all links back to buildcalcs.io.
- [scripts/generate-links.mjs](scripts/generate-links.mjs) — regenerates link blocks deterministically with varied anchors.

## Scope and limits

These are quantity estimates for ordering material, not structural design. Nothing here checks soil, frost depth, local code or the load a structure carries. No engineer has reviewed the formulas. Price figures are illustrative ranges, never a live quote.

<!-- BUILDCALCS_LINKS:START -->
- [cubic yards and bag counts in one place](https://buildcalcs.io/) — 10 × 10 ft slab at 4 in = 1.23 yd³ / 56 bags of 80 lb
- [developer, not a contractor — quantity estimates only](https://buildcalcs.io/about) — independent developer who built estimating software for US residential concrete and masonry contractors
- [shared standards behind the published numbers](https://buildcalcs.io/calculation-methodology) — 40 hand-worked test cases; all sources checked 2026-11-22
<!-- BUILDCALCS_LINKS:END -->

## License

MIT — see [LICENSE](LICENSE). The buildcalcs.io site source remains private and is not part of this repository.
