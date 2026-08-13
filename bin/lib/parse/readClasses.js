"use strict";

const V = require("./vocab");
const { literalText, joinComments, booleanValue, integerValue } = require("./literal");
const { localName, prefixOf } = require("../infer/localName");
const { readRestriction, mergeRestrictions } = require("./readRestrictions");

/**
 * Read every owl:Class into an OntoClass.
 *
 * rdfs:subClassOf carries two different things in this ontology:
 *   - a NamedNode  -> a real parent class (feeds the hierarchy)
 *   - a BlankNode  -> an owl:Restriction (feeds columns and lines)
 * so the two are split here.
 */
function readClasses(store, { log } = {}) {
  const classes = new Map();

  for (const subject of classSubjects(store, { log })) {
    if (subject.termType !== "NamedNode") continue; // anonymous class expression

    const iri = subject.value;
    const name = localName(iri);

    const visElements = store.getObjects(subject, V.VIS_ELEMENT, null);
    let distinct = [...new Set(visElements.map((t) => literalText(t)).filter(Boolean))];

    // A direct subclass of cargo:CodeListElement IS a code list, whether or not
    // it was annotated. 45 of the 46 code-list classes carry
    // vis_element "CodeList" explicitly; codes:SpaceAllocationCode is declared
    // only as `rdfs:subClassOf :CodeListElement` and is neither typed owl:Class
    // nor annotated. Inferring the group from the subclass axiom keeps that from
    // silently becoming an ungrouped, uncoloured column.
    if (!distinct.length && isCodeList(store, subject)) {
      distinct = ["CodeList"];
      if (log) {
        log.warn(
          `class ${name} is a subclass of cargo:CodeListElement but carries no ` +
            `cargo:vis_element -- assuming "CodeList". Add the annotation upstream.`
        );
      }
    }
    if (distinct.length > 1) {
      throw new Error(
        `class ${name}: conflicting cargo:vis_element values ${distinct
          .map((v) => `"${v}"`)
          .join(", ")} -- exactly one is required`
      );
    }

    const namedParents = [];
    const restrictions = [];

    for (const parent of store.getObjects(subject, V.RDFS_SUBCLASS_OF, null)) {
      if (parent.termType === "NamedNode") {
        namedParents.push(parent.value);
        continue;
      }
      const restriction = readRestriction(store, parent, iri, `class ${name}`);
      if (restriction) restrictions.push(restriction);
    }

    classes.set(iri, {
      iri,
      localName: name,
      prefix: prefixOf(iri),
      visElement: distinct[0] || null,
      visLevel: integerValue(
        store.getObjects(subject, V.VIS_LEVEL, null)[0],
        `class ${name} cargo:vis_level`
      ),
      visHidden: booleanValue(
        store.getObjects(subject, V.VIS_HIDDEN, null)[0],
        `class ${name} cargo:vis_hidden`
      ),
      // See readProperties: a deprecated class is not drawn at all, whereas a
      // cargo:vis_hidden one is still drawn, just without lines.
      deprecated:
        booleanValue(
          store.getObjects(subject, V.OWL_DEPRECATED, null)[0],
          `class ${name} owl:deprecated`
        ) === true,
      comment: joinComments(store.getObjects(subject, V.RDFS_COMMENT, null)),
      namedParents,
      ownRestrictions: mergeRestrictions(restrictions),
    });
  }

  return classes;
}

/**
 * Every named class in the ontology.
 *
 * Primarily `rdf:type owl:Class`, plus any subject that states an rdfs:subClassOf
 * without being typed -- an omission the ONE-Record TTL makes for
 * codes:SpaceAllocationCode. Skipping those would silently drop a column's type
 * information, so they are picked up and reported instead.
 */
function classSubjects(store, { log } = {}) {
  const typed = store.getSubjects(V.RDF_TYPE, V.OWL_CLASS, null);
  const seen = new Set(typed.map((t) => t.value));
  const subjects = [...typed];

  for (const subject of store.getSubjects(V.RDFS_SUBCLASS_OF, null, null)) {
    if (subject.termType !== "NamedNode" || seen.has(subject.value)) continue;
    seen.add(subject.value);
    subjects.push(subject);
    if (log) {
      log.warn(
        `<${subject.value}> declares rdfs:subClassOf but is not typed owl:Class ` +
          `-- treating it as a class. Add "rdf:type owl:Class" upstream.`
      );
    }
  }

  return subjects;
}

/** Whether a class is a code list, i.e. a subclass of cargo:CodeListElement. */
function isCodeList(store, subject) {
  return store
    .getObjects(subject, V.RDFS_SUBCLASS_OF, null)
    .some((parent) => parent.value === V.CODE_LIST_ELEMENT);
}

module.exports = { readClasses, classSubjects, isCodeList };
