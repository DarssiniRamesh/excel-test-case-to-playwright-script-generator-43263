#!/bin/bash
cd /home/kavia/workspace/code-generation/excel-test-case-to-playwright-script-generator-43263/frontend_app
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

