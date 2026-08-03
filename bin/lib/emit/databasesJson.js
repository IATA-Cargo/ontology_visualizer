"use strict";

const fs = require("fs");
const { stableStringify } = require("../util/stableStringify");

const DATABASES_PATH = "src/config/databases.json";

/**
 * Register a view in the database menu registry.
 *
 * An existing entry is left completely alone. The published names are editorial
 * -- "ONE Record Full Datamodel 3.2.0", the "(deprecated)" suffixes -- and
 * regenerating them from ontology metadata would quietly undo human wording.
 * Frozen databases whose TTLs are not in the repo also live in this file, and
 * must survive untouched.
 */
function mergeDatabases({ existing, views }) {
  const added = [];
  const merged = {};

  // Generated views first, in discovery order (newest release first), then the
  // untouched legacy entries. Key order is the menu order, and the FIRST key is
  // what the app shows at `/` -- so the current release leads and the deprecated
  // 3.0.1/3.1 models sink to the bottom.
  for (const view of views) {
    if (existing[view.slug]) {
      merged[view.slug] = existing[view.slug];
      continue;
    }
    merged[view.slug] = { name: view.name, description: view.description };
    added.push(view.slug);
  }

  for (const [slug, entry] of Object.entries(existing)) {
    if (!merged[slug]) merged[slug] = entry;
  }

  return { databases: merged, added };
}

function readDatabases(filePath = DATABASES_PATH) {
  if (!fs.existsSync(filePath)) return {};
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function serializeDatabases(databases) {
  return stableStringify(databases);
}

module.exports = {
  mergeDatabases,
  readDatabases,
  serializeDatabases,
  DATABASES_PATH,
};
