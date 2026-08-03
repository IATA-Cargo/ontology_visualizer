# Generating views from an ontology

Drop a ONE-Record ontology into `ontologies/` and it becomes a view. There is no
RDF store, no SPARQL, no spreadsheet and no network access anywhere in the path.

## Layout

One folder per standard release, each self-contained:

```
ontologies/
  2025-07/
    IATA-1R-DM-Ontology.ttl                  # the ontology, annotations included
    IATA-1R-DM-Ontology.views.json           # which database(s) it produces
    IATA-1R-DM-Ontology.accepted-diff.json   # signed-off differences, optional
  2026-08/
    IATA-1R-DM-Ontology.ttl
    IATA-1R-DM-Ontology.views.json
```

Adding the next release is a new folder plus a `views.json` — every release is
discovered, generated and validated. Sidecars always sit beside their TTL so they
travel with the release rather than being shared across releases. A loose
`ontologies/*.ttl` still works for a one-off.

Slugs must be unique across releases; they derive from `owl:versionIRI`
(`…/ns/cargo/3.3` → `cargo_3_3`), so a release that forgets to bump its version
is a hard error rather than a silent overwrite of its predecessor.

```bash
npm run ontology:build          # generate config for every ontologies/*.ttl
npm run ontology:build cargo_3_2 -- --verbose
npm run ontology:check          # re-derive and byte-compare; writes nothing
npm run ontology:diff cargo_3_2 # semantic diff vs what is committed
npm run test:gen                # generator unit tests
```

`prebuild` runs `ontology:check`, so `npm run build` fails if the committed
config no longer matches the ontology. Publishing stays "commit to `main`".

## Authoring

Everything that decides *what the diagram shows* is stated in the ontology
itself, using the `cargo:vis_*` annotation vocabulary the ontology already
declares. Positions and colours are the two exceptions — they are aesthetic, so
they live in files the generator merges but never overwrites.

| Annotation | On | Effect |
|---|---|---|
| `cargo:vis_element` | class | Its group: the box's prefix, its colour key, and its legend row. Required. `Enum` and `CodeList` are groups that are *not* drawn as boxes. |
| `cargo:vis_hidden` | property | Hides that property's lines everywhere. The column stays. |
| `cargo:vis_hidden` | restriction | Hides exactly one class→property→value line. Inherited by subclasses. `false` un-hides against a broader rule. |
| `cargo:vis_hidden` | class | Hides every line in and out. The box is still drawn, isolated. |
| `cargo:vis_inverseProperty` | property | The reciprocal property, becoming the edge's `targetKey`. Multi-valued. |
| `cargo:vis_linkTo` | restriction | The exact classes this line points to, replacing the declared range. Multi-valued. |
| `cargo:vis_level` | class | View membership, against a view's `maxLevel`. |

`owl:deprecated true` is honoured too, and it is **stronger than
`cargo:vis_hidden`**: a hidden property keeps its column and loses only its line,
whereas a deprecated property is leaving the standard and is dropped entirely —
no column, no line. A deprecated class is not drawn at all.

Deprecation is applied per view via `hideDeprecated` in `views.json`, default
`true`. `cargo_3_2` sets it to `false` because that view reproduces the published
3.2.0 edge set exactly and that set predates the deprecations.

### Hiding a line

Three placements, in decreasing generality. Precedence is most-specific-first:
**restriction → class → property → show**.

```turtle
# 1. everywhere this property appears (cheapest: `checks` is declared once on
#    LogisticsObject, so this suppresses ~60 inherited lines)
:checks :vis_hidden true .

# 2. one specific line; subclasses inherit the hide
:Piece rdfs:subClassOf [ rdf:type owl:Restriction ;
                         owl:onProperty :involvedParties ;
                         owl:allValuesFrom :Party ;
                         :vis_hidden true ] .

# 3. every line touching this class
:Location :vis_hidden true .

# 2b. the escape hatch -- show `checks` on Piece even though rule 1 hid it
:Piece rdfs:subClassOf [ rdf:type owl:Restriction ;
                         owl:onProperty :checks ;
                         owl:allValuesFrom :Check ;
                         :vis_hidden false ] .
```

`--verbose` prints every suppression with the rule that caused it:

```
info  suppressed Core.Piece --involvedParties--> Embedded.Party  [hide: restriction on Piece]
```

A typo is a hard error rather than a silent 200 extra lines:
`:vis_hidden "yes"` fails with *expected an xsd:boolean*.

### Views

`ontologies/<name>.views.json` names the databases this ontology produces. It
holds presentation choices only; the data decisions stay in the TTL. Without it,
one full view is derived with a slug from `owl:versionIRI`
(`…/ns/cargo/3.2` → `cargo_3_2`).

```jsonc
{ "views": [
  { "slug": "cargo_3_3",
    "name": "ONE Record Full Datamodel 3.3.0",
    "description": "Visualization of the full ONE Record Data Model 3.3.0",
    "maxLevel": null,                         // null = no vis_level filtering
    "hideDeprecated": true },                 // the default; false keeps owl:deprecated content
  { "slug": "cargo_conceptual_3_3",
    "name": "ONE Record Conceptual Datamodel",
    "maxLevel": 0 }                           // only classes with vis_level 0
] }
```

### Adding the next release

1. Create `ontologies/<release>/` and drop the TTL in.
2. Add a `views.json` next to it with a slug (or let it derive one from
   `owl:versionIRI`).
3. `npm run ontology:build` — new boxes are auto-placed below the existing layout
   and reported by name.
4. To start from the previous release's layout instead of a bare grid, copy its
   `tablePositions.json` and let the generator place only the genuinely new
   boxes. `cargo_3_3` was seeded from `cargo_3_2` this way: 96 of 97 positions
   carried over, leaving one new class to arrange.
5. Arrange anything new, press **Ctrl+Shift+P**, `npm run positions <slug>`.
6. Commit. CI validates every release folder.

## Positions and colours are never clobbered

`src/config/databases/<slug>/tablePositions.json` — a hand-tuned 97-box layout is
real work, so:

- **kept** coordinates are copied through untouched; a content-only regeneration
  produces a zero-line diff in this file
- **new** boxes are auto-placed in a fresh band *below* everything already
  placed, snapped to the canvas's 16 px grid, and reported
- **stale** entries (a renamed or filtered-out class) are *retained* and
  reported, never silently dropped. `--prune-positions` removes them.

To save a new layout: arrange the boxes, press **Ctrl+Shift+P** (copies JSON to
the clipboard), then

```bash
npm run positions cargo_3_2
```

and paste. Every id is checked against the generated boxes first, so a paste
aimed at the wrong database is refused rather than written.

`schemaColors.json` — an existing colour is never modified. A group with no
colour gets the deliberately hideous `#FF00FF` plus a warning naming the file to
edit. The `InfoPopup` legend reads this same palette (via
`src/config/legend.json`), so the two cannot drift.

## Validation

`orphan-edge`, `duplicate-node-id`, `missing-vis-element`, `unknown-palette-key`
and an unknown-`owl:Restriction`-predicate check are **errors**. Missing/stale
positions, ambiguous inverses and isolated boxes are warnings.
`--strict` promotes warnings; `--json` emits machine-readable output for CI.

Failing loudly on an unmodelled OWL construct is deliberate: silently dropping
data is how the previous pipeline shipped `cargo_core` with 82 dangling edges.

## How it works

```
ontologies/*.ttl
  ① parse    n3 → RDF/JS Store; owl:imports is not followed
  ② infer    transitive subClassOf · effective restrictions · inverse resolution
  ③ select   vis_element / vis_level / vis_hidden → boxes and lines
  ④ emit     TableConfig[] / EdgeConfig[] / tables.ts; merge positions & palette
src/config/databases/<slug>/**
```

Three things worth knowing before changing `bin/lib/`:

- **The only inference is restriction inheritance.** The old pipeline needed a
  reasoner solely because its SPARQL relied on the store materialising
  `rdfs:subClassOf` transitively. `infer/hierarchy.js` reproduces that with an
  ancestor walk — that is the whole reasoner. It is why `DG.PieceDg` shows 42
  columns while declaring only 9 of its own.
- **Columns use inherited restrictions; lines use own restrictions only.** That
  asymmetry is load-bearing: without it, `checks` and `externalReferences` would
  draw a line from all ~60 descendants of `LogisticsObject`.
- **`cargo:vis_inverseProperty` is multi-valued** (`:servedActivity` has 4
  values). The right inverse depends on the (source, property, target) triple, so
  anything mapping property → single inverse is wrong. See
  `infer/resolveInverse.js`.
- **There are no heuristics.** Which classes a line points to is stated by
  `cargo:vis_linkTo` or defaults to the declared range — nothing is guessed from
  the class hierarchy. Earlier revisions inferred it, and inference was both
  wrong in detail and impossible to correct from the ontology.

The generator lives entirely in `bin/` and is never imported from `src/`, so
`n3` provably cannot reach the browser bundle. It is a `devDependency`.

### Choosing what a line points to

By default a line goes to the property's declared `owl:allValuesFrom` range. That
is right for 94 of the 113 (class, property) pairs that produce edges.

The rest need `cargo:vis_linkTo`, because the range is abstract or because only
some concrete subtypes should be linked — `involvedInActions` has range
`LogisticsAction`, but the diagram wants `Composing` and `Loading` specifically:

```turtle
:Piece rdfs:subClassOf [ rdf:type owl:Restriction ;
                         owl:onProperty :involvedInActions ;
                         owl:allValuesFrom :LogisticsAction ;
                         :vis_linkTo :Composing , :Loading ] .
```

This is the one thing the old workbook held that the ontology could not express,
and it is why `Property_Manual` had 1,205 rows for a human to tick. As an
annotation it takes 19 assertions and lives with the model it describes.

**To annotate a property a class only inherits, restate the restriction verbatim
on the subclass** (as above — `Piece` inherits `involvedInActions` from
`PhysicalLogisticsObject`). Restating is column-neutral: members key on
`(property, allValuesFrom)` and prefer the class's own copy, so nothing is
duplicated. Cardinality still resolves up the hierarchy
(`infer/effectiveRestrictions.js → resolveCardinality`), so a restated
restriction keeps its inherited `hasOne`.

Do **not** express this with a narrowing `owl:allValuesFrom`: a *different* range
for the same property is a second member, i.e. a duplicate column. The ontology
does that in two places already (`IotDevice.manufacturer`,
`DgDeclaration.issuedForPiece`), which is why both ship with duplicate columns.

A `vis_linkTo` naming a class that does not exist is a `dangling-link-to`
**error**, so a typo or a rename fails the build instead of quietly dropping a
line.
