"use strict";

const fs = require("fs");
const path = require("path");

const ONTOLOGY_DIR = "ontologies";

/**
 * Find every ontology to build.
 *
 * This is what makes "drop a TTL in and it shows up" true: the generator's input
 * set is the directory listing, not a registry that has to be edited in step.
 * Databases whose TTL is not present (the frozen 3.0.1 / 3.1 ones) are simply
 * invisible here, so they coexist untouched.
 *
 * Two layouts are supported:
 *
 *   ontologies/<release>/Name.ttl   -- one folder per standard release, e.g.
 *                                      ontologies/2026-08/. Preferred: several
 *                                      releases coexist, each with its own
 *                                      sidecars, and adding the next one is a
 *                                      new folder.
 *   ontologies/Name.ttl             -- flat, still accepted so a single loose
 *                                      TTL works with no ceremony.
 *
 * Sidecars (`*.views.json`, `*.accepted-diff.json`) always sit next to their TTL,
 * so they travel with the release rather than being shared across releases.
 */
function discoverOntologies({ dir = ONTOLOGY_DIR } = {}) {
  if (!fs.existsSync(dir)) return [];

  const found = [];

  // Release folders newest first (2026-08 before 2025-07), because that order
  // becomes the database menu order and the app opens on the first entry.
  for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort(newestFirst)) {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      for (const name of fs.readdirSync(full).sort()) {
        if (!isTtl(name)) continue;
        found.push(describe(path.join(full, name), entry.name));
      }
      continue;
    }

    if (isTtl(entry.name)) found.push(describe(full, null));
  }

  return found;
}

function describe(filePath, release) {
  const normalized = filePath.replace(/\\/g, "/");
  return {
    ttlPath: normalized,
    basename: path.basename(normalized).replace(/\.ttl$/i, ""),
    // The release folder name, or null for a loose TTL. Used only for reporting
    // and to disambiguate identically-named files across releases.
    release,
    label: release ? `${release}/${path.basename(normalized)}` : path.basename(normalized),
  };
}

function isTtl(name) {
  return name.toLowerCase().endsWith(".ttl");
}

/**
 * Directories descending (release folders are date-stamped, so this is
 * newest-first); loose files after them, ascending.
 */
function newestFirst(a, b) {
  if (a.isDirectory() !== b.isDirectory()) return a.isDirectory() ? -1 : 1;
  const flip = a.isDirectory() ? -1 : 1;
  return (a.name < b.name ? -1 : a.name > b.name ? 1 : 0) * flip;
}

/**
 * Slug collisions would silently overwrite a whole database, which matters more
 * now that several releases of the same ontology sit side by side -- they all
 * derive `cargo_<version>` from owl:versionIRI, so a release folder that forgets
 * to bump its version would clobber its predecessor.
 */
function assertUniqueSlugs(builds) {
  const bySlug = new Map();
  for (const build of builds) {
    const existing = bySlug.get(build.view.slug);
    if (existing) {
      throw new Error(
        `two views both produce slug "${build.view.slug}": ` +
          `${existing.ttlPath} and ${build.ttlPath}. ` +
          `Set an explicit "slug" in the views.json sidecar of one of them.`
      );
    }
    bySlug.set(build.view.slug, build);
  }
}

module.exports = { discoverOntologies, assertUniqueSlugs, ONTOLOGY_DIR };
