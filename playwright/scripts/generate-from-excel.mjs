#!/usr/bin/env node
/**
 * PUBLIC_INTERFACE
 * Simple generator that converts a basic Excel sheet into Playwright tests.
 * It expects an input Excel file path via EXCEL_PATH or --input argument.
 * Output tests are written to playwright/tests/generated/.
 *
 * Sheet format (minimal):
 * - Column A: testName
 * - Column B: url (relative or absolute)
 * - Column C: action (goto, click, fill)
 * - Column D: selector (CSS)
 * - Column E: value (for fill)
 *
 * Note: This is a minimal example and should be extended for real-world usage.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import xlsx from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if ((a === '--input' || a === '-i') && args[i + 1]) {
      opts.input = args[i + 1];
      i++;
    } else if ((a === '--sheet' || a === '-s') && args[i + 1]) {
      opts.sheet = args[i + 1];
      i++;
    } else if ((a === '--help' || a === '-h')) {
      opts.help = true;
    }
  }
  return opts;
}

function usage() {
  console.log(`Usage: node scripts/generate-from-excel.mjs --input ./testcases.xlsx [--sheet Sheet1]
Environment:
  E2E_BASE_URL    Base URL for tests (fallback http://localhost:3000)
Details:
  Reads an Excel file and emits tests into playwright/tests/generated/*.spec.ts`);
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function sanitize(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function generateTestFile(cases, suiteName, outPath) {
  const baseURLExpr = "process.env.E2E_BASE_URL || 'http://localhost:3000'";
  let content = `import { test, expect } from '@playwright/test';

test.describe('${suiteName}', () => {
`;

  // Group by testName
  const grouped = cases.reduce((acc, row) => {
    const key = row.testName || 'unnamed';
    acc[key] = acc[key] || [];
    acc[key].push(row);
    return acc;
  }, {});

  for (const [name, steps] of Object.entries(grouped)) {
    const testName = name || 'unnamed';
    content += `  test('${testName}', async ({ page }) => {
    const base = ${baseURLExpr};
`;
    for (const step of steps) {
      const action = (step.action || '').toLowerCase();
      const sel = step.selector || '';
      const val = step.value || '';
      const url = step.url || '';
      if (action === 'goto') {
        // If url is absolute use as-is, else resolve with base
        content += `    await page.goto(${JSON.stringify(url)}.startsWith('http') ? ${JSON.stringify(url)} : base.replace(/\\/$/, '') + '/' + ${JSON.stringify(url)}.replace(/^\\//, ''));\n`;
      } else if (action === 'click') {
        content += `    await page.click(${JSON.stringify(sel)});\n`;
      } else if (action === 'fill') {
        content += `    await page.fill(${JSON.stringify(sel)}, ${JSON.stringify(val)});\n`;
      } else {
        content += `    // Unsupported action: ${action}\n`;
      }
    }
    content += `    await expect(page).toHaveURL(/.*/);
  });\n\n`;
  }

  content += `});\n`;

  fs.writeFileSync(outPath, content, 'utf8');
}

(function main() {
  const args = parseArgs();
  if (args.help) {
    usage();
    process.exit(0);
  }
  const inputPath = args.input || process.env.EXCEL_PATH;
  if (!inputPath) {
    console.error('Error: Excel input not provided. Use --input or set EXCEL_PATH.');
    usage();
    process.exit(1);
  }
  const wb = xlsx.readFile(inputPath);
  const sheetName = args.sheet || wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  if (!ws) {
    console.error(`Error: Sheet "${sheetName}" not found.`);
    process.exit(1);
  }
  const rows = xlsx.utils.sheet_to_json(ws, { defval: '' });
  if (!Array.isArray(rows) || rows.length === 0) {
    console.error('No rows found in sheet.');
    process.exit(1);
  }

  const cases = rows.map(r => ({
    testName: r.testName || r.TestName || r.name || r.Name || '',
    url: r.url || r.URL || '',
    action: r.action || r.Action || '',
    selector: r.selector || r.Selector || '',
    value: r.value || r.Value || ''
  }));

  const outDir = path.resolve(__dirname, '..', 'tests', 'generated');
  ensureDir(outDir);
  const suiteName = path.basename(inputPath, path.extname(inputPath));
  const outFile = path.join(outDir, `${sanitize(suiteName)}.spec.ts`);
  generateTestFile(cases, suiteName, outFile);

  console.log(`Generated: ${path.relative(process.cwd(), outFile)}`);
})();
