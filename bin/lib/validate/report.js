"use strict";

/** Console reporting, grouped by database, with a machine-readable mode for CI. */

const ICONS = { error: "ERROR", warn: "WARN ", info: "info " };

function makeLogger({ verbose = false, json = false } = {}) {
  const records = [];
  const emit = (level, message) => {
    records.push({ level, message });
    if (json) return;
    if (level === "info" && !verbose) return;
    const line = `${ICONS[level] || level}  ${message}`;
    if (level === "error") console.error(line);
    else console.log(line);
  };
  return {
    records,
    info: (m) => emit("info", m),
    warn: (m) => emit("warn", m),
    error: (m) => emit("error", m),
    plain: (m) => {
      if (!json) console.log(m);
    },
  };
}

/**
 * Print the per-view summary and its diagnostics.
 * Returns the number of blocking problems, honouring --strict.
 */
function reportView(view, diagnostics, { log, strict, verbose }) {
  log.plain("");
  log.plain(
    `${view.slug}   ${view.boxes.length} boxes  ${view.edges.length} lines` +
      (view.positions
        ? `  (positions: ${view.positions.keptIds.length} kept, ` +
          `${view.positions.addedIds.length} added, ${view.positions.staleIds.length} stale)`
        : "")
  );

  for (const d of diagnostics) {
    if (d.severity === "error") log.error(d.message);
    else log.warn(d.message);
  }

  const dep = view.deprecated;
  if (dep && (dep.properties.length || dep.classes.length)) {
    log.info(
      `owl:deprecated hidden: ${dep.properties.length} propert(ies) removing ` +
        `${dep.columns} column(s), and ${dep.classes.length} class(es)`
    );
    if (verbose) {
      if (dep.properties.length) log.info(`  properties: ${dep.properties.join(", ")}`);
      if (dep.classes.length) log.info(`  classes: ${dep.classes.join(", ")}`);
    }
  }

  if (verbose) {
    for (const s of view.suppressed || []) log.info(`suppressed ${s.text}  [${s.rule}]`);
  } else if (view.suppressed && view.suppressed.length) {
    log.info(
      `${view.suppressed.length} lines suppressed by cargo:vis_hidden (use --verbose to list)`
    );
  }

  const errors = diagnostics.filter((d) => d.severity === "error").length;
  const warnings = diagnostics.filter((d) => d.severity === "warn").length;
  return strict ? errors + warnings : errors;
}

/** Summarise what a write pass changed, or what --check found out of date. */
function reportWriter(writer, { log, check, strict }) {
  log.plain("");
  if (!writer.dirty) {
    log.plain(`${check ? "check" : "write"}: ${writer.unchanged.length} files already up to date`);
    return 0;
  }

  if (check) {
    // A mismatch is reported, not fatal. Hand-editing a generated file before a
    // deployment is intended behaviour here, so the check tells you what diverged
    // and leaves the decision to you: regenerate, or keep the manual edit.
    // `--strict` (npm run ontology:check:strict) turns this back into a failure
    // for anyone who wants the stricter gate.
    const report = strict ? log.error : log.warn;
    report(
      `${writer.dirty} generated file(s) differ from what the ontology derives. ` +
        `Run "npm run ontology:build" to regenerate, or keep the manual edits.`
    );
    for (const f of [...writer.created, ...writer.changed, ...writer.removed]) {
      report(`   ${f}`);
    }
    return strict ? writer.dirty : 0;
  }

  log.plain(
    `wrote ${writer.created.length} new, ${writer.changed.length} changed, ` +
      `${writer.removed.length} removed, ${writer.unchanged.length} unchanged`
  );
  for (const f of writer.created) log.info(`  + ${f}`);
  for (const f of writer.changed) log.info(`  ~ ${f}`);
  for (const f of writer.removed) log.info(`  - ${f}`);
  return 0;
}

module.exports = { makeLogger, reportView, reportWriter };
