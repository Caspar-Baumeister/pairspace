/**
 * Guards the copy rule: no hyphen characters in text the user reads.
 * Class names, imports, comments and code are ignored, only JSX text nodes and
 * common copy props are checked.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = "src";
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

    // JSX text between tags, and quoted strings inside copy props.
    const texts = [];
    const jsx = line.match(/>([^<>{}]+)</g);
    if (jsx) texts.push(...jsx.map((m) => m.slice(1, -1)));
    const props = line.match(/(?:title|label|placeholder|description|q|a|blurb|body|line|detail|heading|name|subject)[:=]\s*"([^"]+)"/g);
    if (props) texts.push(...props);

    for (const t of texts) {
      // L-basing is the established acro term, the hyphen is part of the word.
      if (/\w-\w/.test(t) && !/https?:|@|\.(app|com|de)\b|[A-Za-z]+-[a-z]+-[a-z]+|L-bas/.test(t)) {
        findings.push(`${file}:${i + 1}  ${t.trim()}`);
      }
    }
  });
}

walk(ROOT);

if (findings.length) {
  console.error("Hyphens found in visible copy:\n" + findings.join("\n"));
  process.exit(1);
}
console.log("Copy check passed, no hyphens in visible text.");
