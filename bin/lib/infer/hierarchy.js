"use strict";

/**
 * Transitive closure over named rdfs:subClassOf edges.
 *
 * This is the whole of the "reasoner dependency". The old pipeline needed a
 * reasoner-enabled store only because its SPARQL used direct
 * `?class rdfs:subClassOf ?restriction` and relied on the store materialising
 * subClassOf transitively, so a class inherited its ancestors' restrictions.
 * Computing the closure here reproduces that exactly -- no OWL reasoner needed.
 *
 * Cycle-safe: an ontology asserting mutual subclassing would otherwise recurse
 * forever. Cycles are reported so they can be fixed rather than hidden.
 */
function buildHierarchy(classes) {
  const ancestors = new Map();
  const descendants = new Map();
  const cycles = [];

  for (const iri of classes.keys()) {
    ancestors.set(iri, new Set());
    descendants.set(iri, new Set());
  }

  const visit = (iri, seen) => {
    const cached = ancestors.get(iri);
    if (cached.size || !classes.get(iri).namedParents.length) return cached;

    for (const parent of classes.get(iri).namedParents) {
      if (!classes.has(parent)) continue; // parent outside this ontology
      if (seen.has(parent)) {
        cycles.push([...seen, parent]);
        continue;
      }
      cached.add(parent);
      seen.add(parent);
      for (const grand of visit(parent, seen)) cached.add(grand);
      seen.delete(parent);
    }
    return cached;
  };

  for (const iri of classes.keys()) visit(iri, new Set([iri]));

  for (const [iri, set] of ancestors) {
    for (const parent of set) descendants.get(parent).add(iri);
  }

  return { ancestors, descendants, cycles };
}

module.exports = { buildHierarchy };
