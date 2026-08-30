# Chrome Web Store Listing & Publication Guide

**Extension Name:** GitHub PR Filter  
**Version:** 1.0.0  
**Category:** Developer Tools  
**Last Updated:** 2026-08-30  

---

## 1. Store Metadata

### Extension Name
```text
GitHub PR Filter
```

### Summary / Short Description (Max 132 chars)
```text
Enhance GitHub Pull Request pages with an interactive filter bar, one-click preset chips, and visual query building.
```

### Detailed Description
```markdown
GitHub PR Filter supercharges your GitHub repository workflow by adding an interactive, native-looking filter bar and one-click preset chips directly to the Pull Requests page.

Built to look and feel 100% native to GitHub Primer, this extension integrates directly with GitHub's query system and Turbo navigation so you can effortlessly triage and review PRs.

KEY FEATURES:

⚡ 1-Click Preset Filter Chips:
- "Needs My Review": Instantly filter pull requests awaiting your review (`review-requested:@me is:open`).
- "Created by Me": Track pull requests you opened (`author:@me is:open`).
- "Ready to Merge": Find open PRs with approved reviews and passing CI checks (`is:open -is:draft review:approved status:success`).
- "Exclude Bots": Filter out noisy Dependabot, Renovate, and automated PRs (`-author:app/dependabot -author:app/renovate -author:app/github-actions`).
- "Drafts": View only draft pull requests (`is:open draft:true`).

🎯 Unified Filters Dropdown:
- Visually toggle states (Open, Closed, Draft).
- Filter by review status (Approved, Changes Requested, Review Required, Reviewed by Me).
- Filter by CI status (Checks Passed, Checks Failed, Checks Pending).

🖥️ 100% Native GitHub Experience:
- Fully responsive across desktop, tablet, and mobile screens.
- Automatically matches GitHub Dark, Dark Dimmed, and Light themes.
- Powered by GitHub's native URL query parameters with full pagination and shareable URLs.

🔒 Privacy & Security First:
- Runs 100% client-side in your browser.
- Requires NO personal access tokens, NO account login, and NO elevated permissions.
- Zero analytics, zero telemetry, zero data collection.
```

---

## 2. Permissions Justification

| Field | Value | Reason for Review Team |
| :--- | :--- | :--- |
| **Permissions** | *None* | The extension requires no special Chrome permissions (`tabs`, `storage`, `webRequest`, etc. are NOT used). |
| **Host Permissions** | `https://github.com/*` | Required solely to inject the PR filter bar component on GitHub repository Pull Request pages (`https://github.com/*/*/pulls*`). |

---

## 3. Privacy Policy & Data Disclosure

**Single Purpose Statement:**  
To provide an interactive filter bar and preset chips on GitHub Pull Request pages.

**Data Collection & Usage:**  
- **Does this extension collect user data?** No.
- **Does this extension transmit data to third-party servers?** No. All filtering operates locally by updating GitHub's native URL query parameters.
- **Does this extension use remote code or external CDNs?** No. All assets are bundled locally in compliance with Manifest V3.

### Privacy Policy Text (For developer dashboard submission):
> "GitHub PR Filter does not collect, store, transmit, or share any personal, browsing, or repository data. The extension operates entirely client-side within the user's browser, modifying only the local DOM presentation on GitHub Pull Requests pages to enhance search filtering."

---

## 4. Store Assets Checklist

- [x] **Store Icon:** 128×128 PNG (`public/icons/icon-128.png` / `dist/icons/icon-128.png`).
- [x] **Extension Icons:** 16×16, 48×48, 128×128 PNGs included in the manifest.
- [x] **Store Screenshots:** At least one 1280×800 or 640×400 screenshot showing the filter bar and dropdown in action on GitHub.
- [x] **ZIP Package:** Clean production zip containing only `manifest.json`, `assets/`, and `icons/` (no `.git`, `node_modules`, or raw source code).

---

## 5. Step-by-Step Submission Instructions

1. **Register as a Chrome Web Store Developer:**
   - Navigate to the [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole/).
   - Pay the one-time Google registration fee ($5 USD) if not already registered.

2. **Upload Package:**
   - Click **Add new item**.
   - Upload `github-pr-filter-v1.0.0.zip` (generated in the project root).

3. **Fill Out Store Listing:**
   - Copy & paste the **Summary** and **Detailed Description** from Section 1 above.
   - Upload the 128×128 icon from `public/icons/icon-128.png`.
   - Upload at least one screenshot.

4. **Privacy Tab:**
   - Under **Single Purpose**, paste:
     > "Provides an interactive filter bar and quick preset chips on GitHub Pull Request pages."
   - Check **No** for all data collection categories.
   - Under **Host Permission Justification**, paste:
     > "The extension only runs on GitHub to inject the filter interface on repository Pull Request pages."

5. **Submit for Review:**
   - Click **Submit for review**.
   - Review typically takes between 24 to 72 hours. Once approved, your extension will be publicly installable with a single click.
