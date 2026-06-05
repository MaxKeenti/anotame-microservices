#!/usr/bin/env node
/**
 * Lint i18n message keys against the naming convention.
 * Convention: domain.component.purpose (2-4 camelCase segments)
 * Regex: /^[a-z][a-zA-Z]*(\.[a-z][a-zA-Z]*){1,3}$/
 */
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const KEY_REGEX = /^[a-z][a-zA-Z]*(\.[a-z][a-zA-Z]*){1,3}$/;
const MESSAGES_DIR = join(import.meta.dirname, '..', 'messages');

let errors = 0;
const files = readdirSync(MESSAGES_DIR).filter(f => f.endsWith('.json'));

for (const file of files) {
  const content = JSON.parse(readFileSync(join(MESSAGES_DIR, file), 'utf-8'));
  for (const key of Object.keys(content)) {
    if (key === '$schema') continue;
    if (!KEY_REGEX.test(key)) {
      console.error(`❌ ${file}: "${key}" does not match naming convention`);
      errors++;
    }
  }
}

if (errors > 0) {
  console.error(`\n${errors} key(s) violate naming convention.`);
  console.error('Convention: domain.component.purpose (2-4 camelCase segments)');
  console.error('Regex: /^[a-z][a-zA-Z]*(\\.[a-z][a-zA-Z]*){1,3}$/');
  process.exit(1);
} else {
  console.log(`✓ ${files.length} file(s), all keys valid.`);
}
