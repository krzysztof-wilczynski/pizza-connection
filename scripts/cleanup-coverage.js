import fs from 'fs';
import { readFile, writeFile } from 'fs/promises';

const coveragePath = 'coverage/playwright/coverage-final.json';

async function cleanupCoverage() {
  try {
    const data = await readFile(coveragePath, 'utf8');
    const coverage = JSON.parse(data);
    const cleanedCoverage = {};

    for (const file in coverage) {
      if (file.startsWith('/')) {
        cleanedCoverage[file] = coverage[file];
      }
    }

    await writeFile(coveragePath, JSON.stringify(cleanedCoverage), 'utf8');
  } catch (err) {
    console.error(err);
  }
}

cleanupCoverage();
