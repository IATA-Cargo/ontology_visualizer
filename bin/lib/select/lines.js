"use strict";

const { localName } = require("../infer/localName");
const { decideLine } = require("./hide");

/**
 * Candidate lines -> the lines this view actually draws.
 *
 * Only candidates whose BOTH endpoints are boxes in this view survive; that is
 * what prevents the orphan edges the old pipeline shipped (cargo_core published
 * 120 edges for 19 boxes, 82 of them dangling).
 *
 * A candidate with several resolved inverses yields one line per inverse, which
 * reproduces today's `involvedInActions` pair from Core.Piece to
 * Action.Composing and Action.Loading.
 *
 * No resolved inverse -> targetKey "", which the app renders as an
 * attach-to-the-header edge (see calculateEdges.ts turning it into
 * `<target>-table-<side>`).
 */
function selectLines(resolved, boxes, { verbose, view } = {}) {
  const boxByIri = new Map(boxes.map((b) => [b.classIri, b]));
  const { classes } = resolved.ontology;
  const hideDeprecated = view ? view.hideDeprecated !== false : true;

  const lines = [];
  const suppressed = [];
  const skippedOffView = [];

  for (const candidate of resolved.candidates) {
    // A deprecated property has no column in this view, so it must not have a
    // line either -- the edge would attach to a handle that no longer exists.
    if (hideDeprecated && candidate.property && candidate.property.deprecated) continue;

    const source = boxByIri.get(candidate.sourceIri);
    const target = boxByIri.get(candidate.targetIri);

    if (!source || !target) {
      // Not an error: a line to an Enum/CodeList class, or to a class this view
      // filters out, is simply not drawn. Reported so over-filtering is visible.
      skippedOffView.push({
        source: localName(candidate.sourceIri),
        property: localName(candidate.propertyIri),
        target: localName(candidate.targetIri),
        reason: !source ? "source not a box" : "target not a box",
      });
      continue;
    }

    const decision = decideLine(candidate, { classes });
    if (decision.hidden) {
      suppressed.push({ text: decision.describe(), rule: decision.rule });
      continue;
    }

    const targetKeys = candidate.inverseIris.length
      ? candidate.inverseIris.map(localName)
      : [""];

    for (const targetKey of targetKeys) {
      lines.push({
        source: source.nodeId,
        sourceKey: localName(candidate.propertyIri),
        target: target.nodeId,
        targetKey,
        relation: candidate.relation,
      });
    }
  }

  return { lines: dedupe(lines), suppressed, skippedOffView };
}

/**
 * Two restrictions can produce the same 4-tuple (for instance when a subclass
 * restates a parent's range). The app keys edges on that tuple, so duplicates
 * would collide on id.
 */
function dedupe(lines) {
  const seen = new Map();
  for (const line of lines) {
    const key = `${line.source}|${line.sourceKey}|${line.target}|${line.targetKey}`;
    if (!seen.has(key)) seen.set(key, line);
  }
  return [...seen.values()];
}

module.exports = { selectLines };
