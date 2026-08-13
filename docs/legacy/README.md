# Legacy ontology → CSV pipeline (retired)

These files are kept for reference only. **Nothing here is part of the build.**

Publishing a view used to take six manual steps across three tools:

1. load the TTL into a reasoner-enabled RDF store
2. run `sparql_query.txt`
3. paste ~1,900 result rows into `sparql_to_csvs.xlsx` (38 formula columns)
4. copy the generated CSV text out of the `Formatting` sheet
5. `npm run import <db>`, then hand-place `edges.json`
6. drag boxes, Ctrl+P, paste positions, commit

## What replaced it

```bash
npm run ontology:build
```

`bin/ontology-build` reads `ontologies/*.ttl` directly — no RDF store, no SPARQL,
no spreadsheet, no network. Drop an ontology into `ontologies/` and it becomes a
view. See [docs/ontology-build.md](../ontology-build.md).

## Why the workbook mattered, and why it had to go

It was never just a formatter. It held **design decisions that existed nowhere
else**, none of them diffable or reviewable:

| Sheet | Held | Now stated as |
|---|---|---|
| `View_full!C` | which classes become boxes | `cargo:vis_element` on the class |
| `View_full!In/Out` | which classes show incoming/outgoing lines | `cargo:vis_hidden` on the class |
| `Property_Manual` (1,205 rows) | which concrete subtype each line points at | `cargo:vis_linkTo` on the restriction — **19 assertions** |
| `View_conceptual` | reduced-view membership | `cargo:vis_level` on the class |
| `Colours` | the palette | `src/config/databases/<slug>/schemaColors.json` |
| `To-Do` | "tag new classes", "add link" | validator warnings |

Because none of it was checked, the pipeline shipped broken data unnoticed:
`cargo_core` publishes 19 tables and **120 edges, 82 of which reference nodes
that do not exist**. React Flow drops them silently. The generator now makes that
an `orphan-edge` build error.

The CSV round-trip also corrupted content. Of `cargo_3_2`'s 1,090 column
descriptions, **162 contained `;` and none contained `,`** — the workbook
substituted every comma because `bin/import` parsed CSV with a bare
`split(",")`. Some descriptions were truncated and some non-ASCII characters
became mojibake (`‚Äú` for `"`). Reading the TTL directly fixes all of it.

## `sparql_query.txt`

Kept as a record of intent, not a specification. Two caveats if you read it:

- Its three `FILTER`s sit at UNION level, so
  `FILTER(?parentvalue != cargo:CodeListElement)` evaluates false in the
  "Explicit" branch where `?parentvalue` is unbound — which would eliminate every
  table row. It cannot be the query that produced the shipped data.
- It depends on a reasoner materialising `rdfs:subClassOf` transitively, so that
  `?class rdfs:subClassOf ?restriction` also matches inherited restrictions.
  `bin/lib/infer/hierarchy.js` reproduces exactly that and nothing more.
