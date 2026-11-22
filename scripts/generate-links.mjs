/**
 * Regenerate the link blocks that point from this repository back to buildcalcs.io.
 *
 * links.json is the single source of truth. Anchor text is chosen deterministically
 * from a DJB2 hash of (offsitePage | slot | targetPath); if that anchor is already
 * used for the same target, the next variant is tried. Re-running never changes the
 * output and never touches content outside the marked blocks.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const djb2 = (s) => {
  let h = 5381;
  for (let i = 0; i < s.length; i += 1) {
    h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
};

/** Build { file → { slot → generated block lines } } from links.json. */
export function buildBlocks(config) {
  const used = new Map();
  const byFile = new Map();

  for (const link of config.links) {
    const target = config.targets[link.targetPath];
    if (!target) {
      throw new Error(`links.json: unknown targetPath ${link.targetPath}`);
    }
    const key = `${link.offsitePage}|${link.slot}|${link.targetPath}`;
    let anchor;
    const taken = used.get(link.targetPath) ?? new Set();
    for (let i = 0; i < target.anchors.length; i += 1) {
      const candidate = target.anchors[(djb2(key) + i) % target.anchors.length];
      if (!taken.has(candidate)) {
        anchor = candidate;
        break;
      }
    }
    if (!anchor) {
      throw new Error(`links.json: no unused anchor left for ${link.targetPath}`);
    }
    taken.add(anchor);
    used.set(link.targetPath, taken);

    const file = byFile.get(link.offsitePage) ?? new Map();
    const lines = file.get(link.slot) ?? [];
    lines.push({
      anchor,
      url: `${config.siteUrl}${link.targetPath}`,
      snippet: target.numberSnippet,
    });
    file.set(link.slot, lines);
    byFile.set(link.offsitePage, file);
  }
  return byFile;
}

/** Replace the marked block for one slot, preserving the prefix on each line. */
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
    (e) => `${prefix}- [${e.anchor}](${e.url}) — ${e.snippet}`,
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
  process.stdout.write(`Generated ${total} links across ${blocks.size} files.\n`);
}
