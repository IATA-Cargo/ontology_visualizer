"use strict";

const fs = require("fs");
const { EOL } = require("../util/stableStringify");

const TEMPLATE_PATH = "src/config/tables.ts.template";

/**
 * Generate the tables.ts barrel that default-exports every TableConfig.
 *
 * The app reaches its data through `import(".../tables")`, so this file is what
 * actually pulls the JSON into the bundle. Reuses the existing template and the
 * camelize identifier scheme from bin/import so the output stays recognisable.
 */
function buildTablesBarrel(boxes, { templatePath = TEMPLATE_PATH } = {}) {
  const imports = [];
  const names = [];

  for (const box of boxes) {
    const identifier = `${camelize(box.nodeId)}Table`;
    imports.push(`import ${identifier} from "./tables/${box.nodeId}.json";`);
    names.push(`  ${identifier}`);
  }

  const template = fs.readFileSync(templatePath, "utf8");
  return (
    template
      .replace("%TABLE_FILES%", imports.join(EOL))
      .replace("%TABLE_NAMES%", names.join("," + EOL))
      .replace(/\r\n/g, EOL)
  );
}

// Same transformation bin/import used, so identifiers match the previous output.
// https://ourcodeworld.com/articles/read/608/how-to-camelize-and-decamelize-strings-in-javascript
function camelize(text) {
  return text
    .replace(/\W/, "-")
    .replace(/^([A-Z])|[\s-_]+(\w)/g, (match, p1, p2) =>
      p2 ? p2.toUpperCase() : p1.toLowerCase()
    );
}

module.exports = { buildTablesBarrel, camelize };
