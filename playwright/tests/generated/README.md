# Generated Playwright Tests (Standalone)

This folder will contain Playwright specs generated from Excel files.

Usage (from the playwright/ directory):
- Install browsers and deps: `npm run pw:install`
- Generate tests from Excel: `npm run pw:gen -- --input ./path/to/testcases.xlsx`
  - Optional: set E2E_BASE_URL to the target host (defaults to http://localhost:3000)
- Run tests headlessly: `npm run pw:test`
- Open UI mode: `npm run pw:test:ui`
- View the report: `npm run pw:report`

Environment:
- E2E_BASE_URL: Base URL used by playwright.config.ts and generated tests.

Notes:
- This workspace is standalone and does not depend on any React or frontend build scripts.
- Place any hand-written specs under playwright/tests.
- Generated specs are written to this folder.
