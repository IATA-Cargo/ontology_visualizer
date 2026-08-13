"use strict";

const fs = require("fs");
const { stableStringify, sortedByKey } = require("../util/stableStringify");
const { byName } = require("../util/sortOrder");

const COLUMN_WIDTH = 300;
const ROW_HEIGHT = 450;
const GRID = 16; // the canvas uses snapToGrid with snapGrid={[16,16]}

/**
 * Merge hand-tuned box positions with the current box set. NEVER clobbers.
 *
 * A 97-box layout is a human artifact that took real effort, so:
 *
 *   kept   -- coordinates copied through untouched. Not re-rounded, not
 *             re-snapped, not renumbered. A pure content regeneration must
 *             produce a zero-line diff in this file.
 *   added  -- auto-placed in a fresh band BELOW everything already placed, so
 *             new classes read as an obvious unplaced row instead of landing on
 *             top of tuned boxes. Snapped to the 16px grid so the next Ctrl+P
 *             is a no-op diff.
 *   stale  -- RETAINED and reported, never silently dropped. A class that was
 *             renamed or temporarily filtered out must not lose its coordinates;
 *             a leftover entry is harmless because initializeNodes looks up by
 *             id. Use --prune-positions to remove them deliberately.
 */
function mergePositions({ existing, boxes, prune = false }) {
  const wanted = boxes.map((box) => box.nodeId).sort(byName);
  const wantedSet = new Set(wanted);

  const kept = {};
  const staleIds = [];
  for (const [id, position] of Object.entries(existing)) {
    if (wantedSet.has(id)) kept[id] = position;
    else staleIds.push(id);
  }

  const newIds = wanted.filter((id) => !(id in kept));
  const added = placeNewNodes(newIds, kept, wanted.length);

  const merged = { ...kept, ...added };
  if (!prune) {
    for (const id of staleIds) merged[id] = existing[id];
  }

  return {
    positions: sortedByKey(merged, byName),
    keptIds: Object.keys(kept).sort(byName),
    addedIds: Object.keys(added).sort(byName),
    staleIds: staleIds.sort(byName),
    pruned: prune ? staleIds.sort(byName) : [],
  };
}

/**
 * The sqrt grid from the original bin/import, with two corrections: the row
 * width is computed over the FULL node count so new boxes extend the existing
 * grid rather than starting a narrow one at the origin, and the band starts
 * below the currently occupied area instead of at y=0.
 */
function placeNewNodes(newIds, kept, totalCount) {
  if (!newIds.length) return {};

  const perRow = Math.max(1, Math.round(Math.sqrt(totalCount)));
  const yValues = Object.values(kept).map((p) => p.y);
  const yStart = yValues.length ? snap(Math.max(...yValues) + ROW_HEIGHT) : 0;

  const added = {};
  newIds.forEach((id, index) => {
    added[id] = {
      x: snap((index % perRow) * COLUMN_WIDTH),
      y: snap(yStart + Math.floor(index / perRow) * ROW_HEIGHT),
    };
  });
  return added;
}

function snap(value) {
  return Math.round(value / GRID) * GRID;
}

/** Read an existing positions file, tolerating absence. */
function readPositions(filePath) {
  if (!fs.existsSync(filePath)) return {};
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function serializePositions(positions) {
  return stableStringify(positions);
}

module.exports = { mergePositions, readPositions, serializePositions, GRID };
