"use strict";

// The published files' column order came from the triple store's internal hash
// order (ordinal_position was a running COUNTIFS over pasted SPARQL results),
// so it is not reproducible. We define a deterministic order instead.
//
// Intl.Collator rather than raw `<` so that mixed-case names sort identically
// on Windows and Linux.
const collator = new Intl.Collator("en", { sensitivity: "variant" });

/** Compare two local names stably across platforms. */
function byName(a, b) {
  return collator.compare(a, b);
}

/**
 * Column order within a box: object properties first, then own before
 * inherited, then by name.
 *
 * Object properties lead because they are the ones carrying edge handles --
 * clustering them at the top of the box keeps connecting lines short. Own
 * before inherited puts the class's own semantics before what it gets from its
 * ancestors.
 */
function compareColumns(a, b) {
  if (a.isDatatype !== b.isDatatype) return a.isDatatype ? 1 : -1;
  if (a.inherited !== b.inherited) return a.inherited ? 1 : -1;
  return byName(a.name, b.name);
}

/** Edge order: source, sourceKey, target, targetKey -- all ascending. */
function compareEdges(a, b) {
  return (
    byName(a.source, b.source) ||
    byName(a.sourceKey, b.sourceKey) ||
    byName(a.target, b.target) ||
    byName(a.targetKey, b.targetKey)
  );
}

/** Box order, used for the tables.ts barrel and position assignment. */
function compareBoxes(a, b) {
  return byName(a.nodeId, b.nodeId);
}

module.exports = { byName, compareColumns, compareEdges, compareBoxes, collator };
