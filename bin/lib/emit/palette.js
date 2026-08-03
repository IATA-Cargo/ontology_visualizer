"use strict";

const fs = require("fs");
const { stableStringify } = require("../util/stableStringify");

const SEED = require("./palette.seed.json");

// Deliberately hideous. An unnoticed placeholder colour is worse than an ugly
// one -- the point is that nobody ships this by accident.
const SENTINEL = "#FF00FF";

/**
 * Merge the colour palette with the groups this view actually uses.
 *
 * Hand-picked hexes are the whole value of this file, so an existing key is
 * NEVER modified. Missing keys are added with a sentinel and a loud warning.
 * Unused keys are reported but kept -- a colour for a class outside this view is
 * not an error.
 *
 * Replaces the workbook's `Colours` sheet.
 */
function mergePalette({ existing, schemas }) {
  const merged = { ...existing };
  const added = [];

  if (!merged.DEFAULT) {
    merged.DEFAULT = SEED.DEFAULT;
    added.push({ key: "DEFAULT", color: SEED.DEFAULT, fromSeed: true });
  }

  for (const schema of [...schemas].sort()) {
    if (merged[schema]) continue;
    const seeded = SEED[schema];
    merged[schema] = seeded || SENTINEL;
    added.push({ key: schema, color: merged[schema], fromSeed: Boolean(seeded) });
  }

  const unused = Object.keys(merged).filter(
    (key) => key !== "DEFAULT" && !schemas.has(key)
  );

  return { palette: orderPalette(merged), added, unused: unused.sort() };
}

/** DEFAULT first (it is the fallback), then the rest alphabetically. */
function orderPalette(palette) {
  const out = { DEFAULT: palette.DEFAULT };
  for (const key of Object.keys(palette).sort()) {
    if (key !== "DEFAULT") out[key] = palette[key];
  }
  return out;
}

function readPalette(filePath) {
  if (!fs.existsSync(filePath)) return {};
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function serializePalette(palette) {
  return stableStringify(palette);
}

module.exports = { mergePalette, readPalette, serializePalette, SENTINEL, SEED };
