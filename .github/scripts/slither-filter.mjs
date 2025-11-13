// .github/scripts/slither-filter-sarif.mjs
import fs from "fs";
import path from "path";

const [inputSarif, configJson, outputSarif] = process.argv.slice(2);
if (!inputSarif || !configJson || !outputSarif) {
  console.error("Usage: node slither-filter-sarif.mjs <input.sarif> <config.json> <output.sarif>");
  process.exit(2);
}

const sarif = JSON.parse(fs.readFileSync(inputSarif, "utf8"));
const cfg = JSON.parse(fs.readFileSync(configJson, "utf8"));

function globToRegex(glob) {
  // translate simple globs in your config to a regex
  return new RegExp(
    String(glob)
      .replace(/[.+^${}()|[\]\\]/g, "\\$&") // escape regex chars
      .replace(/\\\*\\\*/g, "§§DOUBLESTAR§§")
      .replace(/\\\*/g, "[^/]*")
      .replace(/§§DOUBLESTAR§§/g, ".*"),
  );
}

const rules = (cfg.suppressions || []).map((r) => ({
  check: r.check ? new RegExp(r.check) : null,
  file: r.file ? globToRegex(r.file) : null,
  func: r.function ? new RegExp(r.function) : null,
  line: Number.isFinite(r.line) ? { start: Number(r.line), end: Number(r.line) } : null,
  range: r.lineRange
    ? (() => {
        const m = String(r.lineRange).match(/^(\d+)\s*-\s*(\d+)$/);
        return m ? { start: Number(m[1]), end: Number(m[2]) } : null;
      })()
    : null,
}));

function decodeUri(u) {
  if (!u) return "";
  try {
    // handle "file:///..." and relative paths
    if (/^[a-z]+:\/\//i.test(u)) {
      const url = new URL(u);
      return decodeURIComponent(url.pathname);
    }
    return decodeURIComponent(u);
  } catch {
    return u;
  }
}

function norm(p) {
  try {
    const s = String(p || "").replace(/\\/g, "/");
    return path.posix.normalize(s).replace(/^\.\/+/, "");
  } catch {
    return p || "";
  }
}

function linesFromRegion(region) {
  if (!region) return [];
  const s = region.startLine;
  const e = region.endLine ?? s;
  if (Number.isFinite(s)) {
    const end = Number.isFinite(e) ? e : s;
    const out = [];
    for (let L = s; L <= end; L++) out.push(L);
    return out;
  }
  return [];
}

function locationMatchesRule(location, rule) {
  const phys = location?.physicalLocation || {};
  const art = phys.artifactLocation || {};
  const filePath = norm(decodeUri(art.uri || art.uriBaseId || ""));
  const fileOk = !rule.file || rule.file.test(filePath) || rule.file.test(filePath.replace(/^\/+/, ""));
  if (!fileOk) return false;

  if (!rule.line && !rule.range) return true;

  const lines = linesFromRegion(phys.region);
  const inLine = rule.line && lines.includes(rule.line.start);
  const inRange = rule.range && lines.some((L) => L >= rule.range.start && L <= rule.range.end);
  return Boolean(inLine || inRange);
}

function resultMatchesRule(res, rule, runCtx) {
  // check/detector name
  const ruleId =
    res.ruleId ??
    (Number.isFinite(res.ruleIndex) ? runCtx?.tool?.driver?.rules?.[res.ruleIndex]?.id : "") ??
    "";
  if (rule.check && !rule.check.test(ruleId)) return false;

  // function: try properties or message text as fallback
  const ftxt = [
    res.properties?.function,
    res.properties?.signature,
    res.properties?.function_name,
    res.message?.text,
  ]
    .filter(Boolean)
    .join(" | ");
  if (rule.func && !rule.func.test(ftxt)) return false;

  const locs = Array.isArray(res.locations) ? res.locations : [];
  if (!rule.file && !rule.line && !rule.range) {
    // only check/check+func — if present, match
    return true;
  }
  return locs.some((loc) => locationMatchesRule(loc, rule));
}

// --- Filter all runs' results ---
let suppressed = 0;
for (const run of sarif.runs || []) {
  const before = (run.results || []).length;
  const kept = (run.results || []).filter((res) => !rules.some((r) => resultMatchesRule(res, r, run)));
  suppressed += before - kept.length;
  run.results = kept;
}

fs.writeFileSync(outputSarif, JSON.stringify(sarif, null, 2));
console.log(`Suppressed ${suppressed} result(s). Kept SARIF results: ${
  (sarif.runs || []).reduce((n, r) => n + (r.results || []).length, 0)
}.`);
