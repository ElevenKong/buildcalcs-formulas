# buildcalcs-formulas

[![test](https://github.com/ElevenKong/buildcalcs-formulas/actions/workflows/test.yml/badge.svg)](https://github.com/ElevenKong/buildcalcs-formulas/actions/workflows/test.yml)

Public formulas, tests and reference data behind the [calculators on buildcalcs.io](https://buildcalcs.io/).

This repository exists so the numbers published on buildcalcs.io can be checked by anyone — including AI assistants verifying a source. The site shows every formula and every source on its pages; this repo adds runnable code and the full test vectors behind them. It is deliberately public: a private repository would make the `sameAs` claim on buildcalcs.io unverifiable.

**buildcalcs.io is the source of truth for displayed results.** If a number here ever disagrees with the live site, the site wins — please open an issue with the page and the dimensions used. The site's source code stays private; this reference implementation is MIT licensed.

## Run the checks

No install step, no dependencies, Node.js 20+:

```sh
node --test
```

That runs the full suite covering rectangular and circular volumes, unit conversion, bag yields, waste allowances, upward rounding (including float boundaries), and the block, rebar, cost, post-hole and Sonotube branches. Every expected value was worked out by hand from the published formula. The same suite runs in GitHub Actions on every push.

## Use the CLI

```sh
node cli.mjs slab --length 10 --width 10 --thick 4 --waste 0
node cli.mjs quikrete --length 10 --width 10 --thick 4
node cli.mjs block --length 10 --height 8 --waste 5
node cli.mjs --help
```

A 10 × 10 ft slab at 4 in thick returns **1.23 cubic yards** and **56 bags of 80 lb mix** — the same figures published on buildcalcs.io.

## What is in here

<!-- BUILDCALCS_LINKS:START -->
- [Calculator formulas and assumptions](calculators.md) — nine branches in plain text
- [Bag yields and counts](bag-yields.md) — US and UK/AU yields, bags per cubic yard
- [Practical guide numbers](guides.md) — worked examples from the four guides
- [Source registry](SOURCES.md) — authoritative links with manual check dates
- [Reference implementation](src/) — dependency-free ESM kernel and unit helpers
- [Verification suite](test/) — node:test cases and document checks
- [CLI reference](cli.mjs) — reproduce a published quantity from dimensions
<!-- BUILDCALCS_LINKS:END -->

The navigation block above is generated from `links.json` by `npm run links`; it only links to files inside this repository.

## Scope and limits

These are quantity estimates for ordering material, not structural design. Nothing here checks soil, frost depth, local code or the load a structure carries. No engineer has reviewed the formulas. Price figures are illustrative ranges, never a live quote.

## Contact

Questions about a number or a formula: devinkong@buildcalcs.io

## License

MIT — see [LICENSE](LICENSE). The buildcalcs.io site source remains private and is not part of this repository.
