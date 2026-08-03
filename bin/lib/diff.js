"use strict";

const fs = require("fs");

/**
 * Compare generated output against what is committed, under normalisations that
 * quotient out the dimensions that provably cannot be reproduced.
 *
 * Byte-comparability is not a goal and is not achievable:
 *   - Column order came from the triple store's hash order (ordinal_position was
 *     a running COUNTIFS over pasted SPARQL results).
 *   - All 162 description semicolons in cargo_3_2 were commas in the TTL; the
 *     workbook substituted them because bin/import parsed CSV with split(",").
 *   - The workbook's property-name SUBSTITUTE had its argument pair swapped, so
 *     some published property local names may be subtly mangled.
 *
 * Comparing semantics instead of serialisation is the stronger test anyway.
 */
function diffView({ slug, boxes, edges, buildTableConfig, configRoot }) {
  const dir = `${configRoot}/${slug}`;
  const result = {
    slug,
    tablesAdded: [],
    tablesRemoved: [],
    columnsAdded: [],
    columnsRemoved: [],
    fieldChanges: [],
    edgesAdded: [],
    edgesRemoved: [],
  };

  // ---- tables and columns ----
  const generated = new Map(boxes.map((b) => [b.nodeId, buildTableConfig(b)]));
  const committed = new Map();
  const tablesDir = `${dir}/tables`;
  if (fs.existsSync(tablesDir)) {
    for (const name of fs.readdirSync(tablesDir)) {
      if (!name.endsWith(".json")) continue;
      committed.set(
        name.replace(/\.json$/, ""),
        JSON.parse(fs.readFileSync(`${tablesDir}/${name}`, "utf8"))
      );
    }
  }

  for (const id of generated.keys()) if (!committed.has(id)) result.tablesAdded.push(id);
  for (const id of committed.keys()) if (!generated.has(id)) result.tablesRemoved.push(id);

  for (const [id, gen] of generated) {
    const pub = committed.get(id);
    if (!pub) continue;

    const genCols = new Map(gen.columns.map((c) => [`${c.name}|${c.type}`, c]));
    const pubCols = new Map(pub.columns.map((c) => [`${c.name}|${c.type}`, c]));

    for (const k of genCols.keys()) if (!pubCols.has(k)) result.columnsAdded.push(`${id}.${k}`);
    for (const k of pubCols.keys()) if (!genCols.has(k)) result.columnsRemoved.push(`${id}.${k}`);

    for (const [k, genCol] of genCols) {
      const pubCol = pubCols.get(k);
      if (!pubCol) continue;
      for (const field of ["schemaType", "array", "codelist", "columnSubTypes", "propertyIRI", "valueIRI", "classIRI", "description"]) {
        if (!sameField(field, genCol[field], pubCol[field])) {
          result.fieldChanges.push({
            where: `${id}.${genCol.name}`,
            field,
            generated: genCol[field],
            committed: pubCol[field],
          });
        }
      }
    }

    if (!sameDescription(gen.description, pub.description)) {
      result.fieldChanges.push({
        where: id,
        field: "description",
        generated: gen.description,
        committed: pub.description,
      });
    }
  }

  // ---- edges ----
  const edgeKey = (e) => `${e.source}|${e.sourceKey}|${e.target}|${e.targetKey}`;
  const genEdges = new Set(edges.map(edgeKey));
  const pubEdges = new Set(
    fs.existsSync(`${dir}/edges.json`)
      ? JSON.parse(fs.readFileSync(`${dir}/edges.json`, "utf8")).map(edgeKey)
      : []
  );
  for (const k of genEdges) if (!pubEdges.has(k)) result.edgesAdded.push(k);
  for (const k of pubEdges) if (!genEdges.has(k)) result.edgesRemoved.push(k);

  return result;
}

/** Field comparison with the known-artifact allowances applied. */
function sameField(field, generated, committed) {
  if (field === "description") return sameDescription(generated, committed);
  if (field === "columnSubTypes") {
    // GROUP_CONCAT order was arbitrary, so compare as a set.
    const set = (v) => new Set(String(v || "").split("|").filter(Boolean));
    const a = set(generated);
    const b = set(committed);
    return a.size === b.size && [...a].every((x) => b.has(x));
  }
  if (field === "schemaType") {
    // The workbook wrote "" for datatype columns; absent and "" are both falsy
    // to the app, so treat them as equal.
    return (generated || "") === (committed || "");
  }
  return (generated ?? null) === (committed ?? null);
}

/**
 * Descriptions are equal if they match outright, OR if they match once the
 * workbook's comma -> semicolon substitution is applied to the generated side.
 *
 * Both cases are needed. Against the original workbook-derived files every
 * comma had been replaced (162 of cargo_3_2's descriptions), so the allowance is
 * what stops a real diff from drowning in that artifact. Against files this
 * generator has already written, commas are intact and the plain comparison is
 * the correct one -- applying the allowance unconditionally would report every
 * comma-bearing description as changed.
 */
function sameDescription(generated, committed) {
  const gen = String(generated || "");
  const com = String(committed || "");
  return gen === com || gen.replace(/,/g, ";") === com;
}

/** Load the signed-off differences, if any. */
function readAcceptedDiff(ttlPath) {
  const file = ttlPath.replace(/\.ttl$/i, ".accepted-diff.json");
  if (!fs.existsSync(file)) return { file, entries: {} };
  return { file, entries: JSON.parse(fs.readFileSync(file, "utf8")) };
}

module.exports = { diffView, readAcceptedDiff, sameDescription };
