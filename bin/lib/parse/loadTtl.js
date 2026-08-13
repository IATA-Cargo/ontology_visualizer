"use strict";

const fs = require("fs");
const { Parser, Store } = require("n3");
const V = require("./vocab");

/**
 * Parse a Turtle file into an in-memory RDF/JS Store.
 *
 * owl:imports is deliberately NOT followed. The imported code-list ontology is
 * a remote URL, and every `codes:*` class the visualizer needs is already
 * declared locally in the ONE-Record TTL (45 of them, each tagged
 * vis_element "CodeList"). So the generator needs no network access at all.
 */
function loadTtl(ttlPath, { log } = {}) {
  const text = fs.readFileSync(ttlPath, "utf8");
  const parser = new Parser({ format: "text/turtle" });
  const store = new Store();

  // n3's sync parse throws on the first syntax error, with line information.
  const quads = parser.parse(text);
  store.addQuads(quads);

  const imports = store
    .getObjects(null, V.OWL_IMPORTS, null)
    .map((term) => term.value);
  if (imports.length && log) {
    for (const target of imports) {
      log.info(`not following owl:imports <${target}> (no network access needed)`);
    }
  }

  return { store, quadCount: quads.length, imports };
}

module.exports = { loadTtl };
