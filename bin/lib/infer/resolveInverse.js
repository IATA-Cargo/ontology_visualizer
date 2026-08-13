"use strict";

/**
 * Resolve which cargo:vis_inverseProperty applies to one (source, property,
 * target) triple. The result becomes the edge's `targetKey`.
 *
 * cargo:vis_inverseProperty is multi-valued, so the correct inverse is the one
 * the TARGET class declares pointing back at the source class -- or at one of
 * the source's ancestors. That ancestor case is why the old SPARQL had two
 * OPTIONAL inverse blocks (one matching `?class`, one matching `?parentclass`
 * via `?class rdfs:subClassOf+ ?parentclass`); testing membership of the
 * source's ancestor set collapses both into one check.
 *
 * Returns every match. Callers emit one line per inverse: that is what produces
 * today's `involvedInActions` pair from Core.Piece to Action.Composing and
 * Action.Loading. More than one match usually means a narrowing restriction is
 * missing, so it is also reported as a warning.
 */
function resolveInverse({ sourceIri, property, targetIri }, { effective, ancestors }) {
  if (!property || !property.visInverse.length) return [];

  const allowed = new Set([sourceIri, ...(ancestors.get(sourceIri) || [])]);
  const targetMembers = effective.get(targetIri) || [];

  const matches = [];
  for (const inverseIri of property.visInverse) {
    const hit = targetMembers.some(
      ({ restriction }) =>
        restriction.onProperty === inverseIri &&
        allowed.has(restriction.allValuesFrom)
    );
    if (hit) matches.push(inverseIri);
  }

  return matches;
}

module.exports = { resolveInverse };
