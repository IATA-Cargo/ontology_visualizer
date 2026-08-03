"use strict";

const { loadTtl } = require("./loadTtl");
const { readOntologyMeta, slugFromMeta } = require("./ontologyMeta");
const { readClasses } = require("./readClasses");
const { readProperties } = require("./readProperties");

/**
 * Stage 1: TTL -> OntologyModel.
 *
 * Faithful to what the file says, with no view concepts and no inference. Keeps
 * the later stages testable in isolation.
 */
function parseOntology(ttlPath, { log } = {}) {
  const { store, quadCount } = loadTtl(ttlPath, { log });

  const meta = readOntologyMeta(store);
  const classes = readClasses(store, { log });
  const properties = readProperties(store);

  return {
    ttlPath,
    quadCount,
    meta,
    derivedSlug: slugFromMeta(meta),
    classes,
    properties,
  };
}

module.exports = { parseOntology };
