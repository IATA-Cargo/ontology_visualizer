"use strict";

const fs = require("fs");
const path = require("path");

/**
 * A write that records what it would do, so the same code path serves both
 * `ontology:build` (write) and `ontology:check` (byte-compare, write nothing).
 *
 * `--check` is what makes committing generated output safe: the build re-derives
 * everything from the TTL and fails if the committed files disagree, so a stale
 * commit can never be deployed. It must therefore never write.
 */
class FileWriter {
  constructor({ dryRun = false } = {}) {
    this.dryRun = dryRun;
    this.changed = [];
    this.created = [];
    this.unchanged = [];
    this.removed = [];
  }

  /** Write `content` to `filePath` unless it already matches byte-for-byte. */
  write(filePath, content) {
    const existing = fs.existsSync(filePath)
      ? fs.readFileSync(filePath, "utf8")
      : null;

    if (existing === content) {
      this.unchanged.push(filePath);
      return "unchanged";
    }

    const status = existing === null ? "created" : "changed";
    this[status].push(filePath);

    if (!this.dryRun) {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, content, "utf8");
    }
    return status;
  }

  /** Delete a file that is no longer generated (e.g. a class was renamed). */
  remove(filePath) {
    if (!fs.existsSync(filePath)) return "absent";
    this.removed.push(filePath);
    if (!this.dryRun) fs.unlinkSync(filePath);
    return "removed";
  }

  get dirty() {
    return this.changed.length + this.created.length + this.removed.length;
  }
}

module.exports = { FileWriter };
