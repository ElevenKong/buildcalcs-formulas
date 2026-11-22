/**
 * Checks the internal document navigation and pins the numeric facts copied
 * from the buildcalcs.io site copy so this repository cannot drift silently.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { buildBlocks } from "../scripts/generate-links.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const config = JSON.parse(readFileSync(resolve(ROOT, "links.json"), "utf8"));

const readFile = (file) => readFileSync(resolve(ROOT, file), "utf8");

function extractGeneratedLines(content, slot) {
  const slotSuffix = slot === "default" ? "" : ` ${slot}`;
  const start = `<!-- BUILDCALCS_LINKS:START${slotSuffix} -->`;
  const end = `<!-- BUILDCALCS_LINKS:END${slotSuffix} -->`;
  const startIdx = content.indexOf(start);
  const endIdx = content.indexOf(end, startIdx);
  assert.notStrictEqual(startIdx, -1, `missing start marker ${start}`);
  assert.notStrictEqual(endIdx, -1, `missing end marker ${end}`);
  return content
    .slice(startIdx + start.length, endIdx)
    .split("\n")
    .map((line) => line.trim().replace(/^\*\s*\/\/\s*/, "").replace(/^\/\/\s*/, ""))
    .filter((line) => line.startsWith("- ["));
}

describe("Internal document navigation", () => {
  it("every target exists inside this repository", () => {
    for (const link of config.links) {
      assert.ok(
        existsSync(resolve(ROOT, link.target)),
        `${link.file}: target ${link.target} does not exist`,
      );
      assert.ok(link.anchor.length > 5, `anchor too short: ${link.anchor}`);
      assert.ok(!link.target.startsWith("http"), "navigation target must be local");
    }
  });

  it("generated blocks match links.json exactly", () => {
    const blocks = buildBlocks(config);
    for (const [file, slots] of blocks) {
      const content = readFile(file);
      for (const [slot, entries] of slots) {
        const expected = entries.map(
          (entry) => `- [${entry.anchor}](${entry.target}) — ${entry.note}`,
        );
        assert.deepStrictEqual(
          extractGeneratedLines(content, slot),
          expected,
          `${file} / ${slot} is out of date — run npm run links`,
        );
      }
    }
  });

  it("generated blocks contain no outbound link scheme", () => {
    const blocks = buildBlocks(config);
    for (const slots of blocks.values()) {
      for (const entries of slots.values()) {
        for (const entry of entries) {
          assert.ok(!entry.target.includes("://"), `outbound link in navigation: ${entry.target}`);
        }
      }
    }
  });
});

describe("Numeric facts pinned to the site copy", () => {
  const facts = {
    "calculators.md": [
      "V(yd³) = L(ft) × W(ft) × T(in) / (12 × 27)",
      "1.125 = (144 in²/ft²) / (8 × 16 in²)",
      "0.028316846592 cubic metres",
      "0.668",
    ],
    "bag-yields.md": [
      "0.30 cu ft",
      "0.375 cu ft",
      "0.45 cu ft",
      "0.60 cu ft",
      "0.675 cu ft",
      "0.0117 m³",
      "0.00936 m³",
      "1.23 cubic yards",
    ],
    "guides.md": [
      "33.33 cubic feet",
      "1.23 cubic yards",
      "81 sq ft",
      "28 days",
      "1 : 2 : 3",
      "0.5 by weight",
    ],
    "SOURCES.md": ["nist-sp811", "2026-11-22"],
    "README.md": ["1.23 cubic yards", "56 bags of 80 lb"],
  };

  for (const [file, snippets] of Object.entries(facts)) {
    it(`${file} keeps its site-sourced numbers`, () => {
      const content = readFile(file);
      for (const snippet of snippets) {
        assert.ok(content.includes(snippet), `${file} is missing "${snippet}"`);
      }
    });
  }

  it("when a site checkout is supplied, its source files agree with the pinned facts", () => {
    const siteRoot = process.env.BUILDCALCS_SITE_ROOT;
    if (!siteRoot) {
      return;
    }
    const methodology = readFileSync(
      resolve(siteRoot, "data/methodology.ts"),
      "utf8",
    );
    const sources = readFileSync(resolve(siteRoot, "data/sources.ts"), "utf8");
    for (const snippet of [
      "V(yd³) = L(ft) × W(ft) × T(in) / (12 × 27)",
      "1.125 = (144 in²/ft²) / (8 × 16 in²)",
      "0.0117 m³ and 0.00936 m³",
    ]) {
      assert.ok(methodology.includes(snippet), `site methodology lost "${snippet}"`);
    }
    for (const snippet of ["nist-sp811", "quikrete-concrete-mix", "crsi-rebar"]) {
      assert.ok(sources.includes(snippet), `site source registry lost "${snippet}"`);
    }
  });
});
