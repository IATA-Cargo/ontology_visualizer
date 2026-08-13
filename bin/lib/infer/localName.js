"use strict";

const { NS } = require("../parse/vocab");

// Replaces the Excel SUBSTITUTE columns (Raw!L:P) that stripped namespace
// prefixes to bare local names.
//
// Note the workbook's property column (M) had its third SUBSTITUTE's arguments
// swapped, so a few published property local names may be subtly mangled.
// Correct extraction here can therefore produce legitimate diffs against the
// committed files; those are improvements, not regressions.

const PREFIXES = [
  ["cargo", NS.CARGO],
  ["codes", NS.CODES],
  ["xsd", NS.XSD],
  ["rdfs", NS.RDFS],
  ["owl", NS.OWL],
];

/**
 * Bare local name of an IRI: `…/cargo#Piece` -> `Piece`,
 * `…/XMLSchema#string` -> `string`, `…/code-lists/PackageMarkCode` -> `PackageMarkCode`.
 */
function localName(iri) {
  if (!iri) return null;
  const hash = iri.lastIndexOf("#");
  if (hash >= 0) return iri.slice(hash + 1);
  const slash = iri.lastIndexOf("/");
  if (slash >= 0) return iri.slice(slash + 1);
  return iri;
}

/** Which known namespace an IRI sits in, or null. */
function prefixOf(iri) {
  if (!iri) return null;
  for (const [name, ns] of PREFIXES) {
    if (iri.startsWith(ns)) return name;
  }
  return null;
}

/** True for xsd:* IRIs -- these are datatype values, not classes. */
function isDatatypeIri(iri) {
  return Boolean(iri) && iri.startsWith(NS.XSD);
}

module.exports = { localName, prefixOf, isDatatypeIri };
