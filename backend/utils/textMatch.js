/**
 * Heuristic word-overlap text matching — used by both the academic
 * self-study Q&A (routes/qa.js) and the platform help chatbot
 * (routes/chatbot.js). Extracted here once both needed the identical
 * logic, so a fix or tuning change only has to happen in one place.
 *
 * This is genuinely NOT a language model — no embeddings, no semantic
 * understanding, no external AI API. It's Jaccard similarity (word-set
 * overlap) over lightly normalized text. It works well for "the same
 * question asked with different wording" and fails on anything requiring
 * actual comprehension. That's an honest description of its ceiling, not
 * a caveat to downplay.
 */

const STOPWORDS = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'to', 'of', 'and', 'in', 'on', 'for', 'what', 'how', 'why', 'do', 'does', 'did', 'i', 'you', 'it', 'that', 'this', 'can', 'my']);

function tokenize(text) {
  return new Set(
    text.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 1 && !STOPWORDS.has(w))
  );
}

function jaccardSimilarity(setA, setB) {
  if (!setA.size || !setB.size) return 0;
  let intersection = 0;
  for (const word of setA) if (setB.has(word)) intersection += 1;
  const union = setA.size + setB.size - intersection;
  return union ? intersection / union : 0;
}

// candidates: array of { ...whatever, textToMatch: string }
// Returns { match, score } for the best candidate at/above threshold, or null.
function findBestMatch(queryText, candidates, threshold, textField = 'textToMatch') {
  const tokens = tokenize(queryText);
  let best = null;
  let bestScore = 0;
  for (const c of candidates) {
    const score = jaccardSimilarity(tokens, tokenize(c[textField]));
    if (score > bestScore) { bestScore = score; best = c; }
  }
  return bestScore >= threshold ? { match: best, score: bestScore } : null;
}

module.exports = { tokenize, jaccardSimilarity, findBestMatch };
