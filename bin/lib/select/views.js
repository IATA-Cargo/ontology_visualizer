"use strict";

const fs = require("fs");
const { sanitize } = require("../parse/ontologyMeta");

const SLUG_PATTERN = /^[a-z0-9_]+$/;

/**
 * Read the `<ttl-basename>.views.json` sidecar.
 *
 * Views hold PRESENTATION choices only -- which slug, what title, how much
 * detail. Those can legitimately differ per deployment, so they live in the repo
 * rather than the ontology; the ontology contributes the per-class vis_level.
 *
 * The sidecar is named after the TTL rather than the slug because one ontology
 * can produce several views (a full one and a reduced one).
 */
function readViews(ttlPath, ontology, { log } = {}) {
  const sidecarPath = ttlPath.replace(/\.ttl$/i, ".views.json");

  let declared = null;
  if (fs.existsSync(sidecarPath)) {
    try {
      declared = JSON.parse(fs.readFileSync(sidecarPath, "utf8"));
    } catch (error) {
      throw new Error(`${sidecarPath}: not valid JSON -- ${error.message}`);
    }
  }

  const views = (declared && Array.isArray(declared.views) ? declared.views : []).map(
    (view) => normalizeView(view, ontology)
  );

  if (!views.length) {
    // No sidecar: derive a single full view so that dropping a bare TTL into
    // ontologies/ still produces something.
    views.push(
      normalizeView(
        {
          slug: ontology.derivedSlug,
          name: defaultName(ontology),
          description: defaultDescription(ontology),
          maxLevel: null,
        },
        ontology
      )
    );
    if (log) {
      log.info(
        `no ${basename(sidecarPath)} -- deriving one full view with slug '${views[0].slug}'`
      );
    }
  }

  return { views, sidecarPath };
}

function normalizeView(view, ontology) {
  const slug = sanitize(view.slug || ontology.derivedSlug || "");
  if (!SLUG_PATTERN.test(slug)) {
    throw new Error(
      `view slug "${view.slug}" is not usable: it becomes a directory name, a ` +
        `URL path segment and an output filename, so it must match ${SLUG_PATTERN}`
    );
  }
  return {
    slug,
    name: view.name || defaultName(ontology),
    description: view.description || defaultDescription(ontology),
    maxLevel: view.maxLevel === undefined ? null : view.maxLevel,
    defaultLevel: view.defaultLevel === undefined ? 0 : view.defaultLevel,
    // Default true: content the standard has deprecated should not clutter a new
    // release's diagram. A view reproducing an older published layout can opt out
    // with false -- cargo_3_2 does, because its published edge set predates the
    // deprecations and must stay reproducible.
    hideDeprecated: view.hideDeprecated === undefined ? true : view.hideDeprecated !== false,
    includeClasses: view.includeClasses || null,
    excludeClasses: view.excludeClasses || null,
  };
}

function defaultName(ontology) {
  const { title, versionIri } = ontology.meta || {};
  const version = versionIri ? String(versionIri).split(/[#/]/).pop() : null;
  return [title || ontology.derivedSlug, version].filter(Boolean).join(" ");
}

function defaultDescription(ontology) {
  const { description, modified } = ontology.meta || {};
  if (!description) return "";
  return modified ? `${description} (updated ${modified})` : description;
}

function basename(p) {
  return String(p).split(/[\\/]/).pop();
}

module.exports = { readViews, normalizeView };
