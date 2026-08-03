"use strict";

const { localName } = require("../infer/localName");

/**
 * Decide whether one candidate line is drawn, and record WHY.
 *
 * This replaces the workbook's line-selection machinery entirely: the
 * View_full!In/Out columns and all 1205 rows of the Property_Manual sheet. Every
 * decision now comes from a cargo:vis_hidden annotation in the ontology.
 *
 * Three valid placements, in decreasing generality:
 *
 *   P1  on an owl:ObjectProperty  -> hide that property's lines everywhere.
 *       The COLUMN stays; only the line goes. Cheapest lever: `checks` and
 *       `events` are each declared on exactly one ancestor (LogisticsObject),
 *       so one assertion suppresses ~60 inherited lines.
 *
 *   P2  on the owl:Restriction bnode -> hide exactly one class->property->value
 *       line. Because subclasses inherit the restriction, a hide asserted on an
 *       ancestor propagates to every descendant. `vis_hidden false` here is an
 *       explicit UN-hide that overrides a broader P1/P3 hide -- that is how
 *       "hide `checks` everywhere except Core.Piece" is expressed, and how the
 *       directional cases (a class that is a source but never a target) are
 *       handled without inventing new vocabulary.
 *
 *   P3  on an owl:Class -> hide every line in and out. The box is still drawn,
 *       isolated. Reproduces the 28 zero-edge boxes with ~18 assertions.
 *
 * Precedence is most-specific-first: restriction, then class, then property.
 */
function decideLine(candidate, { classes }) {
  const source = classes.get(candidate.sourceIri);
  const target = classes.get(candidate.targetIri);
  const property = candidate.property;

  const describe = () =>
    `${source.localName} --${localName(candidate.propertyIri)}--> ${target.localName}`;

  // P2 -- restriction level, including an explicit un-hide.
  if (candidate.restriction.visHidden !== null) {
    const onAncestor = candidate.restriction.declaredOn !== candidate.sourceIri;
    const where = onAncestor
      ? `restriction inherited from ${localName(candidate.restriction.declaredOn)}`
      : `restriction on ${source.localName}`;
    return {
      hidden: candidate.restriction.visHidden,
      rule: `${candidate.restriction.visHidden ? "hide" : "show"}: ${where}`,
      describe,
    };
  }

  // P3 -- class level, either endpoint.
  if (source.visHidden) {
    return { hidden: true, rule: `hide: class ${source.localName}`, describe };
  }
  if (target.visHidden) {
    return { hidden: true, rule: `hide: class ${target.localName}`, describe };
  }

  // P1 -- property level.
  if (property && property.visHidden) {
    return {
      hidden: true,
      rule: `hide: property ${property.localName}`,
      describe,
    };
  }

  return { hidden: false, rule: "show: default", describe };
}

module.exports = { decideLine };
