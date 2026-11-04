/**
 * Guards the copy rule: no Gedankenstriche (– or —) and no spaced hyphen used
 * as a dash in text the user reads. Hyphens inside words such as WG-Zimmer
 * are fine. Comments and imports are ignored.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

// The site and the Cloud Functions, whose mails and shared legal texts people read too.
const ROOTS = ["src", "functions/src"];
const findings = [];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full);
    else if (/\.(tsx|ts)$/.test(full)) check(full);
  }
}

function check(file) {
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, i) => {
    if (/^\s*(\/\/|\*|\/\*)/.test(line)) return;
    if (/^\s*import\s/.test(line)) return;
    const strings = line.match(/>[^<>{}]+<|"[^"]*"|`[^`]*`/g) ?? [];
    for (const s of strings) {
      if (/[–—]/.test(s) || /\p{L} - \p{L}/u.test(s)) findings.push(`${file}:${i + 1}  ${s.trim()}`);
    }
  });
}

ROOTS.forEach(walk);
if (findings.length) {
  console.error(`Dashes in user facing copy:\n${findings.join("\n")}`);
  process.exit(1);
}
console.log("Copy check passed.");
