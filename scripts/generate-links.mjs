/**
 * Regenerate the internal document navigation block in README.md.
 *
 * links.json is the single source of truth. Anchors are fixed, descriptive
 * labels for repository files — this script does not generate outbound links
 * or rotate anchor text. Re-running only rewrites the marked block.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** Build { file → { slot → entries } } from links.json. */
export function buildBlocks(config) {
  const byFile = new Map();
  for (const link of config.links) {
    const file = byFile.get(link.file) ?? new Map();
    const entries = file.get(link.slot) ?? [];
    entries.push({
      anchor: link.anchor,
      target: link.target,
      note: link.note,
    });
    file.set(link.slot, entries);
    byFile.set(link.file, file);
  }
  return byFile;
}

/** Replace one marked block, preserving the prefix on each line. */
function replaceSlot(content, slot, entries) {
  const slotSuffix = slot === "default" ? "" : ` ${slot}`;
  const startToken = `<!-- BUILDCALCS_LINKS:START${slotSuffix} -->`;
  const endToken = `<!-- BUILDCALCS_LINKS:END${slotSuffix} -->`;
  const startIdx = content.indexOf(startToken);
  const endIdx = content.indexOf(endToken, startIdx);
  if (startIdx === -1 || endIdx === -1) {
    throw new Error(`Missing link block: ${startToken} / ${endToken}`);
  }
  const lineStart = content.lastIndexOf("\n", startIdx) + 1;
  const prefix = content.slice(lineStart, startIdx);
  const endLineStart = content.lastIndexOf("\n", endIdx) + 1;
  const lines = entries.map(
    (entry) => `${prefix}- [${entry.anchor}](${entry.target}) — ${entry.note}`,
  );
  return (
    content.slice(0, startIdx + startToken.length) +
    "\n" +
    lines.join("\n") +
    "\n" +
    content.slice(endLineStart)
  );
}

export function applyBlocks(config) {
  const blocks = buildBlocks(config);
  for (const [file, slots] of blocks) {
    const path = resolve(ROOT, file);
    let content = readFileSync(path, "utf8");
    for (const [slot, entries] of slots) {
      content = replaceSlot(content, slot, entries);
    }
    writeFileSync(path, content, "utf8");
  }
  return blocks;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  const config = JSON.parse(readFileSync(resolve(ROOT, "links.json"), "utf8"));
  const blocks = applyBlocks(config);
  let total = 0;
  for (const slots of blocks.values()) {
    for (const entries of slots.values()) {
      total += entries.length;
    }
  }
  process.stdout.write(`Generated ${total} internal links across ${blocks.size} files.\n`);
}
