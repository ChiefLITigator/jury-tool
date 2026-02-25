'use strict';

// Run: node verify-caci.js
// Reads caci-data.json produced by parse-caci.js and prints a quality report.

const fs = require('fs');
const path = require('path');

const INPUT_PATH = path.join(__dirname, 'caci-data.json');
const SHORT_THRESHOLD = 100;   // characters — below this is flagged as possibly truncated
const SAMPLE_SIZE = 5;

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Returns true if the string contains any character outside the printable ASCII range. */
function hasNonAscii(str) {
  return /[^\x09\x0A\x0D\x20-\x7E]/.test(str);
}

/** Picks `n` random entries from an array without replacement. */
function sample(arr, n) {
  const copy = arr.slice();
  const result = [];
  while (result.length < n && copy.length) {
    const idx = Math.floor(Math.random() * copy.length);
    result.push(copy.splice(idx, 1)[0]);
  }
  return result;
}

function separator(char = '─', width = 60) {
  return char.repeat(width);
}

// ── Main ─────────────────────────────────────────────────────────────────────

function main() {
  if (!fs.existsSync(INPUT_PATH)) {
    console.error(`ERROR: ${INPUT_PATH} not found. Run parse-caci.js first.`);
    process.exit(1);
  }

  const raw = fs.readFileSync(INPUT_PATH, 'utf8');
  const data = JSON.parse(raw);
  const keys = Object.keys(data);
  const total = keys.length;

  // ── Analysis passes ────────────────────────────────────────────────────────
  const shortKeys = [];
  const nonAsciiKeys = [];

  for (const key of keys) {
    const val = data[key];
    if (val.length < SHORT_THRESHOLD) shortKeys.push(key);
    if (hasNonAscii(val)) nonAsciiKeys.push(key);
  }

  // ── Report ─────────────────────────────────────────────────────────────────
  console.log('\n' + separator('═'));
  console.log(' CACI Data Verification Report');
  console.log(separator('═'));

  console.log(`\nTotal instruction keys : ${total}`);
  console.log(`Short values (<${SHORT_THRESHOLD} chars)  : ${shortKeys.length}`);
  console.log(`Non-ASCII values       : ${nonAsciiKeys.length}`);

  // Short entries
  if (shortKeys.length > 0) {
    console.log('\n' + separator());
    console.log(` POSSIBLY TRUNCATED (< ${SHORT_THRESHOLD} characters)`);
    console.log(separator());
    for (const key of shortKeys) {
      const preview = data[key].replace(/\n/g, ' ').slice(0, 80);
      console.log(`  [${key}] (${data[key].length} chars) "${preview}"`);
    }
  }

  // Non-ASCII entries
  if (nonAsciiKeys.length > 0) {
    console.log('\n' + separator());
    console.log(' NON-ASCII CHARACTERS DETECTED');
    console.log(separator());
    for (const key of nonAsciiKeys) {
      const preview = data[key].replace(/\n/g, ' ').slice(0, 80);
      console.log(`  [${key}] "${preview}"`);
    }
  }

  // Random sample
  const sampleKeys = sample(keys, Math.min(SAMPLE_SIZE, total));
  console.log('\n' + separator());
  console.log(` RANDOM SAMPLE (${sampleKeys.length} of ${total})`);
  console.log(separator());
  for (const key of sampleKeys) {
    const val = data[key];
    const preview = val.replace(/\n+/g, ' ').slice(0, 200);
    console.log(`\n  Instruction ${key} (${val.length} chars):`);
    console.log(`  ${preview}${val.length > 200 ? '…' : ''}`);
  }

  // Summary
  console.log('\n' + separator('═'));
  console.log(' SUMMARY');
  console.log(separator('═'));
  console.log(`  Total instructions  : ${total}`);
  console.log(`  Passed checks       : ${total - shortKeys.length - nonAsciiKeys.length}`);
  console.log(`  Flagged (short)     : ${shortKeys.length}`);
  console.log(`  Flagged (non-ASCII) : ${nonAsciiKeys.length}`);
  const pct = total > 0 ? (((total - shortKeys.length) / total) * 100).toFixed(1) : '0.0';
  console.log(`  Full-length rate    : ${pct}%`);
  console.log(separator('═') + '\n');
}

main();
