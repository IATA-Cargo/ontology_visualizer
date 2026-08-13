"use strict";

// Plain node:test -- the generator is CommonJS with no React, so keeping these
// out of the CRA jest transform entirely (npm run test:gen).

const test = require("node:test");
const assert = require("node:assert");
const path = require("path");

const ROOT = path.resolve(__dirname, "../../..");
process.chdir(ROOT);

const { parseOntology } = require("../parse");
const { resolveOntology, linkTargets } = require("../infer");
const { selectBoxes } = require("../select/boxes");
const { selectLines } = require("../select/lines");
const { decideLine } = require("../select/hide");
const { buildTableConfig } = require("../emit/tableConfig");
const { mergePositions } = require("../emit/positions");
const { mergePalette, SENTINEL } = require("../emit/palette");
const { booleanValue, joinComments } = require("../parse/literal");
const { localName } = require("../infer/localName");
const { compareBoxes } = require("../util/sortOrder");

// Pinned to one release on purpose: the assertions below are its published
// figures (97 boxes, Piece 35 columns, ...). A newer release is expected to
// differ, so it gets its own expectations rather than loosening these.
const RELEASE = "2025-07";
const TTL = `ontologies/${RELEASE}/IATA-1R-DM-Ontology.ttl`;
const silent = { info: () => {}, warn: () => {}, error: () => {} };

if (!require("fs").existsSync(TTL)) {
  throw new Error(
    `${TTL} not found -- if the ontologies/ layout changed, update RELEASE in this test`
  );
}

// Parsing the 8k-triple ontology takes ~1s, so do it once for all tests.
const ontology = parseOntology(TTL, { log: silent });
const resolved = resolveOntology(ontology);

// The cargo_3_2 view as its sidecar declares it. hideDeprecated is false there
// because that view reproduces the published 3.2.0 edge set, which predates the
// ontology's deprecations -- turning it on drops the VolumetricWeight box.
const VIEW = { slug: "cargo_3_2", maxLevel: null, defaultLevel: 0, hideDeprecated: false };
const byName = new Map([...ontology.classes.values()].map((c) => [c.localName, c]));
const memberNames = (name) => resolved.members.get(byName.get(name).iri).map((m) => m.name);

test("parses the expected shape of the ONE-Record ontology", () => {
  assert.strictEqual(ontology.classes.size, 160, "classes (incl. the untyped code list)");
  assert.strictEqual(ontology.derivedSlug, "cargo_3_2", "slug from owl:versionIRI");
  assert.strictEqual(
    [...ontology.properties.values()].filter((p) => p.visInverse.length).length,
    92
  );
});

test("restriction inheritance reproduces the published column counts", () => {
  // The reasoner dependency in one assertion: PieceDg declares 9 restrictions of
  // its own but must show all 35 of Piece's as well.
  assert.strictEqual(memberNames("Piece").length, 35);
  assert.strictEqual(memberNames("PieceDg").length, 42);
  assert.strictEqual(memberNames("PieceLiveAnimals").length, 51);
  assert.strictEqual(memberNames("Waybill").length, 36);
  assert.strictEqual(memberNames("Item").length, 20);
});

test("a restriction restated to carry vis_linkTo is column-neutral", () => {
  // Several classes restate an inherited restriction verbatim so they have a
  // local node to hang cargo:vis_linkTo on. Because members key on
  // (property, allValuesFrom), that must merge rather than add a column.
  // Every class that restates one: no class may end up with the same column twice.
  for (const name of ["Piece", "PieceDg", "PieceLiveAnimals", "ItemDg", "ULD", "Booking",
                      "Composing", "Loading", "Storing", "ProductDg"]) {
    const names = memberNames(name);
    const duplicated = names.filter((n, i) => names.indexOf(n) !== i);
    assert.deepStrictEqual(duplicated, [], `${name} must not duplicate a column`);
  }
  // Spot-check against the published counts, which restatement must not move.
  assert.strictEqual(memberNames("Piece").length, 35);
  assert.strictEqual(memberNames("PieceDg").length, 42);

  // ...and it must keep the inherited cardinality, or `array` flips and the edge
  // marker changes from hasOne to hasMany.
  const restated = resolved.members
    .get(byName.get("Piece").iri)
    .find((m) => m.name === "involvedInActions");
  assert.ok(restated, "Piece.involvedInActions is present");
  assert.strictEqual(restated.maxCardinality, null, "involvedInActions is unbounded");
});

test("vis_linkTo selects the exact link targets", () => {
  const involved = resolved.candidates.filter(
    (c) =>
      localName(c.sourceIri) === "Piece" && localName(c.propertyIri) === "involvedInActions"
  );
  assert.deepStrictEqual(
    involved.map((c) => localName(c.targetIri)).sort(),
    ["Composing", "Loading"],
    "declared range is LogisticsAction; vis_linkTo narrows it to these two"
  );
});

test("a vis_linkTo naming an unknown class is reported, not silently dropped", () => {
  const danglingLinkTo = [];
  const klass = { localName: "Fake" };
  const classes = new Map([["urn:real", {}]]);

  const targets = linkTargets(
    { onProperty: "urn:prop", allValuesFrom: "urn:range", linkTo: ["urn:real", "urn:typo"] },
    { classes, danglingLinkTo, klass }
  );

  assert.deepStrictEqual(targets, ["urn:real"]);
  assert.strictEqual(danglingLinkTo.length, 1);
  assert.strictEqual(danglingLinkTo[0].target, "urn:typo");

  // No vis_linkTo at all -> the declared range, unchanged.
  assert.deepStrictEqual(
    linkTargets(
      { onProperty: "urn:prop", allValuesFrom: "urn:range", linkTo: [] },
      { classes, danglingLinkTo: [], klass }
    ),
    ["urn:range"]
  );
});

test("subClassOf closure is cycle-free and transitive", () => {
  assert.deepStrictEqual(resolved.diagnostics.cycles, []);
  const pieceDg = resolved.ancestors.get(byName.get("PieceDg").iri);
  assert.ok(pieceDg.has(byName.get("Piece").iri), "direct parent");
  assert.ok(pieceDg.has(byName.get("LogisticsObject").iri), "transitive ancestor");
});

test("resolveInverse picks the inverse the target declares back", () => {
  // servedActivity carries 4 vis_inverseProperty values; the right one depends on
  // the (source, property, target) triple, so a property->single-inverse map is wrong.
  const find = (src, prop, tgt) =>
    resolved.candidates.find(
      (c) =>
        localName(c.sourceIri) === src &&
        localName(c.propertyIri) === prop &&
        localName(c.targetIri) === tgt
    );

  assert.deepStrictEqual(find("Composing", "servedActivity", "UnitComposition").inverseIris.map(localName), [
    "compositionActions",
  ]);
  assert.deepStrictEqual(find("Loading", "servedActivity", "TransportMovement").inverseIris.map(localName), [
    "loadingActions",
  ]);
});

test("selects exactly the published box set with every class grouped", () => {
  const { boxes, untagged } = selectBoxes(resolved, VIEW);
  assert.deepStrictEqual(untagged, [], "every class must carry cargo:vis_element");
  assert.strictEqual(boxes.length, 97);
  // Enum and CodeList groups are types and edge targets, never boxes.
  assert.ok(!boxes.some((b) => b.schema === "Enum" || b.schema === "CodeList"));
});

test("owl:deprecated is hidden per view, and is stronger than vis_hidden", () => {
  const deprecatedProps = [...ontology.properties.values()].filter((p) => p.deprecated);
  const deprecatedClasses = [...ontology.classes.values()].filter((c) => c.deprecated);
  assert.ok(deprecatedProps.length, "this release marks some properties owl:deprecated");
  assert.ok(deprecatedClasses.length, "...and at least one class");

  const off = selectBoxes(resolved, { ...VIEW, hideDeprecated: false });
  const on = selectBoxes(resolved, { ...VIEW, hideDeprecated: true });

  // A deprecated class loses its box entirely -- unlike cargo:vis_hidden, which
  // keeps the box and only drops its lines.
  assert.ok(on.boxes.length < off.boxes.length, "hiding deprecated removes at least one box");
  assert.deepStrictEqual(on.droppedDeprecated.classes, ["VolumetricWeight"]);

  // ...and a deprecated property loses its column.
  assert.ok(on.droppedDeprecated.columns > 0, "and at least one column");
  const names = (result, box) =>
    result.boxes.find((b) => b.nodeId === box).members.map((m) => m.name);
  assert.ok(
    names(off, "Embedded.Address").includes("postalCode"),
    "postalCode is present when deprecated content is kept"
  );
  assert.ok(
    !names(on, "Embedded.Address").includes("postalCode"),
    "...and gone when it is hidden"
  );

  // No line may survive for a column that no longer exists.
  const lines = selectLines(resolved, on.boxes, { view: { ...VIEW, hideDeprecated: true } }).lines;
  const deprecatedNames = new Set(deprecatedProps.map((p) => p.localName));
  assert.deepStrictEqual(
    lines.filter((l) => deprecatedNames.has(l.sourceKey)),
    []
  );
});

test("no generated edge references a non-existent box", () => {
  const { boxes } = selectBoxes(resolved, VIEW);
  const { lines } = selectLines(resolved, boxes, { view: VIEW });
  const ids = new Set(boxes.map((b) => b.nodeId));
  const orphans = lines.filter((l) => !ids.has(l.source) || !ids.has(l.target));
  // This is the cargo_core defect: 120 edges for 19 boxes, 82 of them dangling.
  assert.deepStrictEqual(orphans, []);
});

test("vis_hidden precedence: restriction beats class beats property", () => {
  const classes = new Map([
    ["S", { localName: "S", visHidden: false }],
    ["T", { localName: "T", visHidden: false }],
  ]);
  const line = (visHidden, sourceHidden, propHidden) => ({
    sourceIri: "S",
    targetIri: "T",
    propertyIri: "p",
    property: { localName: "p", visHidden: propHidden },
    restriction: { visHidden, declaredOn: "S" },
  });

  const withSource = (hidden) =>
    new Map([
      ["S", { localName: "S", visHidden: hidden }],
      ["T", { localName: "T", visHidden: false }],
    ]);

  assert.strictEqual(decideLine(line(null, false, false), { classes }).hidden, false, "default shows");
  assert.strictEqual(decideLine(line(null, false, true), { classes }).hidden, true, "property hide");
  assert.strictEqual(
    decideLine(line(null, true, false), { classes: withSource(true) }).hidden,
    true,
    "class hide"
  );
  assert.strictEqual(decideLine(line(true, false, false), { classes }).hidden, true, "restriction hide");
  // The un-hide: a restriction saying false overrides a broader class/property hide.
  assert.strictEqual(
    decideLine(line(false, true, true), { classes: withSource(true) }).hidden,
    false,
    "restriction false un-hides"
  );
});

test("emits columnSubTypes, the key TableNode actually reads", () => {
  const { boxes } = selectBoxes(resolved, VIEW);
  boxes.sort(compareBoxes);
  const piece = buildTableConfig(boxes.find((b) => b.nodeId === "Core.Piece"));
  const inPiece = piece.columns.find((c) => c.name === "inPiece");

  // TableNode.tsx reads column.columnSubTypes while TableColumnConfig declares
  // subTypes; emitting the former keeps the subtype chips rendering.
  assert.ok("columnSubTypes" in inPiece, "must emit columnSubTypes, not subTypes");
  const subtypes = inPiece.columnSubTypes.split("|");
  assert.ok(subtypes.includes("PieceDg"));
  assert.ok(subtypes.includes("PieceLiveAnimals"));
  assert.strictEqual(inPiece.classIRI, "https://onerecord.iata.org/ns/cargo#Piece", "the box's class");
});

test("positions merge keeps hand-tuned coordinates byte-identical", () => {
  const existing = { "A.One": { x: 112, y: -336 }, "A.Gone": { x: 9, y: 9 } };
  const boxes = [{ nodeId: "A.One" }, { nodeId: "A.Two" }];
  const merged = mergePositions({ existing, boxes });

  assert.deepStrictEqual(merged.positions["A.One"], { x: 112, y: -336 }, "untouched");
  assert.deepStrictEqual(merged.keptIds, ["A.One"]);
  assert.deepStrictEqual(merged.addedIds, ["A.Two"]);
  // Stale entries are retained, not dropped -- a renamed class must not lose its layout.
  assert.deepStrictEqual(merged.staleIds, ["A.Gone"]);
  assert.ok("A.Gone" in merged.positions);

  const added = merged.positions["A.Two"];
  assert.ok(added.y > -336, "new boxes land below the occupied area");
  assert.strictEqual(added.x % 16, 0, "snapped to the 16px canvas grid");
  assert.strictEqual(added.y % 16, 0);

  const pruned = mergePositions({ existing, boxes, prune: true });
  assert.ok(!("A.Gone" in pruned.positions), "--prune-positions drops them");
});

test("palette merge never overwrites a hand-picked colour", () => {
  const { palette, added } = mergePalette({
    existing: { DEFAULT: "#BCCEF5", Core: "#123456" },
    schemas: new Set(["Core", "Reporting"]),
  });

  assert.strictEqual(palette.Core, "#123456", "existing key untouched");
  assert.strictEqual(palette.Reporting, SENTINEL, "unknown group gets the loud placeholder");
  assert.ok(added.some((a) => a.key === "Reporting"));
  assert.ok(palette.DEFAULT, "DEFAULT always present");
  assert.strictEqual(Object.keys(palette)[0], "DEFAULT", "DEFAULT ordered first");
});

test("literals: @en collapses, booleans are strict, comments join", () => {
  assert.strictEqual(booleanValue({ value: "true" }, "x"), true);
  assert.strictEqual(booleanValue({ value: "1" }, "x"), true);
  assert.strictEqual(booleanValue({ value: "false" }, "x"), false);
  assert.strictEqual(booleanValue(undefined, "x"), null);
  // A typo'd vis_hidden must fail loudly, not silently leave 200 lines visible.
  assert.throws(() => booleanValue({ value: "yes" }, "ctx"), /expected an xsd:boolean/);

  assert.strictEqual(joinComments([{ value: "a" }, { value: "b" }]), "a - b");
  assert.strictEqual(joinComments([{ value: "dup" }, { value: "dup" }]), "dup", "deduped");
});
