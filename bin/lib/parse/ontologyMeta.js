"use strict";

const V = require("./vocab");
const { literalText, joinComments } = require("./literal");

/**
 * Read the owl:Ontology header.
 *
 * The slug is derived from owl:versionIRI, not owl:versionInfo: versionIRI is
 * `…/ns/cargo/3.2` (giving `cargo_3_2`, reproducing today's slug for free),
 * while versionInfo is `"3.2-rc2"@en` and would yield the unstable and ugly
 * `cargo_3_2_rc2`. When the two disagree the TTL is a release candidate, which
 * is worth surfacing rather than silently encoding into a directory name.
 */
function readOntologyMeta(store) {
  const [subject] = store.getSubjects(V.RDF_TYPE, V.OWL_ONTOLOGY, null);
  if (!subject) {
    return { ontologyIri: null };
  }

  const one = (predicate) =>
    literalText(store.getObjects(subject, predicate, null)[0]);
  const all = (predicate) => store.getObjects(subject, predicate, null);

  const versionIri = store.getObjects(subject, V.OWL_VERSION_IRI, null)[0];

  return {
    ontologyIri: subject.value,
    versionIri: versionIri ? versionIri.value : null,
    versionInfo: one(V.OWL_VERSION_INFO),
    title: one(V.TERMS_TITLE) || one(V.DC_TITLE),
    description: one(V.DC_DESCRIPTION),
    abstract: one(V.TERMS_ABSTRACT),
    modified: one(V.TERMS_MODIFIED),
    comment: joinComments(all(V.RDFS_COMMENT)),
  };
}

/**
 * Slug derived from the ontology IRI plus its version IRI.
 * `https://onerecord.iata.org/ns/cargo` + `…/ns/cargo/3.2` -> `cargo_3_2`.
 */
function slugFromMeta(meta) {
  if (!meta || !meta.ontologyIri) return null;

  const base = lastSegment(meta.ontologyIri);
  if (!meta.versionIri) return sanitize(base);

  const version = lastSegment(meta.versionIri);
  // A versionIRI that does not end in a version-looking segment (e.g. it just
  // repeats the ontology IRI) contributes nothing -- fall back to the base.
  if (!version || version === base) return sanitize(base);

  return sanitize(`${base}_${version}`);
}

function lastSegment(iri) {
  return String(iri).replace(/[#/]+$/, "").split(/[#/]/).pop();
}

function sanitize(text) {
  return String(text).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

module.exports = { readOntologyMeta, slugFromMeta, sanitize };
