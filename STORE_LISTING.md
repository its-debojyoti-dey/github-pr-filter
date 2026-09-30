# Chrome Web Store Submission Dossier

This document contains all verified metadata, descriptions, permission justifications, and asset references needed to submit **GitHub PR Filter** to the Google Chrome Web Store.

---

## 1. Store Listing Metadata

### Extension Name
```text
GitHub PR Filter
```
*(Character count: 16 / 45)*

### Summary / Short Description
```text
Native PR filter bar with 1-click preset chips, visual query builder, and zero-telemetry client-side speed.
```
*(Character count: 108 / 132)*

### Detailed Description
```text
Filter GitHub Pull Requests faster with quick preset chips and a visual criteria builder directly above the PR list.

If you regularly filter PRs by reviewer, status, or bot author, typing out `review-requested:@me is:open` or `-author:app/dependabot` gets old quickly. This extension adds clickable filter chips and dropdown controls right into GitHub's pull request index.

Key features:

Preset filter chips
Clickable chips for common searches:
• Needs My Review (`review-requested:@me is:open`)
• Created by Me (`author:@me is:open`)
• Ready to Merge (`is:open -is:draft review:approved status:success`)
• Exclude Bots (`-author:app/dependabot -author:app/renovate -author:app/github-actions`)
• Drafts (`is:open draft:true`)

Visual criteria builder
A dropdown menu to toggle states (open, closed), review approvals, and CI check results without manually typing GitHub search qualifiers. Query tokens sync live with GitHub's search bar.

Custom presets
Save your own frequent query combinations as custom chips. Presets are stored locally in your browser.

Native styling and Turbo support
Designed with GitHub Primer components to match GitHub Light, Dark Default, and Dark Dimmed themes. Works with GitHub's client-side Turbo navigation, pagination, and shareable URLs.

Privacy and permissions:
• 100% client-side. No telemetry, analytics, or external requests.
• Requires no GitHub personal access tokens or login credentials.
• Only requests storage (to save your custom presets) and access to github.com to display the UI.
• Source code: https://github.com/its-debojyoti-dey/github-pr-filter
```

### Category
```text
Developer Tools
```

### Language
```text
English
```

---

## 2. Graphic & Media Assets

All assets are generated and located in the `store-assets/` directory:

| Asset | Specifications | File Path |
| :--- | :--- | :--- |
| **Store Icon** | 128 x 128 px (PNG) | `store-assets/icon-128x128.png` |
| **Primary Screenshot** | 1280 x 800 px (PNG) | `store-assets/screenshot-1280x800.png` |
| **Small Promotional Tile** | 440 x 280 px (PNG) | `store-assets/promo-tile-440x280.png` |

---

## 3. Privacy & Compliance Tab (Mandatory for Review)

Google's review team strictly evaluates permissions and single-purpose scope. Use the exact answers below:

### Single Purpose Description
```text
Enhance the GitHub pull request list view with an interactive filter bar, 1-click preset chips, and a visual query builder.
```

### Permission Justifications

#### `storage`
```text
Required solely to save user-defined custom filter presets (preset names and query strings) and UI display state locally in the user's browser. No data is transmitted remotely.
```

#### Host Permission (`https://github.com/*`)
```text
Required to inject the interactive filter bar and preset chips into GitHub repository Pull Request list pages (https://github.com/<owner>/<repo>/pulls) and synchronize search queries with the page.
```

### Host Permission Justification Checkbox
- **Does your extension use remote code?** Select **No** (all code is bundled within the extension package).
- **Data Usage:**
  - Check **"I do not collect or use user data"** (or specify: Local Storage only for user preferences; zero PII collected).
  - Check the Developer Program Policy certification checkmarks.

### Privacy Policy URL
Host your policy on GitHub Pages or use the public repository link:
```text
https://raw.githubusercontent.com/its-debojyoti-dey/github-pr-filter/master/PRIVACY.md
```
*(Or the rendered GitHub URL: `https://github.com/its-debojyoti-dey/github-pr-filter/blob/master/PRIVACY.md`)*

---

## 4. Distribution & Pricing Settings

- **Pricing:** Free
- **Visibility:** Public
- **Geographic distribution:** All regions (Worldwide)

---

## 5. Release Archive File

- **Production ZIP Package:** `release/github-pr-filter-v1.0.1.zip`
- **Root verification:** Verified that `manifest.json`, `assets/`, and `icons/` are located at the root of the ZIP.
