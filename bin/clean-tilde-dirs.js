#!/usr/bin/env node
"use strict";

// Some npm packages accidentally publish a literal `~` directory -- it's npm's
// own update-notifier cache (~/.config/configstore/...), picked up because
// whoever ran `npm publish` had a stray HOME env var pointing at the package
// folder. postcss-initial (pulled in via react-scripts -> postcss-preset-env)
// does this. It is dead weight, not code anything reads, but OneDrive's sync
// client chokes on the `~` name, so it is removed after every install.
//
// Runs as a postinstall hook. Scoped to node_modules only, and to a bare `~`
// name only, so it can never touch a project file.

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "node_modules");

function findTildeDirs(dir, found = [], depth = 0) {
  if (depth > 4 || !fs.existsSync(dir)) return found; // node_modules is deep; cap the walk

  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return found; // permission-denied or race with another install step; not fatal
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const full = path.join(dir, entry.name);
    if (entry.name === "~") {
      found.push(full);
      continue; // don't descend into what we're about to delete
    }
    findTildeDirs(full, found, depth + 1);
  }
  return found;
}

const dirs = findTildeDirs(ROOT);
for (const dir of dirs) {
  fs.rmSync(dir, { recursive: true, force: true });
  console.log(`removed stray "~" directory: ${path.relative(process.cwd(), dir)}`);
}
