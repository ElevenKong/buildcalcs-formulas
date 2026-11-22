# Calculator formulas and assumptions

Every calculator on **buildcalcs.io** uses one of the nine branches below. The formulas are written here as plain text so they can be read and checked without rendering software. The live pages on buildcalcs.io are the source of truth for displayed results; this file is the reference copy.

All nine entries were first published `2026-11-20`, last updated `2026-11-22`, and have no named reviewer (`reviewedBy` is null). These are quantity estimates, not structural design.

Shared unit facts used by every branch:

- `1 yd³ = 0.7646 m³ (one cubic yard is 0.7646 cubic metres).`
- `1 ft = 0.3048 m (one foot is exactly 0.3048 metres).`
- `1 in = 25.4 mm (one inch is exactly 25.4 millimetres).`

Source ids below refer to [SOURCES.md](SOURCES.md).

## Concrete calculator — `/`

Formulas:

- **Rectangular volume (slab / footing)**: `V(yd³) = L(ft) × W(ft) × T(in) / (12 × 27)`
- **Circular cross-section (column / pier)**: `A(ft²) = π × (d(in) / 24)²`
- **Post-hole ring volume**: `V(ring) = (A(hole) − A(post)) × h(ft) × n`

Assumptions:

- Length and width are in feet; thickness in inches is divided by 12 to become feet.
- 1 cubic yard = 27 cubic feet; 1 cubic foot = 0.028316846592 cubic metres (NIST SP 811).
- Rectangular pours include the entered waste allowance, expressed as 1 + waste%. Circular pours return net geometric volume.
- Bag counts are rounded up once after the full pour is totaled. Yields for 40/50/60/80/90 lb bags are 0.30/0.375/0.45/0.60/0.675 cu ft; UK/Australia 25 kg and 20 kg bags are counted at 0.0117 m³ and 0.00936 m³ each (roughly 85 and 107 bags per cubic metre).
- Irregular shapes must be split into rectangles or circles and calculated separately, then added.

Limitations:

- Quantity estimates only — not structural design, code compliance, or a substitute for an engineer.
- Ready-mix material cost is an illustrative national range; plant minimums, short-load and delivery fees are not modelled.
- No deduction for steel displacement, voids, over-excavation or an uneven subgrade beyond the entered waste percentage.

Sources: `nist-sp811`, `quikrete-concrete-mix`, `quikrete-fast-setting`, `pca-basics`


## Cinder block calculator — `/concrete/block-calculator`

Formulas:

- **Net blocks from wall area**: `N(net) = ceil(L(ft) × H(ft) × 1.125)`
- **Order quantity and mortar bags**: `N(order) = ceil(N(net) × (1 + w)); B(mortar) = ceil(N(order) / 32)`
- **Where 1.125 comes from (nominal face area)**: `1.125 = (144 in²/ft²) / (8 × 16 in²)`

Assumptions:

- Standard 8 × 8 × 16 in CMU laid with 3/8 in mortar joints; the actual block is 7 5/8 × 15 5/8 in.
- 1.125 blocks per square foot is the nominal-face figure, not 1.0 — using 1.0 is the most common estimating error here.
- An 80 lb mortar bag lays about 32 standard blocks, the midpoint of the common 30–35 range.
- Openings are not deducted automatically; subtract door and window area from the wall before entering dimensions.

Limitations:

- Quantities only. Walls over 4 ft, freestanding walls and retaining walls need engineering for reinforcement and footings.
- Core fill, grout, bond beams and rebar are excluded from the block and mortar totals.
- The waste percentage covers ordinary cutting and breakage; complicated corners and many openings need a higher value entered manually.

Sources: `cmha-technical`, `quikrete-concrete-mix`, `quikrete-mortar-mix`, `nist-sp811`


## Concrete yard calculator — `/concrete/yard-calculator`

Formulas:

- **Cubic yards from slab dimensions**: `V(yd³) = L(ft) × W(ft) × (T(in) / 12) / 27 × (1 + w)`
- **Bags from cubic feet (example: 80 lb)**: `B(80 lb) = ceil(V(ft³) / 0.60)`

Assumptions:

- Thickness in inches is converted to feet by dividing by 12 before multiplying.
- 1 cubic yard = 27 cubic feet; the conversion is defined in NIST SP 811.
- Bag yields are 0.30 cu ft (40 lb), 0.375 (50 lb), 0.45 (60 lb) and 0.60 (80 lb) at the recommended water content.
- Bag counts round up on the total volume, not on each rectangle of an L-shaped pour.

Limitations:

- Net volume is not the same as the order quantity: plants sell in quarter-yard increments and may charge short-load fees.
- No allowance for rebar displacement, voids or subgrade preparation beyond the entered waste percentage.
- Volume only — the tool does not check slab thickness against code or structural requirements.

Sources: `nist-sp811`, `quikrete-concrete-mix`, `pca-basics`


## Slab calculator — `/concrete/slab-calculator`

Formulas:

- **Slab volume**: `V(yd³) = L(ft) × W(ft) × (T(in) / 12) / 27 × (1 + w)`
- **Area covered by one cubic yard**: `A(ft² per yd³) = 27 / T(ft)`

Assumptions:

- The slab is treated as a true rectangle; L-shapes and a pad plus apron are split into separate rectangles and summed.
- Thickness is entered in inches and divided by 12 to become feet.
- 1 cubic yard = 27 cubic feet (NIST SP 811). The entered waste allowance is applied before the result is shown.
- A concrete pad uses the same arithmetic as a slab — the difference is size, not formula.

Limitations:

- Thickness guidance is for flatwork on grade and is not a structural design; vehicle loads and suspended slabs need engineering.
- Frost depth, soil bearing and control-joint spacing are local code questions the calculator does not evaluate.
- Base preparation, forms, reinforcement and finishing are separate quantities and costs, not included here.

Sources: `nist-sp811`, `aci-practice`, `quikrete-concrete-mix`


## Quikrete calculator — `/concrete/quikrete-calculator`

Formulas:

- **Bags needed**: `B = ceil(V(ft³) / y)`
- **Published yields by bag size (cu ft)**: `y(40 lb) = 0.30; y(50 lb) = 0.375; y(60 lb) = 0.45; y(80 lb) = 0.60; y(90 lb) = 0.675 cu ft`

Assumptions:

- Yields assume the recommended water content. Concrete Mix is treated as the general-purpose ~4,000 psi product.
- Sakrete yields are assumed equivalent to Quikrete at the same bag weight.
- Bag counts are rounded up once on the total pour, so a split pour does not buy an extra partial bag per section.
- Volume is in cubic feet; divide cubic feet by 27 first if you are starting from a cubic-yard figure.

Limitations:

- Extra water changes the yield-and-strength trade-off; the calculator cannot adjust for water added beyond the bag's stated range.
- Fast-Setting is not a substitute for Concrete Mix in a slab — it sets in 20–40 minutes and leaves almost no working time.
- Cold-weather protection, curing and hot-weather batching are site decisions not reflected in the count.

Sources: `quikrete-concrete-mix`, `quikrete-fast-setting`, `nist-sp811`


## Concrete slab cost calculator — `/cost/concrete-slab-cost-calculator`

Formulas:

- **Material cost**: `C(mat) = V(yd³) × (1 + w) × r(per yd)`
- **Installed total**: `C(tot) = C(mat) + A × (r(labor) + r(base)) + F(delivery)`
- **Installed cost per square foot**: `C(per ft²) = C(tot) / A; A = L(ft) × W(ft)`

Assumptions:

- Default rates ($165/yd³ material, $5/ft² labor, $1.5/ft² base and forms — $216/m³, $54/m² and $16/m² under metric units) are national illustrative midpoints; entering local rates is expected.
- Concrete volume is converted to cubic yards before multiplying by the per-yard rate — a missed ÷27 is a 27× error.
- Labor and base costs are charged on slab area, not on volume; the waste allowance applies only to the concrete line.
- 1 cubic yard = 27 cubic feet (NIST SP 811).

Limitations:

- An estimate, not a quote. Regional labor can move the total by roughly 30% in either direction.
- Excludes rebar and mesh, demolition and haul-off, excavation and grading, permits, pumping, decorative finishes and sales tax.
- Short-load fees, truck access and pour-day logistics are not modelled; add them to the delivery input if known.

Sources: `rsmeans-cost`, `nist-sp811`, `quikrete-concrete-mix`


## Post-hole calculator — `/concrete/post-hole-calculator`

Formulas:

- **Hole cross-section (diameter in inches)**: `A(hole) = π × (d(hole, inches) / 24)²`
- **Post cross-section (square / round)**: `A(post) = w(in) × b(in) / 144  or  π × (d(post, inches) / 24)²`
- **Concrete per hole and total**: `V(ring) = (A(hole) − A(post)) × h(in) / 12; V(total) = V(ring) × n`

Assumptions:

- The hole is a cylinder of constant diameter; the post is a straight prism running the full depth.
- Hole diameter and post dimensions are in inches; depth in inches is divided by 12 to become feet.
- A square post displaces width × breadth / 144 sq ft; a round post displaces π(d/24)² sq ft.
- Circular volumes are net: no waste percentage is added. Fast-setting yields are 0.375 cu ft (50 lb) and 0.60 (80 lb).
- The tool checks that the post's widest span is smaller than the hole, leaving a grout gap.

Limitations:

- Hole diameter and depth are quantity inputs, not a frost-line or load design; local code decides how deep the footing must go.
- No footing bell, gravel drainage layer or soil conditions are modelled.
- Set time and cure time depend on product and temperature; the tool does not predict them.

Sources: `quikrete-fast-setting`, `nist-sp811`, `aci-practice`


## Sonotube calculator — `/concrete/sonotube-calculator`

Formulas:

- **Volume per pier**: `V(pier) = π × (d(in) / 24)² × h(ft)`
- **Total for n piers, converted to cubic yards**: `V(total) = Σ V(i) for i = 1 to n; V(yd³) = V(total) / 27`

Assumptions:

- The form is a perfect cylinder and the labelled tube diameter is the finished pier diameter — measure the form, not the post inside it.
- Diameter in inches is converted with d/24: halve it for the radius, then divide by 12 to reach feet.
- Height is entered in feet. Standard diameters are 8, 10, 12, 14, 16, 18 and 24 in.
- Circular volumes are net: no waste allowance is added; bag counts round up on the total.

Limitations:

- A pier is a short version of the same cylinder; the calculator does not include a bell footing below the tube.
- Cardboard forms bow under pressure and are poured in lifts in practice; deformation and voids are not modelled.
- Depth below frost line and structural reinforcement are local code and engineering questions, not calculator outputs.

Sources: `nist-sp811`, `quikrete-concrete-mix`, `aci-practice`


## Rebar calculator — `/concrete/rebar-calculator`

Formulas:

- **Bars along one run**: `n(s) = ceil(12 × s(ft) / a(in)) + 1`
- **Total bar length with lap allowance**: `L(total) = (n(y) × L + n(x) × W) × (1 + λ)`
- **Stock sticks and weight**: `N(sticks) = ceil(L(total) / 20); W(steel) = L(total) × w(bar)`

Unit weights (lb/ft): #3 0.376, #4 0.668, #5 1.043, #6 1.502, #7 2.044, #8 2.67, #9 3.4, #10 4.303, #11 5.313, #14 7.65, #18 13.6. Stock bars are assumed to be 20 ft.

Assumptions:

- Spacing is centre-to-centre in inches; run lengths are in feet and converted by ×12 before dividing.
- The +1 bar closes the last space of the grid. One-way placement sets the other direction's count to zero.
- The lap percentage is spread across total length to cover splices and cutting waste; unit weights are the standard lb/ft table values.
- Stock bars are assumed to be 20 ft; longer 30/40/60 ft lengths exist but are less commonly stocked.

Limitations:

- The result is a quantity take-off, not a cut list: individual bar lengths and splice locations must be worked out before ordering.
- Spacing tables cover flatwork on grade. Suspended slabs, retaining walls and structural members need an engineered design.
- Rebar price is an illustrative national range; scrap-steel movement, cutting charges and small-order premiums are not modelled.

Sources: `crsi-rebar`, `aci-practice`, `nist-sp811`

