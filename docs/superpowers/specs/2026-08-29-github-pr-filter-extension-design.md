# GitHub PR Filter Extension - Design Specification

**Date:** 2026-08-29  
**Status:** Approved  
**Target Platform:** Chrome / Chromium-based browsers (Manifest V3)  

---

## 1. Overview & Objectives

The **GitHub PR Filter Extension** is a Manifest V3 browser extension designed to enhance the developer experience on GitHub's repository Pull Requests page (`https://github.com/*/*/pulls*`). It replaces GitHub's standard, plain search text field with an integrated, native-looking filter component featuring:

1. **Quick-Filter Preset Chips:** 1-click toggles for common workflow views ("Needs My Review", "Created by Me", "Ready to Merge", "Exclude Bots", "Drafts", "Stale").
2. **Visual Filter Dropdown:** Structured multi-select interface for constructing complex queries (author, review status, labels, checks, PR state) without memorizing GitHub query syntax.
3. **Editable Query Input:** Retains full keyboard support, live token synchronization, and direct text editing.
4. **100% Native GitHub Primer Look & Feel:** Uses GitHub Primer design system tokens (`--bgColor-*`, `--fgColor-*`, Octicon SVGs, `.FormControl-input`, `.Button--secondary`) to blend seamlessly into GitHub and support both Light and Dark themes automatically.
5. **Seamless Turbo Navigation:** Hooks into GitHub's Turbo navigation events for smooth client-side page updates with full pagination and shareable URLs.

---

## 2. Architecture & Technology Stack

### 2.1 Extension Standard & Permissions
- **Manifest V3:** Modern Chrome Extension architecture.
- **Host Permissions:** Limited strictly to `https://github.com/*` (specifically targeting repository PR lists `/*/*/pulls*`).
- **Zero Configuration / No Tokens:** Works entirely client-side without requiring a GitHub Personal Access Token or OAuth sign-in.

### 2.2 Project Tooling
- **TypeScript:** Strict type safety for query parsing, AST token manipulation, and DOM lifecycle events.
- **Vite:** High-performance bundler producing clean output in `dist/`.
- **Vitest:** Fast automated test runner for query parsing and serialization logic.

### 2.3 Lifecycle & GitHub Turbo Handling
GitHub loads pages dynamically using `@hotwired/turbo` (PJAX). The extension manages its lifecycle via an injection controller:
- **Mount Triggers:** Initial `DOMContentLoaded` + GitHub custom events: `turbo:load`, `turbo:render`, and browser `popstate`.
- **Target Page Verification:** Checks `window.location.pathname` against `^/[^/]+/[^/]+/pulls(/.*)?$`.
- **Idempotency:** Attaches a `data-gh-pr-filter-mounted` marker attribute on the container to prevent duplicate injections during dynamic transitions.

---

## 3. Component Hierarchy & UI Specifications

The extension replaces GitHub's native `.subnav-search` or `form[action$="/pulls"]` container with a two-tiered component:

```
+-----------------------------------------------------------------------------------------------+
| [Search Icon] [ Filter input: is:pr is:open ...                       ] [Clear] [Filters v] [Apply] |
+-----------------------------------------------------------------------------------------------+
| Quick Chips:  [Needs My Review]  [Created by Me]  [Ready to Merge]  [No Bots]  [Drafts]  [+ Custom] |
+-----------------------------------------------------------------------------------------------+
```

### 3.1 Tier 1: Unified Query Input Bar
- **Input Field (`.gh-pr-filter-input`):**
  - Styled with Primer `.FormControl-input` rules and system fonts.
  - Synchronizes with current query tokens in real time.
  - Supports keyboard shortcuts (`Enter` to submit, `Esc` to clear/blur).
- **Clear Button (`X`):** Resets search query to the default repository baseline: `is:pr is:open`.
- **"Filters" Popover Trigger:**
  - Opens an accessible Primer-style dropdown menu grouped by category:
    - **Review Status:** `review:required`, `reviewed-by:@me`, `review-requested:@me`, `review:approved`, `review:changes_requested`.
    - **PR State:** `is:open`, `is:closed`, `is:merged`, `draft:true`, `draft:false`.
    - **Bot Filtering:** Exclude bots (`-author:app/dependabot -author:app/renovate -author:app/github-actions`) or show only bots.
    - **CI Checks:** `status:success`, `status:failure`, `status:pending`.
- **Apply Button:** Submits the query via the native form action.

### 3.2 Tier 2: Quick Filter Chip Strip
- Horizontally scrollable row positioned directly beneath the search input.
- Styled as Primer button pills (`.Button--secondary`, `border-radius: 100px`, `height: 28px`).
- **Active State:** Automatically illuminated with GitHub's accent background (`var(--bgColor-accent-muted)` / `var(--borderColor-accent-emphasis)`) when its corresponding query criteria exist in the active query.
- **Built-in Presets:**
  1. **Needs My Review:** `review-requested:@me is:open`
  2. **My PRs:** `author:@me is:open`
  3. **Ready to Merge:** `is:open -is:draft review:approved status:success`
  4. **Exclude Bots:** `-author:app/dependabot -author:app/renovate -author:app/github-actions`
  5. **Drafts:** `is:open draft:true`
  6. **Stale:** `is:open updated:<{30_days_ago}`

---

## 4. Query Parsing & Data Flow

### 4.1 Token Representation
Queries are parsed into structured token objects:
```typescript
export interface QueryToken {
  raw: string;
  qualifier?: string; // e.g. "is", "author", "review", "draft", "status"
  value?: string;     // e.g. "pr", "open", "@me", "approved"
  negated: boolean;   // true if prefixed with '-'
}
```

### 4.2 Query Manipulation Rules
- **Mutual Exclusivity:** Toggling `is:closed` replaces `is:open`; toggling `draft:true` removes `draft:false` or `-is:draft`.
- **Negation Handling:** Exclude bot tokens are managed as a grouped compound toggle.
- **URL Synchronization:** Submitting the query updates the native hidden form input and submits via `form.requestSubmit()` or assigns `window.location.search = '?q=' + encodeURIComponent(serializedQuery)`. This allows GitHub's native Turbo router to handle the request, preserving pagination and history.

---

## 5. Error Handling & Edge Cases

1. **Selector Fallback:** The content script queries selectors in fallback order:
   - `form[action$="/pulls"] .subnav-search`
   - `.subnav-search`
   - `input[name="q"]`'s parent form
   If not found, it logs a graceful warning without breaking native GitHub functionality.
2. **Theme Switching:** Uses CSS custom properties (`var(--bgColor-default)`, `var(--fgColor-default)`, `var(--borderColor-default)`, etc.) so theme changes (Light, Dark Default, Dark Dimmed) are applied instantly by the browser without JavaScript re-renders.
3. **Query Sanitization:** Handles empty inputs by resetting to `is:pr is:open` to avoid malformed queries.

---

## 6. Verification & Testing Plan

### 6.1 Unit Tests (Vitest)
- Query tokenizer: Parsing standard GitHub queries with whitespace, quotes, and qualifiers.
- Query serializer: Correct assembly of token lists into clean GitHub search strings.
- Conflict resolution: Ensuring mutually exclusive tokens replace each other properly.
- Chip matcher: Confirming preset chips activate/deactivate accurately based on query string.

### 6.2 End-to-End & Build Verification
- Vite build verification: Successful bundling of manifest, TypeScript content scripts, and assets into `dist/`.
- Manual verification via Chrome developer extension loader on GitHub repository PR list pages.
