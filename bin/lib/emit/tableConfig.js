"use strict";

const { orderedObject } = require("../util/stableStringify");
const { compareColumns } = require("../util/sortOrder");
const V = require("../parse/vocab");

// Key order matches the files the old pipeline committed, so a regeneration
// produces a readable diff rather than a whole-file rewrite.
const TABLE_KEYS = ["schema", "name", "description", "columns"];
const COLUMN_KEYS = [
  "name",
  "description",
  "type",
  "schemaType",
  "array",
  "codelist",
  "columnSubTypes",
  "classIRI",
  "propertyIRI",
  "valueIRI",
];

/**
 * Box -> the TableConfig JSON the app loads.
 *
 * Two field-level notes:
 *
 * - `columnSubTypes`, NOT `subTypes`. TableNode.tsx reads `column.columnSubTypes`
 *   while TableColumnConfig declares `subTypes`; it only compiles because the map
 *   callback is untyped `(column: any)`. Emitting the key the component actually
 *   reads keeps the subtype chips working. If you rename the interface field, do
 *   it in the same commit as this emitter.
 *
 * - Descriptions keep their commas. The workbook substituted `,` -> `;` because
 *   bin/import parsed CSV with a bare split(","), which mangled 162 of
 *   cargo_3_2's 1090 column descriptions. Dropping CSV fixes that, which is why
 *   the golden diff can never be byte-clean.
 */
function buildTableConfig(box) {
  const columns = box.members
    .map((member) => describeColumn(member, box))
    .sort(compareColumns)
    .map((column) => orderedObject(column, COLUMN_KEYS));

  return orderedObject(
    {
      schema: box.schema,
      name: box.className,
      description: box.description || "",
      columns,
    },
    TABLE_KEYS
  );
}

function describeColumn(member, box) {
  const schemaType = member.isDatatype ? "" : member.valueVisElement || "";

  return {
    name: member.name,
    description: member.description || "",
    type: member.typeName,
    schemaType,
    // The Excel's is_array: cardinality 1 -> false, anything else -> true.
    array: member.maxCardinality !== 1,
    // The Excel's is_codelist: the VALUE's group is a code-list vocabulary.
    codelist: V.NON_BOX_ELEMENTS.has(schemaType),
    columnSubTypes: member.valueSubclassLocalNames.join("|"),
    // The class this column is shown ON, not the ancestor whose restriction
    // introduced it -- matching the old CSV's class_IRI, which was the queried
    // ?class. TableNode uses it to link the column's owning class.
    classIRI: box.classIri,
    propertyIRI: member.propertyIri,
    valueIRI: member.valueIri,
    // Sort keys, stripped by orderedObject.
    isDatatype: member.isDatatype,
    inherited: member.inherited,
  };
}

module.exports = { buildTableConfig, TABLE_KEYS, COLUMN_KEYS };
