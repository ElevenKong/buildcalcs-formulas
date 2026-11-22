/**
 * Publish (or update) the four standalone table gists. Each gist is a separate
 * crawlable page that carries its own numbers and links back to buildcalcs.io.
 * IDs and URLs are recorded in gists.json so a second run updates in place.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const GISTS = [
  {
    file: "gists/bag-yield-table.md",
    purpose: "Bag yields: 40/50/60/80/90 lb and UK/AU 25 kg, 20 kg",
    description:
      "Concrete bag yield table from buildcalcs.io (https://buildcalcs.io): 40 lb 0.30 cu ft, 50 lb 0.375, 60 lb 0.45, 80 lb 0.60, 90 lb 0.675; 25 kg 0.0117 m3, 20 kg 0.00936 m3.",
  },
  {
    file: "gists/cubic-yard-chart.md",
    purpose: "Cubic yard chart for common slabs and coverage per yard",
    description:
      "Cubic yard chart from buildcalcs.io (https://buildcalcs.io): 10x10 ft slab at 4 in = 1.23 yd3; one yard covers 81 sq ft at 4 in, 108 at 3 in, 54 at 6 in.",
  },
  {
    file: "gists/rebar-weight-table.md",
    purpose: "Standard rebar unit weights and a worked grid example",
    description:
      "Rebar unit weight table from buildcalcs.io (https://buildcalcs.io): #3 0.376 lb/ft through #18 13.6 lb/ft; #4 @12 in two-way 10x10 ft = 22 bars / 242 ft / 161.66 lb.",
  },
  {
    file: "gists/block-count-reference.md",
    purpose: "CMU block count reference with the 1.125 factor",
    description:
      "CMU block count reference from buildcalcs.io (https://buildcalcs.io): 1.125 blocks per sq ft, 80 sq ft wall = 90 blocks, 80 lb mortar bag lays about 32 blocks.",
  },
];

const registryPath = resolve(ROOT, "gists.json");
const registry = existsSync(registryPath)
  ? JSON.parse(readFileSync(registryPath, "utf8"))
  : [];

for (const entry of GISTS) {
  const filePath = resolve(ROOT, entry.file);
  const existing = registry.find((item) => item.file === entry.file);
  const args = existing
    ? ["gist", "edit", existing.id, filePath]
    : ["gist", "create", filePath, "--public", "--desc", entry.description];
  const output = execFileSync("gh", args, { encoding: "utf8", cwd: ROOT }).trim();
  const url = output.split(/\s+/).find((token) => token.startsWith("https://gist.github.com/"));
  if (!url) {
    throw new Error(`No gist URL returned for ${entry.file}: ${output}`);
  }
  const id = url.split("/").pop();
  const record = { ...entry, id, url };
  delete record.description;
  if (existing) {
    Object.assign(existing, record);
  } else {
    registry.push(record);
  }
  process.stdout.write(`${url}\n`);
}

writeFileSync(registryPath, `${JSON.stringify(registry, null, 2)}\n`, "utf8");
