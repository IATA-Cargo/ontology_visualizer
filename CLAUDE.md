# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A React app that renders the IATA ONE Record data model as an interactive diagram
(reactflow). Boxes are OWL classes, rows inside them are properties, lines are
object relationships. It began as a fork of sqlhabit's `sql_schema_visualizer`,
which is why the internal vocabulary is SQL-flavoured — "tables" are classes and
"columns" are properties throughout `src/`.

## Commands

```bash
npm start                      # CRA dev server on :3000 (basename "/" in dev)
npm run build                  # prebuild gate -> CRA build -> per-database HTML pages
npm test                       # CRA/jest tests (see caveat below)

npm run ontology:build         # regenerate src/config from ontologies/**/*.ttl
npm run ontology:check         # re-derive and byte-compare; writes nothing
npm run ontology:diff <slug>   # semantic diff vs committed (ignores ordering/formatting)
npm run test:gen               # generator unit tests (node:test, no jest)
npm run positions <slug>       # write a layout captured from the app (JSON on stdin)
```

Run a single generator test by name:

```bash
node --test --test-name-pattern="vis_linkTo" bin/lib/__tests__
```

`prebuild` runs `ontology:check`, which reports — as a **warning** — any committed
file in `src/config/` that no longer matches the ontologies. It does not fail the
build: hand-editing generated output before a deployment is intended behaviour.
Use `ontology:check:strict` when you do want a hard gate (it promotes every
warning, staleness included, to an error). Use `--verbose` on `ontology-build` to
list every suppressed line, hidden deprecation and file written.

Caveat: `src/Visualizer/Visualizer.test.tsx` renders `database={"bindle"}`, a
dataset that has not existed for several versions, so `npm test` cannot pass as
written. The generator's own suite (`npm run test:gen`) is the meaningful one.

## Architecture

### The ontology is the source of truth

`src/config/databases/<slug>/**` is **generated**, not hand-edited. The single
input is `ontologies/<release>/*.ttl`; there is no RDF store, no SPARQL, no
spreadsheet and no network access anywhere in the pipeline.

```
ontologies/2026-08/IATA-1R-DM-Ontology.ttl
  (1) parse    n3 -> RDF/JS Store; owl:imports deliberately NOT followed
  (2) infer    transitive subClassOf, effective restrictions, inverse resolution
  (3) select   vis_element / vis_level / vis_hidden / vis_linkTo -> boxes + lines
  (4) emit     TableConfig[] / EdgeConfig[] / tables.ts, MERGE positions + palette
src/config/databases/<slug>/**
```

Generated output is **committed**, and `prebuild` runs `ontology:check` to
byte-compare it against a fresh derivation, warning about anything that diverged.
The warning is deliberately not fatal — a manual edit shortly before a deployment
is a supported workflow — so treat a divergence as a prompt to decide, not an
error. The normal fix is still to change the ontology or the generator and
regenerate rather than to hand-patch a generated file, because the next
`ontology:build` overwrites it.

The generator lives entirely in `bin/` and is never imported from `src/`, so
CRA's webpack (which only walks `src/`) provably cannot pull `n3` into the
browser bundle. `n3` is a devDependency.

### Three things that are easy to get wrong

1. **Columns use inherited restrictions; lines use own restrictions only.** This
   asymmetry is load-bearing. Without it, `checks` / `externalReferences` /
   `attachedIotDevices` — each declared once on `LogisticsObject` — would draw a
   line from all ~60 of its descendants.
2. **`cargo:vis_inverseProperty` is multi-valued.** `:servedActivity` has four
   values; the correct one depends on the `(source, property, target)` triple.
   Anything mapping property to a single inverse is wrong. See
   `bin/lib/infer/resolveInverse.js`.
3. **Restriction inheritance is the only inference.** The old pipeline needed a
   reasoner solely because its SPARQL relied on the store materialising
   `rdfs:subClassOf` transitively. `bin/lib/infer/hierarchy.js` is an ancestor
   walk — that is the whole reasoner. It is why `DG.PieceDg` shows 42 columns
   while declaring only 9 of its own.

### Annotation vocabulary

Every decision about *what the diagram shows* is stated in the ontology using the
`cargo:vis_*` terms it declares. Nothing is guessed from the class hierarchy.

| Term | Asserted on | Effect |
|---|---|---|
| `cargo:vis_element` | class | Its group: box prefix, colour key, legend row. Required. `Enum` and `CodeList` are groups that are **not** drawn as boxes (they remain column types and edge targets). |
| `cargo:vis_hidden` | property | Hides that property's lines everywhere. The column stays. |
| `cargo:vis_hidden` | restriction | Hides exactly one class->property->value line; inherited by subclasses. `false` un-hides against a broader rule. |
| `cargo:vis_hidden` | class | Hides every line in and out. The box is still drawn, isolated. |
| `cargo:vis_inverseProperty` | property | The reciprocal property, becoming an edge's `targetKey`. |
| `cargo:vis_linkTo` | restriction | The exact classes a line points to, replacing the declared range. |
| `cargo:vis_level` | class | View membership against a view's `maxLevel`. |

Hide precedence, most specific first: **restriction -> class -> property -> show**.
A malformed boolean (`:vis_hidden "yes"`) is a hard error, not a silent
200-extra-lines surprise.

`owl:deprecated true` is honoured and is **stronger than `vis_hidden`**: a hidden
property keeps its column and loses only its line, whereas a deprecated property
is dropped entirely (no column, no line) and a deprecated class is not drawn.
Applied per view via `hideDeprecated` in `views.json`, default `true`.

`cargo:vis_linkTo` exists because the choice is editorial and not derivable:
`involvedInActions` has range `LogisticsAction`, but the diagram wants
`Piece -> Composing` and `Piece -> Loading` specifically. **To annotate a property
a class only inherits, restate the restriction verbatim on the subclass and
annotate that copy.** This is column-neutral because members key on
`(property, allValuesFrom)` and prefer the class's own copy. Do *not* use a
narrowing `owl:allValuesFrom` — a different range for the same property creates a
duplicate column.

### Releases and views

```
ontologies/<release>/
  IATA-1R-DM-Ontology.ttl                  # the ontology, annotations included
  IATA-1R-DM-Ontology.views.json           # which database(s) it produces
  IATA-1R-DM-Ontology.accepted-diff.json   # signed-off differences, optional
```

Sidecars sit beside their TTL so they travel with the release. Release folders are
discovered newest-first, and that order becomes the database-menu order — the
**first key of `src/config/databases.json` is the view the app serves at `/`**.

Slugs derive from `owl:versionIRI` (`.../ns/cargo/3.3` -> `cargo_3_3`) and must be
unique across releases; a collision is a hard error rather than a silent
overwrite.

`cargo_3_2` and `cargo_3_3` are generated. `cargo_core`, `cargo_full` and
`cargo_full_3_1` are **frozen**: their 3.0.1/3.1 TTLs are not in the repo, so the
generator never sees them and they coexist untouched. Do not try to regenerate
them. (`cargo_core` ships 120 edges for 19 boxes, 82 of them dangling — a
pre-existing defect that reactflow hides. The `orphan-edge` rule makes that class
of bug an error for generated databases.)

`cargo_3_2` sets `hideDeprecated: false` because that view reproduces the
published 3.2.0 edge set exactly, and that set predates the ontology's
deprecations. Its numbers (97 boxes, 120 lines, 97 positions) are a regression
fixture — if a change moves them, something is wrong.

### Positions and colours are merged, never clobbered

`src/config/databases/<slug>/tablePositions.json` holds hand-tuned coordinates and
represents real human effort:

- **kept** coordinates pass through untouched; a content-only regeneration must
  produce a zero-line diff in this file
- **new** boxes are auto-placed in a band *below* everything already placed,
  snapped to the canvas's 16px grid, and reported by name
- **stale** entries (renamed or filtered-out class) are *retained* and reported,
  never silently dropped; `--prune-positions` removes them deliberately

To save a layout: arrange boxes, press **Ctrl+Shift+P** (copies JSON to
clipboard), then `npm run positions <slug>` and paste. Ids are validated against
the generated boxes first, so a paste aimed at the wrong database is refused.

`schemaColors.json` works the same way: an existing colour is never modified; a
group with no colour gets a deliberately hideous `#FF00FF` plus a warning. The
`InfoPopup` legend reads this same palette via `src/config/legend.json`, so the
two cannot drift.

### Validation

`bin/lib/validate/rules.js`. **Errors**: `orphan-edge`, `duplicate-node-id`,
`missing-vis-element`, `unknown-palette-key`, `dangling-link-to`, an unknown
predicate on an `owl:Restriction`, and `empty-view`. **Warnings**: missing/stale
positions, ambiguous inverses, isolated boxes. `--strict` promotes warnings;
`--json` emits machine-readable output for CI.

Failing loudly on an unmodelled OWL construct is deliberate — silently dropping
data is how the previous pipeline shipped a broken database unnoticed.

## App-side gotchas

- **`columnSubTypes`, not `subTypes`.** `TableNode.tsx` reads
  `column.columnSubTypes` while `TableColumnConfig` declares `subTypes`; it only
  compiles because the map callback is untyped `(column: any)`. The emitter writes
  the key the component actually reads. If you rename the interface field, change
  the emitter in the same commit or every box loses its subtype chips.
- **Navigation uses plain `<a>` tags, not router `<Link>`s** — see
  `design_notes/0001_using_regular_links.md`. That is why `bin/create_db_pages`
  clones `build/index.html` to `build/databases/<slug>.html` for every database.
- **Config is bundled, not fetched.** `loadDatabaseConfig.ts` dynamic-imports
  literal paths under `src/config/databases/<slug>/`, so those paths are part of
  the contract — moving them means webpack aliases and `src/` churn. Adding a
  database requires a dev-server restart for webpack to see the new directory.
- **Edges do not render in a headless/zero-size viewport.** `onInit` computes
  which side of a box an edge leaves from measured node widths, which are `null`
  before layout. This reproduces on databases nobody has touched, so it is not a
  regression — verify edges from the generated `edges.json`, not the DOM.
- A column only gets connection handles if some edge references it
  (`initializeNodes.ts`), so a suppressed line correctly removes its handle too.

## Environment

The working copy lives in a OneDrive-synced folder on Windows. Two consequences:

- **Never run `npm ci` here.** It deletes `node_modules` first and reliably hits
  `EPERM` on sync-locked files partway through, leaving a broken tree that then
  needs a full `rm -rf node_modules && npm install`. Use `npm install`. Installs
  are slow (~8 min) and the registry connection is flaky, so prefer
  `--fetch-retries=8` and run them in the background.
- `bin/clean-tilde-dirs.js` runs on `postinstall` to delete a literal `~`
  directory that `postcss-initial` accidentally publishes; OneDrive cannot sync
  that name.

CI (`.github/workflows/deploy.yml`) uses `npm ci --include=dev` — explicit
because the job sets `NODE_ENV=production` and the generator's only dependency is
a devDependency. It runs `test:gen` and `ontology:check` as named steps before
the build so a divergence between the ontologies and the committed config is
visible in the log without blocking the deploy.
