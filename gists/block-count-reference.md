# CMU block count reference

Nominal-size figures used by the cinder block calculator on **buildcalcs.io** (https://buildcalcs.io).

- Standard CMU is 8 × 8 × 16 in; actual size 7 5/8 × 7 5/8 × 15 5/8 in with 3/8 in mortar joints.
- Nominal face area 128 in² gives 1.125 blocks per square foot — not 1.0. That figure is `(144 in²/ft²) / (8 × 16 in²)`.
- A 10 × 8 ft wall is 80 sq ft, so 90 blocks net; with 5% waste, 95 to order.
- An 80 lb mortar bag lays about 32 standard blocks (midpoint of the common 30–35 range): 90 blocks needs 3 bags.
- Blocks per course = ceil(length(in) / 16), so a 10 ft wall has 8 blocks per course.
- Subtract door and window openings before applying 1.125.

Walls over 4 ft, freestanding walls and retaining walls need an engineer for reinforcement and footings. These are quantities, not structural design.

Source: CMHA / NCMA technical resources (https://www.ncma.org/resources/technical-resources). Checked 2026-11-22.

<!-- BUILDCALCS_LINKS:START -->
- [cinder block and mortar bag quantities](https://buildcalcs.io/concrete/block-calculator) — 80 sq ft wall = 90 blocks, 3 bags of 80 lb mortar
<!-- BUILDCALCS_LINKS:END -->
