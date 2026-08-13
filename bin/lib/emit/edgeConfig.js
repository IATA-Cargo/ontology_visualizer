"use strict";

const { stableStringify, orderedObject } = require("../util/stableStringify");
const { compareEdges } = require("../util/sortOrder");

const EDGE_KEYS = ["source", "sourceKey", "target", "targetKey", "relation"];

/**
 * Lines -> edges.json.
 *
 * sourcePosition / targetPosition are deliberately never emitted. They are
 * absent from every committed edges.json, and calculateEdges.ts derives which
 * side of a box an edge leaves from live node geometry -- which is strictly
 * better than freezing a choice that becomes wrong the moment a box is dragged.
 */
function buildEdgeConfigs(lines) {
  return [...lines]
    .sort(compareEdges)
    .map((line) => orderedObject(line, EDGE_KEYS));
}

function serializeEdges(edges) {
  return stableStringify(edges);
}

module.exports = { buildEdgeConfigs, serializeEdges, EDGE_KEYS };
