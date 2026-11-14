# TS Reporter — Brave Edition

> **Experimental software — security and platform-policy review required.**

TS Reporter is a Manifest V3 browser-extension codebase that interacts with Twitch pages and provides a reporting-related interface. The source tree contains automated reporting workflow logic, generated email metadata, persistent activity records, and legacy browser identity/fingerprint code. The current manifest does not grant the network-header or scripting permissions needed to apply the legacy fingerprint modifications, and it no longer loads the page-context injection scripts.

These capabilities create a significant risk of misuse, including coordinated or misleading reports and attempts to circumvent platform anti-abuse systems. This repository should **not** be used to submit bulk, duplicate, retaliatory, or otherwise inaccurate reports.

## Project status

This project is provided as source code for inspection and review. It is not an endorsed, supported, or official Twitch tool.

This README intentionally does not provide installation, configuration, or operation instructions for the reporting automation. Before considering any legitimate testing or further development, review the implementation and remove automated report submission, synthetic identity data, and fingerprint or request-header manipulation. Any remaining reporting workflow should be manual, transparent, and consistent with the platform's rules.

## Repository structure

| Path | Purpose |
| --- | --- |
| `manifest.json` | Extension manifest and browser integration metadata |
| `background.js` | Background service worker and extension-level state management |
| `content.js` | Twitch page integration and in-page interface logic |
| `content/isolated.js` | Isolated content-script context and extension-state communication |
| `content/injected.js` | Page-context hooks used by the current fingerprint-related implementation |
| `panel.css` | Styles for the in-page panel |
| `options.html`, `options.js`, `options.css` | Dashboard markup, behavior, and styling |
| `LICENSE` | Project license |

## Technical notes

- The extension uses **Manifest V3**.
- The manifest declares **Chrome 120 or later** as its minimum Chrome version.
- Its declared host access is limited to Twitch-related domains.
- The implementation uses extension storage for settings and local activity state.

These notes describe the checked-in source; they are not a statement that the extension is safe, compliant, or suitable for production use.

## Responsible-use and safety notice

- Only make reports that are truthful, specific, and based on content or conduct you have personally observed.
- Do not automate, coordinate, duplicate, or fabricate reports against a person or channel.
- Do not use generated identities or browser-fingerprint changes to disguise activity or bypass platform safeguards.
- Do not treat this project as a substitute for Twitch's own reporting process.
- Review applicable platform terms, privacy requirements, and local law before modifying or testing this code.

For ordinary moderation concerns, use Twitch's built-in reporting tools and provide accurate information through the normal user-facing process.

## License

See [LICENSE](LICENSE) for the license that applies to this repository.
