# Rebar unit weight table

Standard unit weights used by the rebar calculator on **buildcalcs.io** (https://buildcalcs.io). Stock bars are assumed to be 20 ft long.

| Bar | Weight |
| --- | --- |
| #3 | 0.376 lb/ft |
| #4 | 0.668 lb/ft |
| #5 | 1.043 lb/ft |
| #6 | 1.502 lb/ft |
| #7 | 2.044 lb/ft |
| #8 | 2.67 lb/ft |
| #9 | 3.4 lb/ft |
| #10 | 4.303 lb/ft |
| #11 | 5.313 lb/ft |
| #14 | 7.65 lb/ft |
| #18 | 13.6 lb/ft |

Worked example: a 10 × 10 ft grid of #4 bar at 12 in spacing with 10% lap takes 22 bars, 242 linear ft, 13 stock sticks and weighs 161.66 lb.

Bars per run = ceil(12 × span(ft) / spacing(in)) + 1. The result is a quantity take-off, not a cut list or a structural design.

Source: CRSI reinforcing steel resources (https://www.crsi.org/rebar). Checked 2026-11-22.

<!-- BUILDCALCS_LINKS:START -->
- [rebar grid spacing and bar count](https://buildcalcs.io/concrete/rebar-calculator) — #4 @12 in two-way 10×10 ft = 22 bars / 242 ft / 161.66 lb
<!-- BUILDCALCS_LINKS:END -->
