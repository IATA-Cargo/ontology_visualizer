"use strict";

const V = require("./vocab");
const { booleanValue, integerValue } = require("./literal");

/**
 * Read one owl:Restriction blank node.
 *
 * Restrictions are the source of both columns and lines:
 *   owl:onProperty      -> the column/edge name
 *   owl:allValuesFrom   -> the column type / edge target
 *   owl:maxCardinality  -> hasOne vs hasMany, and the `array` flag
 *   cargo:vis_hidden    -> per-line suppression at its most precise (P2)
 *   cargo:vis_linkTo    -> the exact classes this line points to, overriding the
 *                          declared range (see select/lines.js)
 *
 * Cardinality arrives on a *separate* restriction node for the same property
 * (the TTL states allValuesFrom and maxCardinality as sibling restrictions), so
 * merging the two is the caller's job -- see mergeRestrictions below.
 *
 * Any predicate outside KNOWN_RESTRICTION_PREDICATES is an error. Silently
 * skipping unmodelled OWL constructs (owl:someValuesFrom, owl:unionOf, ...) is
 * how the previous pipeline lost data without anyone noticing.
 */
function readRestriction(store, node, declaredOnIri, classLabel) {
  const predicates = new Set(
    store.getQuads(node, null, null, null).map((q) => q.predicate.value)
  );

  for (const predicate of predicates) {
    if (!V.KNOWN_RESTRICTION_PREDICATES.has(predicate)) {
      throw new Error(
        `${classLabel}: unsupported predicate <${predicate}> on an owl:Restriction. ` +
          `Extend KNOWN_RESTRICTION_PREDICATES in bin/lib/parse/vocab.js and teach ` +
          `the infer stage what it means -- do not ignore it.`
      );
    }
  }

  const onProperty = store.getObjects(node, V.OWL_ON_PROPERTY, null)[0];
  if (!onProperty) return null; // not a property restriction we can use

  const allValuesFrom = store.getObjects(node, V.OWL_ALL_VALUES_FROM, null)[0];
  const maxCardinality = store.getObjects(node, V.OWL_MAX_CARDINALITY, null)[0];
  const visHidden = store.getObjects(node, V.VIS_HIDDEN, null)[0];

  const label = `${classLabel} restriction on ${onProperty.value}`;

  // cargo:vis_linkTo names the classes the line actually points to. It replaces
  // the old SPARQL "Implicit" branch, which enumerated every subclass of every
  // range so a human could tick the ~35 wanted lines in the workbook's
  // Property_Manual sheet. Validation that each IRI is a real class happens in
  // validate/rules.js, where a class index is available.
  const linkTo = store
    .getObjects(node, V.VIS_LINK_TO, null)
    .filter((t) => t.termType === "NamedNode")
    .map((t) => t.value);

  return {
    bnodeId: node.value,
    onProperty: onProperty.value,
    // An anonymous (blank node) allValuesFrom is a class expression we do not
    // model -- the old SPARQL filtered these out with FILTER(isIRI(?value)).
    allValuesFrom:
      allValuesFrom && allValuesFrom.termType === "NamedNode"
        ? allValuesFrom.value
        : null,
    maxCardinality: integerValue(maxCardinality, label),
    visHidden: booleanValue(visHidden, `${label} cargo:vis_hidden`),
    linkTo,
    declaredOn: declaredOnIri,
  };
}

/**
 * Collapse the restrictions a single class declares into one entry per
 * (property, value) pair, folding in cardinality stated on sibling nodes.
 *
 * A restriction carrying only maxCardinality (no allValuesFrom) contributes its
 * cardinality to every same-property entry rather than becoming a column of its
 * own -- that mirrors the SPARQL's OPTIONAL cardinality join.
 */
function mergeRestrictions(restrictions) {
  const cardinalityByProperty = new Map();
  const hiddenByProperty = new Map();
  const linkToByProperty = new Map();

  for (const r of restrictions) {
    if (r.maxCardinality !== null) {
      cardinalityByProperty.set(r.onProperty, r.maxCardinality);
    }
    // A hide or a link target asserted on a cardinality-only node still
    // expresses intent about the property on this class; keep it so authors need
    // not guess which of the sibling nodes to annotate.
    if (r.visHidden !== null && r.allValuesFrom === null) {
      hiddenByProperty.set(r.onProperty, r.visHidden);
    }
    if (r.linkTo && r.linkTo.length && r.allValuesFrom === null) {
      linkToByProperty.set(r.onProperty, r.linkTo);
    }
  }

  const merged = new Map();
  for (const r of restrictions) {
    if (!r.allValuesFrom) continue;
    const key = `${r.onProperty}|${r.allValuesFrom}`;
    const existing = merged.get(key);
    const resolved = {
      ...r,
      maxCardinality:
        r.maxCardinality !== null
          ? r.maxCardinality
          : cardinalityByProperty.has(r.onProperty)
          ? cardinalityByProperty.get(r.onProperty)
          : null,
      visHidden:
        r.visHidden !== null
          ? r.visHidden
          : hiddenByProperty.has(r.onProperty)
          ? hiddenByProperty.get(r.onProperty)
          : null,
      linkTo:
        r.linkTo && r.linkTo.length
          ? r.linkTo
          : linkToByProperty.get(r.onProperty) || [],
    };
    if (!existing) {
      merged.set(key, resolved);
    } else if (
      // An annotated node beats a bare duplicate of the same (property, value).
      (existing.visHidden === null && resolved.visHidden !== null) ||
      (!existing.linkTo.length && resolved.linkTo.length)
    ) {
      merged.set(key, resolved);
    }
  }

  return [...merged.values()];
}

module.exports = { readRestriction, mergeRestrictions };
