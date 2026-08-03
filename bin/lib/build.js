"use strict";

const fs = require("fs");
const path = require("path");

const { discoverOntologies, assertUniqueSlugs } = require("./discover");
const { parseOntology } = require("./parse");
const { resolveOntology } = require("./infer");
const { readViews } = require("./select/views");
const { selectBoxes } = require("./select/boxes");
const { selectLines } = require("./select/lines");
const { buildTableConfig } = require("./emit/tableConfig");
const { buildEdgeConfigs, serializeEdges } = require("./emit/edgeConfig");
const { buildTablesBarrel } = require("./emit/tablesBarrel");
const { mergeDatabases, readDatabases, serializeDatabases, DATABASES_PATH } = require("./emit/databasesJson");
const { mergePositions, readPositions, serializePositions } = require("./emit/positions");
const { mergePalette, readPalette, serializePalette } = require("./emit/palette");
const { FileWriter } = require("./emit/writeIfChanged");
const { stableStringify } = require("./util/stableStringify");
const { compareBoxes } = require("./util/sortOrder");
const { runRules } = require("./validate/rules");
const { makeLogger, reportView, reportWriter } = require("./validate/report");

const CONFIG_ROOT = "src/config/databases";

/**
 * Build every view of every discovered ontology.
 *
 * `check: true` re-derives everything and byte-compares against what is
 * committed without writing a thing. That is the guardrail that makes committing
 * generated output safe -- a stale commit fails the build instead of deploying.
 */
function build(options = {}) {
  const { check = false, strict = false, verbose = false, json = false, slugs = [], prunePositions = false } = options;
  const log = makeLogger({ verbose, json });
  const writer = new FileWriter({ dryRun: check });

  const ontologies = discoverOntologies();
  if (!ontologies.length) {
    log.error("no *.ttl found in ontologies/ -- drop an ontology in there first");
    return { exitCode: 1, log };
  }

  // ---- parse, infer and select every view -------------------------------
  const builds = [];
  for (const { ttlPath } of ontologies) {
    log.info(`reading ${ttlPath}`);
    const ontology = parseOntology(ttlPath, { log });
    log.info(
      `  ${ontology.classes.size} classes, ${ontology.properties.size} properties, ` +
        `${ontology.quadCount} triples`
    );
    if (ontology.meta.versionInfo && ontology.meta.versionIri) {
      const version = String(ontology.meta.versionIri).split(/[#/]/).pop();
      if (!String(ontology.meta.versionInfo).startsWith(version)) {
        log.warn(
          `${ttlPath}: owl:versionInfo "${ontology.meta.versionInfo}" disagrees with ` +
            `owl:versionIRI "${version}" -- this looks like a release candidate`
        );
      }
    }

    const resolved = resolveOntology(ontology);
    for (const c of resolved.diagnostics.cycles) {
      log.error(`rdfs:subClassOf cycle: ${c.join(" -> ")}`);
    }

    const { views } = readViews(ttlPath, ontology, { log });
    for (const view of views) {
      if (slugs.length && !slugs.includes(view.slug)) continue;
      builds.push({ ttlPath, ontology, resolved, view });
    }
  }

  if (!builds.length) {
    log.error(
      slugs.length
        ? `no view matches slug(s): ${slugs.join(", ")}`
        : "no views to build"
    );
    return { exitCode: 1, log };
  }
  assertUniqueSlugs(builds);

  // ---- emit ------------------------------------------------------------
  let blocking = 0;
  const emitted = [];

  for (const { resolved, view: viewDef } of builds) {
    const { boxes, untagged, droppedDeprecated } = selectBoxes(resolved, viewDef);
    boxes.sort(compareBoxes);
    const { lines, suppressed } = selectLines(resolved, boxes, { verbose, view: viewDef });
    const edges = buildEdgeConfigs(lines);

    const dir = `${CONFIG_ROOT}/${viewDef.slug}`;
    const schemas = new Set(boxes.map((b) => b.schema));

    const palette = mergePalette({ existing: readPalette(`${dir}/schemaColors.json`), schemas });
    const positions = mergePositions({
      existing: readPositions(`${dir}/tablePositions.json`),
      boxes,
      prune: prunePositions,
    });

    for (const entry of palette.added) {
      const how = entry.fromSeed ? "from the known palette" : "as a PLACEHOLDER";
      log.warn(
        `${viewDef.slug}: group "${entry.key}" had no colour -- added ${entry.color} ${how}. ` +
          `Edit ${dir}/schemaColors.json`
      );
    }

    // Table JSONs, plus removal of files for classes that no longer exist.
    const wantedFiles = new Set();
    for (const box of boxes) {
      const file = `${dir}/tables/${box.nodeId}.json`;
      wantedFiles.add(path.normalize(file));
      writer.write(file, stableStringify(buildTableConfig(box)));
    }
    const tablesDir = `${dir}/tables`;
    if (fs.existsSync(tablesDir)) {
      for (const name of fs.readdirSync(tablesDir)) {
        if (!name.endsWith(".json")) continue;
        const full = path.normalize(`${tablesDir}/${name}`);
        if (!wantedFiles.has(full)) writer.remove(full);
      }
    }

    writer.write(`${dir}/tables.ts`, buildTablesBarrel(boxes));
    writer.write(`${dir}/edges.json`, serializeEdges(edges));
    writer.write(`${dir}/schemaColors.json`, serializePalette(palette.palette));
    writer.write(`${dir}/tablePositions.json`, serializePositions(positions.positions));

    const view = {
      slug: viewDef.slug,
      boxes,
      edges,
      untagged,
      palette: palette.palette,
      positions,
      suppressed,
      ambiguousInverses: resolved.diagnostics.ambiguousInverses,
      danglingLinkTo: resolved.diagnostics.danglingLinkTo,
      deprecated: viewDef.hideDeprecated
        ? { ...resolved.diagnostics.deprecated, ...droppedDeprecated }
        : null,
    };
    emitted.push(view);

    const diagnostics = runRules(view);
    blocking += reportView(view, diagnostics, { log, strict, verbose });
  }

  // ---- register the views in the database menu --------------------------
  const databases = mergeDatabases({
    existing: readDatabases(DATABASES_PATH),
    views: builds.map((b) => b.view),
  });
  for (const slug of databases.added) log.info(`registered "${slug}" in ${DATABASES_PATH}`);
  writer.write(DATABASES_PATH, serializeDatabases(databases.databases));

  blocking += reportWriter(writer, { log, check });

  if (json) {
    console.log(
      JSON.stringify(
        {
          views: emitted.map((v) => ({ slug: v.slug, boxes: v.boxes.length, edges: v.edges.length })),
          diagnostics: log.records,
          dirty: writer.dirty,
        },
        null,
        2
      )
    );
  }

  return { exitCode: blocking ? 1 : 0, log, views: emitted, writer };
}

module.exports = { build, CONFIG_ROOT };
