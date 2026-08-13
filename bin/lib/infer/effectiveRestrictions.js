"use strict";

const V = require("../parse/vocab");
const { localName, isDatatypeIri } = require("./localName");

/**
 * The effective member list of a class: its own owl:allValuesFrom restrictions
 * unioned with those of every transitive ancestor, deduped by (property, value).
 *
 * This is what makes DG.PieceDg show 42 columns when it declares only 9 of them
 * itself -- it inherits Core.Piece's 35.
 *
 * Nearest-wins for cardinality: a subclass restating maxCardinality overrides
 * its ancestor's, which mirrors the SPARQL's OPTIONAL cardinality join against
 * the class being queried.
 */
function buildEffectiveRestrictions({ classes, ancestors, descendants }) {
  const effective = new Map();

  for (const [iri, klass] of classes) {
    const byKey = new Map();

    // Own restrictions first so they win on cardinality and vis_hidden.
    const layers = [
      { restrictions: klass.ownRestrictions, inherited: false },
      ...[...ancestors.get(iri)].map((parent) => ({
        restrictions: classes.get(parent).ownRestrictions,
        inherited: true,
      })),
    ];

    for (const { restrictions, inherited } of layers) {
      for (const r of restrictions) {
        const key = `${r.onProperty}|${r.allValuesFrom}`;
        if (byKey.has(key)) continue; // nearest layer already claimed it
        // classIri is the class the member is shown ON, which is not r.declaredOn
        // when the restriction is inherited.
        byKey.set(key, { restriction: r, inherited, classIri: iri });
      }
    }

    effective.set(iri, [...byKey.values()]);
  }

  return effective;
}

/**
 * The cardinality in force for a (class, property): the class's own value if it
 * states one, otherwise the nearest ancestor's.
 *
 * `owl:maxCardinality` is asserted on a SIBLING restriction node, and
 * mergeRestrictions folds it into same-property entries per class. So a
 * restriction restated on a subclass (to carry cargo:vis_linkTo) has no
 * cardinality of its own and must inherit it -- otherwise `array` flips to true
 * and the edge marker flips from hasOne to hasMany. Cardinality is inherited in
 * OWL, so resolving it across the hierarchy is also simply correct.
 */
function resolveCardinality({ classIri, propertyIri, classes, ancestors }) {
  const own = classes.get(classIri);
  if (own) {
    const stated = own.ownRestrictions.find(
      (r) => r.onProperty === propertyIri && r.maxCardinality !== null
    );
    if (stated) return stated.maxCardinality;
  }

  for (const parentIri of ancestors.get(classIri) || []) {
    const parent = classes.get(parentIri);
    if (!parent) continue;
    const stated = parent.ownRestrictions.find(
      (r) => r.onProperty === propertyIri && r.maxCardinality !== null
    );
    if (stated) return stated.maxCardinality;
  }
  return null;
}

/**
 * Turn an effective entry into the shape the emitters consume.
 *
 * valueSubclassLocalNames feeds `columnSubTypes` (the chips under a column) and
 * reproduces the SPARQL's `?subvalue rdfs:subClassOf+ ?value` block, including
 * its exclusions of CodeListElement, xsd:string and the value itself.
 */
function describeMember(
  { restriction, inherited, classIri },
  { classes, properties, descendants, ancestors }
) {
  const property = properties.get(restriction.onProperty);
  const valueIri = restriction.allValuesFrom;
  const valueClass = classes.get(valueIri);

  const subtypes =
    valueIri && !isDatatypeIri(valueIri) && valueIri !== V.CODE_LIST_ELEMENT
      ? [...(descendants.get(valueIri) || [])]
          .filter((iri) => iri !== valueIri && iri !== V.CODE_LIST_ELEMENT)
          .map(localName)
          .sort()
      : [];

  return {
    propertyIri: restriction.onProperty,
    name: property ? property.localName : localName(restriction.onProperty),
    description: property ? property.comment : null,
    valueIri,
    typeName: localName(valueIri),
    isDatatype: isDatatypeIri(valueIri),
    valueVisElement: valueClass ? valueClass.visElement : null,
    maxCardinality: resolveCardinality({
      classIri,
      propertyIri: restriction.onProperty,
      classes,
      ancestors,
    }),
    inherited,
    declaredOn: restriction.declaredOn,
    restriction,
    property,
    valueSubclassLocalNames: subtypes,
  };
}

module.exports = { buildEffectiveRestrictions, describeMember, resolveCardinality };
