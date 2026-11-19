# Fluxo

A lightweight, customizable, minimalist productivity space. Fluxo brings focus, organization, and progress-tracking tools together in an interface you can adapt to the way you work.

The project is available as a web app and a Windows desktop app built with Electron.

## Try Fluxo in your browser

**[Open Fluxo](https://fluxo-phi-eosin.vercel.app/)** — use the web version directly in your browser, with no installation required.

## Downloads

**[Download the latest release](https://github.com/Khrassino/Fluxo/releases/latest)**

On the Releases page, download the Windows installer:

`Fluxo-Setup-<version>.exe`

The desktop app is currently distributed for **64-bit Windows (x64)**.

## Features

- **Home:** clock, greeting, customizable shortcuts, and quotes.
- **Timer:** Pomodoro timer, stopwatch, and adjustable appearance.
- **Progress:** statistics, daily goals, and charts to track app usage and focus sessions.
- **Tasks:** create and edit tasks, filter them, set priorities and due dates, and stay organized.
- **Workspace:** an infinite canvas with text cards, connections, writing and drawing tools, images, and PDFs.
- **Customization:** themes, colors, fonts, visual effects, sounds, and behavior settings.
- **Quotes:** built-in library, user-added quotes, and an optional external source.
- **Backups:** export and import app data, including Workspace content and stored files.

The interface is available in Portuguese and English.

## Installing on Windows

1. Open the [Releases](https://github.com/Khrassino/Fluxo/releases/latest) page.
2. Download `Fluxo-Setup-<version>.exe`.
3. Run the installer and choose the installation folder.
4. Once installation is complete, launch Fluxo from the desktop shortcut or the Start menu.

> **Windows security notice:** The installer is not digitally signed, so Windows SmartScreen may show a warning when you run it. This warning does not, by itself, mean the file is malicious. Always make sure you downloaded it from the project's official Releases page.

## Your data and backups

Fluxo stores settings, tasks, statistics, and workspace content locally on your device.

The web and desktop versions use separate storage. To transfer your data between them or between computers:

1. In the source installation, open **Settings → General → Export data**.
2. Save the generated JSON file.
3. In the destination installation, use **Import backup**.

The backup includes the app state, Workspace boards, and associated files. Keep a copy of the backup in a safe place, especially before updating or moving to another device.

On Windows, the desktop app stores its data in the application's user data directory. Uninstalling Fluxo does not remove this data; the installer is also configured to preserve it during updates.

## Privacy and offline use

Personal information and work data are stored locally. The desktop version does not load the Vercel Analytics scripts used by the web version.

Some optional features may connect to external services:
- When enabled, the external quotes source retrieves quotes from the DummyJSON API. Results are cached locally for 24 hours.
- Fonts may be loaded from Google Fonts. Without an internet connection, the app uses system fallback fonts.

Core features and previously saved data remain available offline. Fetching new external quotes and loading online fonts require an internet connection.

## Development

The web app is built with HTML, CSS, and JavaScript. The Windows desktop package is located in the `desktop/` directory and uses Electron and electron-builder.

### Run the desktop app in development mode

You need [Node.js LTS](https://nodejs.org/) installed.

```bash
cd desktop
npm install
npm start
```

### Build the Windows installer

From the `desktop/` directory, run:

```bash
npm run dist
```

The installer will be generated in `desktop/dist/`, with its filename based on the version in `desktop/package.json`.

To run the automated desktop app tests:

```bash
npm run smoke
```

### Main project structure

- `index.html`: entry point for the web version.
- `public/`: static files, scripts, stylesheets, fonts, and assets.
- `desktop/`: Electron main process, packaging configuration, and build/test scripts.

## Updates

See the [CHANGELOG](CHANGELOG.md) for changes in each version, and the [Releases](https://github.com/Khrassino/Fluxo/releases) page to download available installers.
