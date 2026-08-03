"use strict";

const V = require("./vocab");
const { joinComments, booleanValue } = require("./literal");
const { localName } = require("../infer/localName");

/**
 * Read every owl:ObjectProperty / owl:DatatypeProperty into an OntoProperty.
 *
 * cargo:vis_inverseProperty is MULTI-VALUED -- 92 properties carry it, and
 * :servedActivity has 4 values while :involvedInActions has 8. Which one applies
 * depends on the (class, property, value) triple, so resolution is deferred to
 * infer/resolveInverse.js. Any implementation that reduces this to a single
 * inverse per property is wrong.
 */
function readProperties(store) {
  const properties = new Map();

  const add = (subject, kind) => {
    if (subject.termType !== "NamedNode") return;
    const iri = subject.value;
    if (properties.has(iri)) return;

    const name = localName(iri);

    properties.set(iri, {
      iri,
      localName: name,
      kind,
      comment: joinComments(store.getObjects(subject, V.RDFS_COMMENT, null)),
      visInverse: store
        .getObjects(subject, V.VIS_INVERSE_PROPERTY, null)
        .filter((t) => t.termType === "NamedNode")
        .map((t) => t.value),
      visHidden: booleanValue(
        store.getObjects(subject, V.VIS_HIDDEN, null)[0],
        `property ${name} cargo:vis_hidden`
      ),
      // owl:deprecated is stronger than cargo:vis_hidden: a hidden property keeps
      // its column and loses only its line, whereas a deprecated property is
      // leaving the standard and is dropped from the view entirely.
      deprecated:
        booleanValue(
          store.getObjects(subject, V.OWL_DEPRECATED, null)[0],
          `property ${name} owl:deprecated`
        ) === true,
    });
  };

  for (const s of store.getSubjects(V.RDF_TYPE, V.OWL_OBJECT_PROPERTY, null)) {
    add(s, "object");
  }
  for (const s of store.getSubjects(V.RDF_TYPE, V.OWL_DATATYPE_PROPERTY, null)) {
    add(s, "datatype");
  }

  return properties;
}

module.exports = { readProperties };
