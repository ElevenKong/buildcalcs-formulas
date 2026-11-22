/**
 * Checks the off-site link matrix: coverage of every buildcalcs.io page,
 * unique varied anchors, clean absolute URLs, idempotent generation and a
 * pinned set of numeric facts that must stay in sync with the site copy.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { buildBlocks } from "../scripts/generate-links.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const config = JSON.parse(readFileSync(resolve(ROOT, "links.json"), "utf8"));

const TARGET_PATHS = [
  "/",
  "/about",
  "/calculation-methodology",
  "/concrete",
  "/concrete/block-calculator",
  "/concrete/yard-calculator",
  "/concrete/slab-calculator",
  "/concrete/quikrete-calculator",
  "/cost/concrete-slab-cost-calculator",
  "/concrete/post-hole-calculator",
  "/concrete/sonotube-calculator",
  "/concrete/rebar-calculator",
  "/concrete/how-much-concrete-do-i-need",
  "/concrete/how-much-is-a-yard-of-concrete",
  "/concrete/how-long-does-concrete-take-to-cure",
  "/concrete/mix-ratio",
];

const BANNED = ["click here", "read more", "learn more", "this link", "more info"];

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

describe("Off-site link matrix", () => {
  it("covers all 16 site pages, with no unknown targets", () => {
    const linked = new Set(config.links.map((link) => link.targetPath));
    for (const path of TARGET_PATHS) {
      assert.ok(linked.has(path), `no off-site link points to ${path}`);
    }
    assert.strictEqual(linked.size, TARGET_PATHS.length);
    for (const link of config.links) {
      assert.ok(config.targets[link.targetPath], `unknown target ${link.targetPath}`);
    }
  });

  it("uses a different anchor for every link to the same target page", () => {
    const blocks = buildBlocks(config);
    for (const slots of blocks.values()) {
      for (const entries of slots.values()) {
        assert.ok(entries.length <= 3, "at most three links per off-site block");
      }
    }
    const byTarget = new Map();
    for (const slots of blocks.values()) {
      for (const entries of slots.values()) {
        for (const entry of entries) {
          const path = new URL(entry.url).pathname;
          const list = byTarget.get(path) ?? [];
          assert.ok(
            !list.includes(entry.anchor),
            `duplicate anchor for ${path}: ${entry.anchor}`,
          );
          list.push(entry.anchor);
          byTarget.set(path, list);
        }
      }
    }
  });

  it("uses descriptive anchors only, with absolute clean URLs", () => {
    const blocks = buildBlocks(config);
    for (const slots of blocks.values()) {
      for (const entries of slots.values()) {
        for (const entry of entries) {
          const lower = entry.anchor.toLowerCase();
          for (const banned of BANNED) {
            assert.ok(!lower.includes(banned), `banned anchor: ${entry.anchor}`);
          }
          assert.ok(!/^https?:\/\//i.test(entry.anchor), "bare URL as anchor");
          assert.ok(entry.anchor.length > 8, "anchor is too generic");
          const url = new URL(entry.url);
          assert.strictEqual(url.protocol, "https:");
          assert.strictEqual(url.hostname, "buildcalcs.io");
          assert.strictEqual(url.search, "");
          assert.strictEqual(url.hash, "");
          if (url.pathname !== "/") {
            assert.ok(!url.pathname.endsWith("/"), "trailing slash in target path");
          }
          assert.ok(entry.snippet.length > 10, "numeric snippet is missing");
        }
      }
    }
  });

  it("generated blocks match links.json exactly", () => {
    const blocks = buildBlocks(config);
    for (const [file, slots] of blocks) {
      const content = readFile(file);
      for (const [slot, entries] of slots) {
        const expected = entries.map(
          (e) => `- [${e.anchor}](${e.url}) — ${e.snippet}`,
        );
        assert.deepStrictEqual(
          extractGeneratedLines(content, slot),
          expected,
          `${file} / ${slot} is out of date — run npm run links`,
        );
      }
    }
  });

  it("every off-site page names the brand and domain in plain text", () => {
    const pages = new Set(config.links.map((link) => link.offsitePage));
    for (const page of pages) {
      const content = readFile(page);
      assert.ok(
        content.toLowerCase().includes("buildcalcs.io"),
        `${page} never spells out the domain`,
      );
    }
    const readme = readFile("README.md").toLowerCase();
    assert.ok(readme.includes("buildcalcs"), "README has no brand name");
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
