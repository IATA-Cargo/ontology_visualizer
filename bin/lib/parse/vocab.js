"use strict";

// IRI constants. Kept in one place so a namespace change in the ontology is a
// one-line edit here rather than a grep across the generator.

const CARGO = "https://onerecord.iata.org/ns/cargo#";
const CODES = "https://onerecord.iata.org/ns/code-lists/";
const XSD = "http://www.w3.org/2001/XMLSchema#";
const RDF = "http://www.w3.org/1999/02/22-rdf-syntax-ns#";
const RDFS = "http://www.w3.org/2000/01/rdf-schema#";
const OWL = "http://www.w3.org/2002/07/owl#";
const DC = "http://purl.org/dc/elements/1.1/";
const TERMS = "http://purl.org/dc/terms/";

module.exports = {
  NS: { CARGO, CODES, XSD, RDF, RDFS, OWL, DC, TERMS },

  RDF_TYPE: RDF + "type",
  RDFS_SUBCLASS_OF: RDFS + "subClassOf",
  RDFS_COMMENT: RDFS + "comment",
  RDFS_LABEL: RDFS + "label",

  OWL_CLASS: OWL + "Class",
  OWL_RESTRICTION: OWL + "Restriction",
  OWL_ON_PROPERTY: OWL + "onProperty",
  OWL_ALL_VALUES_FROM: OWL + "allValuesFrom",
  OWL_SOME_VALUES_FROM: OWL + "someValuesFrom",
  OWL_MAX_CARDINALITY: OWL + "maxCardinality",
  OWL_MIN_CARDINALITY: OWL + "minCardinality",
  OWL_OBJECT_PROPERTY: OWL + "ObjectProperty",
  OWL_DATATYPE_PROPERTY: OWL + "DatatypeProperty",
  OWL_ANNOTATION_PROPERTY: OWL + "AnnotationProperty",
  OWL_ONTOLOGY: OWL + "Ontology",
  OWL_VERSION_IRI: OWL + "versionIRI",
  OWL_VERSION_INFO: OWL + "versionInfo",
  OWL_IMPORTS: OWL + "imports",
  OWL_DEPRECATED: OWL + "deprecated",

  DC_TITLE: DC + "title",
  DC_DESCRIPTION: DC + "description",
  TERMS_MODIFIED: TERMS + "modified",
  TERMS_ABSTRACT: TERMS + "abstract",
  TERMS_TITLE: TERMS + "title",

  // The visualizer annotation vocabulary, declared by the ontology itself.
  VIS_ELEMENT: CARGO + "vis_element",
  VIS_HIDDEN: CARGO + "vis_hidden",
  VIS_LEVEL: CARGO + "vis_level",
  VIS_INVERSE_PROPERTY: CARGO + "vis_inverseProperty",
  VIS_LINK_TO: CARGO + "vis_linkTo",

  CODE_LIST_ELEMENT: CARGO + "CodeListElement",
  XSD_STRING: XSD + "string",

  // vis_element values that name a group of classes we do NOT draw as boxes.
  // They still appear as edge targets, which is why the orphan-edge rule exists.
  NON_BOX_ELEMENTS: new Set(["Enum", "CodeList"]),

  // Every predicate we understand on an owl:Restriction blank node. Anything
  // else is an error rather than a silent skip -- silently dropping unmodelled
  // constructs is what let the previous pipeline ship broken data.
  KNOWN_RESTRICTION_PREDICATES: new Set([
    RDF + "type",
    OWL + "onProperty",
    OWL + "allValuesFrom",
    OWL + "maxCardinality",
    OWL + "minCardinality",
    OWL + "cardinality",
    CARGO + "vis_hidden",
    CARGO + "vis_linkTo",
  ]),
};
