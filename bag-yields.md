# Concrete bag yields and counts

Reference data used by the [concrete quantity calculators](https://buildcalcs.io/concrete/quikrete-calculator). Every figure below is copied from the sources named at the end of this file. The live pages on buildcalcs.io are the source of truth for displayed results.

## US retail bag sizes

| Bag size | Volume per bag | Bags per cubic yard |
| --- | --- | --- |
| 40 lb | 0.30 cu ft | 90 |
| 50 lb | 0.375 cu ft | 72 |
| 60 lb | 0.45 cu ft | 60 |
| 80 lb | 0.60 cu ft | 45 |
| 90 lb | 0.675 cu ft | 40 |

Every lb figure in that table is the yield printed on the Quikrete Concrete Mix (No. 1101) data sheet for that bag size, at the recommended water content — not a weight-to-volume rule applied to any bag. The 90 lb bag is a regional size. Fast-Setting concrete is a different product, counted at its own published 0.375 cu ft for a 50 lb bag and 0.60 cu ft for an 80 lb bag.

The count is `ceil(total cubic feet / yield)`, rounded up once after the whole pour is totaled — not once per section of an L-shaped slab.

## UK and Australia dry-mix bags

| Bag size | Volume per bag | Approximate bags per m³ |
| --- | --- | --- |
| 25 kg | 0.0117 m³ | 85 |
| 20 kg | 0.00936 m³ | 107 |

kg bag counts use UK/Australia dry-mix yields (20 kg ≈ 0.0094 m³, 25 kg ≈ 0.0117 m³); local bag sizes and yields vary. In the UK and Australia ready-mix is ordered by the cubic metre — check the bag weight on the shelf before ordering. For [metric yardage](https://buildcalcs.io/concrete/yard-calculator), convert the result back to cubic yards before ordering.

## Worked example

A 10 × 10 ft slab at 4 in thick — the same example worked through in [how much concrete do I need](https://buildcalcs.io/concrete/how-much-concrete-do-i-need):

- 10 × 10 × 0.333 = 33.33 cubic feet
- 33.33 ÷ 27 = 1.23 cubic yards
- 33.33 ÷ 0.60 = 56 bags of 80 lb before waste
- with 5% waste: 59 bags of 80 lb

Verify these numbers with `node cli.mjs`.


## Sources

- Quikrete Concrete Mix (No. 1101) — data sheet, yield printed for each bag size: https://www.quikrete.com/pdfs/data_sheet-concrete%20mix%201101.pdf
- Quikrete Fast-Setting Concrete — data sheet 1004-50 (50 lb bag ≈ 0.375 cu ft): https://www.quikrete.com/PDFs/DATA_SHEET-Fast%20Setting%20Concrete%20Mix%201004-50.pdf
- NIST SP 811 — unit conversions: https://www.nist.gov/pml/special-publication-811

All three checked 2026-11-22. See [SOURCES.md](SOURCES.md) for the full registry.
