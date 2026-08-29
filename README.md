# GitHub PR Filter Extension

A lightweight, native-feeling Chrome / Chromium browser extension (Manifest V3) that replaces GitHub's standard Pull Requests search input with an interactive filter bar, quick preset chips, and a structured criteria popover.

## Features

- **Native GitHub Primer Look & Feel:** Seamlessly matches GitHub's design system and automatically adapts to GitHub Light, Dark Default, and Dark Dimmed modes.
- **Quick Preset Chips:** 1-click filter pills positioned directly above the PR list:
  - `Needs My Review` (`review-requested:@me is:open`)
  - `Created by Me` (`author:@me is:open`)
  - `Ready to Merge` (`is:open -is:draft review:approved status:success`)
  - `Exclude Bots` (`-author:app/dependabot -author:app/renovate -author:app/github-actions`)
  - `Drafts` (`is:open draft:true`)
- **Visual Filters Popover:** Quick criteria menu to toggle states (`is:open`, `is:closed`), review statuses (`review:approved`, `review:changes_requested`), and CI checks (`status:success`, `status:failure`).
- **Live Query Input:** Real-time token synchronization with manual query editing and keyboard support (`Enter` to apply, `Esc`/`Clear` to reset).
- **GitHub Turbo Integration:** Smooth in-page PJAX/Turbo navigation with full repository pagination and shareable URLs.
- **Zero Configuration:** 100% client-side, requiring no GitHub Personal Access Tokens or permissions beyond GitHub PR pages.

## Development & Building

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Tests
```bash
npm run test
```

### 3. Build Extension
```bash
npm run build
```
The compiled extension output is generated in the `dist/` directory.

## Loading into Chrome / Brave / Edge

1. Open your browser and navigate to `chrome://extensions` (or `edge://extensions`, `brave://extensions`).
2. Enable **Developer mode** toggle in the top-right corner.
3. Click **Load unpacked**.
4. Select the `dist` directory (`d:/Debojyoti/Projects/GitHub_Filter/dist`).
5. Open any GitHub repository's Pull Requests page (e.g. `https://github.com/facebook/react/pulls`).
