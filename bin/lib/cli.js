"use strict";

const USAGE = `
ontology-build -- generate visualizer config from ontologies/*.ttl

  node bin/ontology-build [slug...] [options]

  With no slug, every view of every discovered ontology is built.

Options
  --check              re-derive and byte-compare against the committed files,
                       writing nothing. Differences are reported as warnings --
                       hand-editing generated output before a deployment is
                       allowed, so this does not fail on its own
  --strict             treat warnings as failures, including a stale-file
                       difference under --check
  --prune-positions    drop saved positions that no longer match a box
  --verbose            list every suppressed line and file written
  --json               machine-readable output for CI annotations
  -h, --help           this text
`;

function parseArgs(argv) {
  const options = {
    slugs: [],
    check: false,
    strict: false,
    verbose: false,
    json: false,
    prunePositions: false,
    help: false,
  };

  for (const arg of argv) {
    switch (arg) {
      case "--check": options.check = true; break;
      case "--strict": options.strict = true; break;
      case "--verbose": case "-v": options.verbose = true; break;
      case "--json": options.json = true; break;
      case "--prune-positions": options.prunePositions = true; break;
      case "-h": case "--help": options.help = true; break;
      default:
        if (arg.startsWith("-")) throw new Error(`unknown option ${arg}\n${USAGE}`);
        options.slugs.push(arg);
    }
  }

  return options;
}

module.exports = { parseArgs, USAGE };
