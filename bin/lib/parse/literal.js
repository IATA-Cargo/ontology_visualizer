"use strict";

// Literal handling.
//
// The ontology mixes plain and language-tagged literals for the same
// annotation -- `:vis_element "Embedded"` and `:vis_element "Embedded"@en` both
// occur. Reading `term.value` collapses that duality to a no-op, so every
// literal read in the generator goes through here rather than comparing terms.

/** Text of a literal term, trimmed. Returns null for absent/blank. */
function literalText(term) {
  if (!term) return null;
  const text = String(term.value).trim();
  return text.length ? text : null;
}

/**
 * Join several rdfs:comment values the way the old SPARQL did
 * (GROUP_CONCAT with separator=" - ").
 *
 * Sorted for determinism: the store returned these in hash order, so an
 * unsorted join would make the output depend on parse order.
 */
function joinComments(terms) {
  const parts = terms.map(literalText).filter(Boolean);
  if (!parts.length) return null;
  return [...new Set(parts)].sort().join(" - ");
}

/**
 * Strict xsd:boolean coercion.
 *
 * Deliberately narrow: a typo'd `:vis_hidden "yes"` silently leaving 200 lines
 * visible is exactly the class of failure this generator exists to prevent, so
 * anything unrecognised throws instead of defaulting.
 */
function booleanValue(term, context) {
  const text = literalText(term);
  if (text === null) return null;
  const lowered = text.toLowerCase();
  if (lowered === "true" || lowered === "1") return true;
  if (lowered === "false" || lowered === "0") return false;
  throw new Error(
    `${context}: expected an xsd:boolean (true/false/1/0) but found "${text}"`
  );
}

/** Strict non-negative integer coercion, for vis_level and cardinalities. */
function integerValue(term, context) {
  const text = literalText(term);
  if (text === null) return null;
  if (!/^\d+$/.test(text)) {
    throw new Error(
      `${context}: expected a non-negative integer but found "${text}"`
    );
  }
  return Number.parseInt(text, 10);
}

module.exports = { literalText, joinComments, booleanValue, integerValue };
