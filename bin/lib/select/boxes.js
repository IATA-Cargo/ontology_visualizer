"use strict";

const V = require("../parse/vocab");
const { localName } = require("../infer/localName");

/**
 * Which classes become boxes, and what goes inside them.
 *
 * The box rule is one line: a class is drawn iff it carries cargo:vis_element
 * and that value is not a non-box group (Enum / CodeList). Those two groups are
 * excluded because they are code-list vocabularies, not data-model objects --
 * they still appear as column types and edge targets, which is exactly why the
 * orphan-edge validation rule exists.
 *
 * A class with NO vis_element is an error, not a silent omission. Three classes
 * in 3.2 (BookingSegment, LineItemPackage, HandlingService) are in that state
 * today and were hand-tagged in the workbook; the ontology now has to say it.
 */
function selectBoxes(resolved, view) {
  const { classes, properties } = resolved.ontology;
  const hideDeprecated = view ? view.hideDeprecated !== false : true;
  const boxes = [];
  const untagged = [];
  const dropped = { classes: [], columns: 0 };

  for (const [iri, klass] of classes) {
    // A deprecated class is leaving the standard, so it is not drawn at all --
    // unlike cargo:vis_hidden, which keeps the box and only drops its lines.
    if (hideDeprecated && klass.deprecated) {
      dropped.classes.push(klass.localName);
      continue;
    }

    if (!klass.visElement) {
      // Only complain about classes that the ontology actually models as data
      // objects -- one with no restrictions and no parents is inert.
      if (klass.ownRestrictions.length || klass.namedParents.length) {
        untagged.push(klass.localName);
      }
      continue;
    }
    if (V.NON_BOX_ELEMENTS.has(klass.visElement)) continue;
    if (!includedByView(klass, view)) continue;

    const members = (resolved.members.get(iri) || []).filter((member) => {
      const property = properties.get(member.propertyIri);
      if (!hideDeprecated || !property || !property.deprecated) return true;
      dropped.columns++;
      return false;
    });

    boxes.push({
      classIri: iri,
      schema: klass.visElement,
      className: klass.localName,
      nodeId: `${klass.visElement}.${klass.localName}`,
      description: klass.comment,
      visHidden: klass.visHidden === true,
      members,
    });
  }

  return {
    boxes,
    untagged: untagged.sort(),
    droppedDeprecated: { ...dropped, classes: dropped.classes.sort() },
  };
}

/**
 * View membership via cargo:vis_level.
 *
 * `maxLevel: null` means no filtering (the full view). Otherwise a class is in
 * the view iff its level is at or below the threshold, where an unannotated
 * class falls back to the view's defaultLevel. `includeClasses` is an explicit
 * escape hatch for a reduced view while vis_level is still unadopted.
 */
function includedByView(klass, view) {
  if (!view) return true;

  if (Array.isArray(view.includeClasses) && view.includeClasses.length) {
    return view.includeClasses.includes(klass.localName);
  }
  if (Array.isArray(view.excludeClasses) && view.excludeClasses.includes(klass.localName)) {
    return false;
  }
  if (view.maxLevel === null || view.maxLevel === undefined) return true;

  const level = klass.visLevel !== null ? klass.visLevel : view.defaultLevel ?? 0;
  return level <= view.maxLevel;
}

module.exports = { selectBoxes, includedByView };
