"use strict";

// Serialization that byte-matches the files the old pipeline committed:
// 2-space indent, LF line endings, trailing newline.
//
// Everything the generator writes goes through here so that `--check` can
// byte-compare against what is on disk without normalising first.

const EOL = "\n";

/** JSON.stringify with the project's committed conventions. */
function stableStringify(value) {
  return JSON.stringify(value, null, 2).replace(/\r\n/g, EOL) + EOL;
}

/**
 * Rebuild an object with its keys in an explicit order, dropping keys whose
 * value is `undefined`. Key order is what makes the emitted JSON diffable, so
 * it is stated at the call site rather than left to insertion order.
 */
function orderedObject(source, keyOrder) {
  const out = {};
  for (const key of keyOrder) {
    if (source[key] !== undefined) out[key] = source[key];
  }
  return out;
}

/** Sort an object's keys with a comparator, preserving values. */
function sortedByKey(source, compare) {
  const out = {};
  for (const key of Object.keys(source).sort(compare)) out[key] = source[key];
  return out;
}

module.exports = { stableStringify, orderedObject, sortedByKey, EOL };
