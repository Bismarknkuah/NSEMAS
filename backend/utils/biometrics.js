/**
 * NSEMAS Biometric Engine — simulated fingerprint enrollment & matching
 * ----------------------------------------------------------------------
 * There is no physical fingerprint scanner attached to this system, so
 * this module simulates what one would produce: minutiae extraction,
 * multi-sample template training, and tolerance-based matching. This is
 * modeled on how real fingerprint SDKs actually work (e.g. NIST's
 * minutiae-based matching approach), just with synthetic ridge data
 * instead of an optical/capacitive sensor feed.
 *
 * How it works:
 *  1. Each student gets a deterministic "finger identity" (a seed derived
 *     from their student ID). generateScan() uses that seed to produce a
 *     consistent set of minutiae points (ridge endings / bifurcations)
 *     with position + angle — simulating what the same real finger would
 *     produce on repeated scans, plus small per-scan sensor noise.
 *  2. ENROLLMENT ("training"): the student scans 3 times. buildTemplate()
 *     merges the 3 samples into a single canonical template by clustering
 *     points that appear consistently across samples and discarding noisy
 *     outliers — exactly the "multi-sample capture improves template
 *     quality" approach real biometric enrollment uses. A quality score
 *     (0-100) reflects how consistent the samples were.
 *  3. VERIFICATION (attendance check-in): a fresh scan is generated and
 *     compared against the stored template with matchScore() — a
 *     nearest-neighbor minutiae matching algorithm within position/angle
 *     tolerance. Score >= MATCH_THRESHOLD accepts; below it, rejects.
 *     Scanning with a *different* student's seed (simulating the wrong
 *     finger) produces genuinely uncorrelated points and reliably fails
 *     to match — the system isn't just trusting a flag, it's actually
 *     discriminating between identities using the same geometry both
 *     ways.
 */

const MINUTIAE_COUNT = 34;
const MATCH_RADIUS = 0.045;      // max normalized distance to count as the same point
const ANGLE_TOLERANCE = 22;      // degrees
const MATCH_THRESHOLD = 62;      // % of template points that must find a match to accept

// --- deterministic seeded PRNG (mulberry32) so the same "finger" is stable ---
function makePrng(seedStr) {
  let h = 1779033703 ^ seedStr.length;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

/**
 * Generate a simulated minutiae scan for a given finger identity.
 * @param {string} fingerSeed - stable per-enrolled-finger identity (e.g. `${studentId}:${fingerIndex}`)
 * @param {number} noise - 0 = the "true" underlying pattern, higher = more per-scan sensor variance
 */
function generateScan(fingerSeed, noise = 0.02) {
  const rand = makePrng(fingerSeed);
  const points = [];
  for (let i = 0; i < MINUTIAE_COUNT; i++) {
    // base position/angle deterministic from the seed + point index
    const baseX = makePrng(fingerSeed + ':x:' + i)();
    const baseY = makePrng(fingerSeed + ':y:' + i)();
    const baseAngle = makePrng(fingerSeed + ':a:' + i)() * 360;
    // per-scan noise (simulates finger placement/pressure variance)
    const x = clamp01(baseX + (rand() - 0.5) * noise);
    const y = clamp01(baseY + (rand() - 0.5) * noise);
    const angle = (baseAngle + (rand() - 0.5) * noise * 400 + 360) % 360;
    const type = makePrng(fingerSeed + ':t:' + i)() > 0.5 ? 'ending' : 'bifurcation';
    points.push({ x, y, angle, type });
  }
  return points;
}

function clamp01(v) { return Math.max(0, Math.min(1, v)); }

function angleDiff(a, b) {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

/**
 * Train a canonical template from multiple enrollment scans of the same
 * finger. Points that show up consistently (within tolerance) across all
 * samples are kept and averaged; inconsistent noise is dropped. Returns
 * the template plus a 0-100 quality score.
 */
function buildTemplate(samples) {
  if (!samples.length) throw new Error('At least one enrollment sample is required');
  const base = samples[0];
  const stablePoints = [];
  let totalConsistency = 0;

  for (const basePoint of base) {
    let matchCount = 1;
    let sumX = basePoint.x, sumY = basePoint.y, sumAngle = basePoint.angle;
    for (let s = 1; s < samples.length; s++) {
      const match = findClosestPoint(basePoint, samples[s]);
      if (match && match.dist <= MATCH_RADIUS && angleDiff(basePoint.angle, match.point.angle) <= ANGLE_TOLERANCE) {
        matchCount++;
        sumX += match.point.x; sumY += match.point.y; sumAngle += match.point.angle;
      }
    }
    const consistency = matchCount / samples.length;
    totalConsistency += consistency;
    if (consistency >= (samples.length > 1 ? 2 / samples.length : 1)) {
      stablePoints.push({ x: sumX / matchCount, y: sumY / matchCount, angle: (sumAngle / matchCount) % 360, type: basePoint.type });
    }
  }

  const quality = Math.round((totalConsistency / base.length) * 100);
  return { points: stablePoints, quality, sampleCount: samples.length, trainedAt: new Date().toISOString() };
}

function findClosestPoint(point, sample) {
  let best = null, bestDist = Infinity;
  for (const p of sample) {
    const dist = Math.hypot(point.x - p.x, point.y - p.y);
    if (dist < bestDist) { bestDist = dist; best = p; }
  }
  return best ? { point: best, dist: bestDist } : null;
}

/**
 * Compare a fresh scan against a stored template. Returns a 0-100 match
 * score (percentage of template points that found a corresponding point
 * in the candidate scan within tolerance) and whether it clears the
 * acceptance threshold.
 */
function matchScore(template, candidateScan) {
  if (!template || !template.points || !template.points.length) {
    return { score: 0, accepted: false, matchedPoints: 0, templatePoints: 0 };
  }
  let matched = 0;
  for (const tp of template.points) {
    const closest = findClosestPoint(tp, candidateScan);
    if (closest && closest.dist <= MATCH_RADIUS && angleDiff(tp.angle, closest.point.angle) <= ANGLE_TOLERANCE) {
      matched++;
    }
  }
  const score = Math.round((matched / template.points.length) * 100);
  return { score, accepted: score >= MATCH_THRESHOLD, matchedPoints: matched, templatePoints: template.points.length };
}

module.exports = { generateScan, buildTemplate, matchScore, MATCH_THRESHOLD, MINUTIAE_COUNT };
