"use strict";

const { buildHierarchy } = require("./hierarchy");
const {
  buildEffectiveRestrictions,
  describeMember,
  resolveCardinality,
} = require("./effectiveRestrictions");
const { resolveInverse } = require("./resolveInverse");
const { localName, isDatatypeIri } = require("./localName");

/**
 * Stage 2: OntologyModel -> ResolvedModel. Still view-agnostic.
 *
 * The load-bearing asymmetry, which the old SPARQL got right and is easy to get
 * wrong:
 *
 *   COLUMNS use effective (inherited) restrictions.
 *   LINES   use own restrictions only.
 *
 * Without it, `checks` / `externalReferences` / `attachedIotDevices` would draw
 * a line from all ~60 descendants of LogisticsObject.
 *
 * To draw a line for a property a class only INHERITS, restate the restriction
 * verbatim on the subclass -- optionally with cargo:vis_linkTo. That is
 * column-neutral, because buildEffectiveRestrictions keys members on
 * (property, allValuesFrom) and prefers the class's own copy.
 */
function resolveOntology(ontology) {
  const { classes, properties } = ontology;
  const { ancestors, descendants, cycles } = buildHierarchy(classes);
  const effective = buildEffectiveRestrictions({ classes, ancestors, descendants });

  // What the ontology marks owl:deprecated. Recorded here but NOT filtered:
  // whether a view drops deprecated content is a per-view choice, applied in the
  // select stage, because one ontology can feed several views.
  const deprecated = {
    properties: [...properties.values()].filter((p) => p.deprecated).map((p) => p.localName).sort(),
    classes: [...classes.values()].filter((c) => c.deprecated).map((c) => c.localName).sort(),
  };

  const members = new Map();
  for (const [iri, entries] of effective) {
    members.set(
      iri,
      entries.map((entry) =>
        describeMember(entry, { classes, properties, descendants, ancestors })
      )
    );
  }

  const candidates = [];
  const ambiguous = [];

  const danglingLinkTo = [];

  for (const [iri, klass] of classes) {
    for (const restriction of klass.ownRestrictions) {
      const valueIri = restriction.allValuesFrom;
      // Datatype-valued restrictions are columns, never lines. This is the
      // Excel's `IF(LEFT(value,3)="xsd","Data","Object")` test.
      if (!valueIri || isDatatypeIri(valueIri)) continue;
      if (!classes.has(valueIri)) continue;

      const property = properties.get(restriction.onProperty);

      for (const targetIri of linkTargets(restriction, { classes, danglingLinkTo, klass })) {
        const inverseIris = resolveInverse(
          { sourceIri: iri, property, targetIri },
          { effective, ancestors }
        );

        if (inverseIris.length > 1) {
          ambiguous.push({
            source: klass.localName,
            property: localName(restriction.onProperty),
            target: localName(targetIri),
            inverses: inverseIris.map(localName),
          });
        }

        candidates.push({
          sourceIri: iri,
          targetIri,
          propertyIri: restriction.onProperty,
          property,
          inverseIris,
          // Matches the Excel: cardinality 1 -> hasOne, anything else
          // (including absent) -> hasMany.
          relation:
            resolveCardinality({
              classIri: iri,
              propertyIri: restriction.onProperty,
              classes,
              ancestors,
            }) === 1
              ? "hasOne"
              : "hasMany",
          restriction,
        });
      }
    }
  }

  return {
    ontology,
    ancestors,
    descendants,
    effective,
    members,
    candidates,
    diagnostics: { cycles, ambiguousInverses: ambiguous, danglingLinkTo, deprecated },
  };
}

/**
 * Which classes a restriction draws a line to.
 *
 * `cargo:vis_linkTo` names them explicitly; otherwise it is the declared
 * `owl:allValuesFrom` range. That single annotation replaces the old SPARQL's
 * "Implicit" branch, which enumerated every subclass of every range (~1,200
 * rows) so a human could tick the ~35 wanted lines in the workbook's
 * Property_Manual sheet.
 *
 * It exists because the choice is genuinely editorial and not derivable from the
 * ontology: `involvedInActions` has range `LogisticsAction`, but the diagram
 * wants `Piece -> Composing` and `Piece -> Loading` specifically. Guessing that
 * from the class hierarchy needs heuristics; stating it needs one annotation.
 *
 * Deliberately NOT done with narrowing `owl:allValuesFrom` restrictions: a
 * second allValuesFrom for the same property yields a second effective member,
 * i.e. a duplicate column. (The ontology does that in two places already --
 * IotDevice.manufacturer and DgDeclaration.issuedForPiece both ship as duplicate
 * columns -- so it is established behaviour, but not worth spreading.) Restating
 * a restriction with the SAME range plus vis_linkTo is column-neutral.
 */
function linkTargets(restriction, { classes, danglingLinkTo, klass }) {
  if (!restriction.linkTo || !restriction.linkTo.length) {
    return [restriction.allValuesFrom];
  }

  const targets = [];
  for (const iri of restriction.linkTo) {
    if (classes.has(iri)) {
      targets.push(iri);
      continue;
    }
    // A vis_linkTo naming a class that does not exist means a typo or a rename.
    // Reported so it fails the build rather than silently dropping a line --
    // exactly the failure mode Property_Manual had no defence against.
    danglingLinkTo.push({
      source: klass.localName,
      property: localName(restriction.onProperty),
      target: iri,
    });
  }
  return targets;
}

module.exports = { resolveOntology, resolveInverse, buildHierarchy, linkTargets };
