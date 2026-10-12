@echo off
if "%~1"=="" (
  echo Error: Target URL is required.
  echo Usage: run-scan.cmd ^<URL^>
  echo Example: run-scan.cmd https://example.com
  exit /b 1
)

echo =======================================================
echo Running WCAG 2.2 AA Accessibility Scan on %1
echo =======================================================
echo.

call npx.cmd @axe-core/cli %1 --tags wcag2a,wcag2aa,wcag21a,wcag21aa,wcag22aa
