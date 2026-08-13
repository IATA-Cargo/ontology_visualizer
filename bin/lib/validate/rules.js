"use strict";

/**
 * Validation rules, each returning zero or more diagnostics.
 *
 * The motivating failure is real and currently shipping: cargo_core publishes 19
 * tables and 120 edges, 82 of which reference nodes that do not exist. reactflow
 * drops them silently, so nobody noticed. Rule `orphan-edge` makes that a build
 * error for every generated database.
 *
 * Severity: "error" fails the run; "warn" reports and continues unless --strict.
 */
function runRules(view) {
  return [
    ...orphanEdges(view),
    ...duplicateNodeIds(view),
    ...untaggedClasses(view),
    ...unknownPaletteKeys(view),
    ...positionIssues(view),
    ...inverseIssues(view),
    ...danglingLinkTo(view),
    ...isolatedBoxes(view),
    ...emptyView(view),
  ];
}

function orphanEdges({ slug, boxes, edges }) {
  const ids = new Set(boxes.map((b) => b.nodeId));
  return edges
    .filter((e) => !ids.has(e.source) || !ids.has(e.target))
    .map((e) => ({
      rule: "orphan-edge",
      severity: "error",
      slug,
      message:
        `edge ${e.source} --${e.sourceKey}--> ${e.target} references a node that is not a box ` +
        `(${!ids.has(e.source) ? "source" : "target"} missing). Either draw that class as a box ` +
        `or add cargo:vis_hidden true to suppress the line.`,
    }));
}

function duplicateNodeIds({ slug, boxes }) {
  const seen = new Map();
  const out = [];
  for (const box of boxes) {
    if (seen.has(box.nodeId)) {
      out.push({
        rule: "duplicate-node-id",
        severity: "error",
        slug,
        message:
          `two classes both map to node id "${box.nodeId}": ` +
          `<${seen.get(box.nodeId)}> and <${box.classIri}>`,
      });
    }
    seen.set(box.nodeId, box.classIri);
  }
  return out;
}

function untaggedClasses({ slug, untagged }) {
  if (!untagged || !untagged.length) return [];
  return [
    {
      rule: "missing-vis-element",
      severity: "error",
      slug,
      message:
        `${untagged.length} class(es) carry no cargo:vis_element and cannot be placed in a ` +
        `group or coloured: ${untagged.join(", ")}. Add the annotation to the ontology.`,
    },
  ];
}

function unknownPaletteKeys({ slug, boxes, palette }) {
  if (!palette) return [];
  const missing = [...new Set(boxes.map((b) => b.schema))].filter((s) => !palette[s]).sort();
  return missing.map((schema) => ({
    rule: "unknown-palette-key",
    severity: "error",
    slug,
    message: `group "${schema}" has no colour in schemaColors.json`,
  }));
}

function positionIssues({ slug, positions }) {
  if (!positions) return [];
  const out = [];
  if (positions.addedIds.length) {
    out.push({
      rule: "missing-position",
      severity: "warn",
      slug,
      message:
        `${positions.addedIds.length} new box(es) auto-placed below the existing layout: ` +
        `${positions.addedIds.join(", ")}. Open the view, arrange them, press Ctrl+Shift+P, ` +
        `then run: npm run positions ${slug}`,
    });
  }
  if (positions.staleIds.length) {
    out.push({
      rule: "stale-position",
      severity: "warn",
      slug,
      message:
        `${positions.staleIds.length} saved position(s) no longer match a box and were kept: ` +
        `${positions.staleIds.join(", ")}. Use --prune-positions to drop them.`,
    });
  }
  return out;
}

function inverseIssues({ slug, ambiguousInverses }) {
  if (!ambiguousInverses || !ambiguousInverses.length) return [];
  return ambiguousInverses.map((a) => ({
    rule: "ambiguous-inverse",
    severity: "warn",
    slug,
    message:
      `${a.source}.${a.property} -> ${a.target} resolves to several inverses ` +
      `(${a.inverses.join(", ")}), so one line per inverse is drawn. This usually means a ` +
      `narrowing restriction is missing.`,
  }));
}

/**
 * A cargo:vis_linkTo naming a class that does not exist -- a typo or a class
 * renamed out from under it. An error, because the symptom is otherwise a
 * silently missing line, which is precisely how the Property_Manual sheet went
 * stale without anyone noticing.
 */
function danglingLinkTo({ slug, danglingLinkTo: dangling }) {
  if (!dangling || !dangling.length) return [];
  return dangling.map((d) => ({
    rule: "dangling-link-to",
    severity: "error",
    slug,
    message:
      `${d.source}.${d.property} has cargo:vis_linkTo <${d.target}>, which is not a ` +
      `class in this ontology`,
  }));
}

function isolatedBoxes({ slug, boxes, edges }) {
  const touched = new Set();
  for (const e of edges) {
    touched.add(e.source);
    touched.add(e.target);
  }
  const isolated = boxes
    .filter((b) => !touched.has(b.nodeId) && !b.visHidden)
    .map((b) => b.nodeId)
    .sort();
  if (!isolated.length) return [];
  return [
    {
      rule: "isolated-box",
      severity: "warn",
      slug,
      message:
        `${isolated.length} box(es) have no edges but are not annotated cargo:vis_hidden, so the ` +
        `isolation may be accidental: ${isolated.join(", ")}`,
    },
  ];
}

function emptyView({ slug, boxes }) {
  if (boxes.length) return [];
  return [
    {
      rule: "empty-view",
      severity: "error",
      slug,
      message: "view contains no boxes -- check maxLevel / includeClasses",
    },
  ];
}

module.exports = { runRules };
