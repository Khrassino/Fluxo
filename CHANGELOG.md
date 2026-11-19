# Changelog

Notable changes to Fluxo are documented in this file.

## [1.0.1] - 2026-11-19

### Added
- Windows 64-bit desktop app, packaged with Electron.
- NSIS installer with desktop and Start menu shortcuts.
- Home page quote system with built-in Portuguese and English libraries.
- Options to add, edit, and delete custom quotes.
- Optional integration with the DummyJSON API for external quotes, with local caching.
- Quote customization options: text size, font, alignment, and author visibility.
- Full backup import and restore, including app data, Workspace boards, and associated files.
- Writing and drawing tools in the Workspace.
- Improved editing and controls for LaTeX formulas in the Workspace.

### Improved
- Interface localization, with English as the default language for new installations while preserving the language preference already selected by existing users.
- Workspace experience, including background patterns and controls.
- Electron packaging: web files are copied into the desktop package without modifying the original files.
- Vercel Analytics and Speed Insights scripts are removed from the packaged desktop HTML.
- Automated tests for navigation, persistence, PDFs, audio, and backup export/restore.

### Notes
- The desktop version stores its data separately from the web version. Use the export and import features to transfer information between installations.
- The Windows installer is not yet digitally signed.
