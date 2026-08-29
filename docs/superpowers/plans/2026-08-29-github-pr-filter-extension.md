# GitHub PR Filter Extension Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Manifest V3 Chrome extension that replaces GitHub's native PR search input with a native Primer-styled filter bar, quick preset chips, and a visual filter dropdown.

**Architecture:** A TypeScript and Vite-based content script mounts on GitHub PR list pages (`https://github.com/*/*/pulls*`). It parses the active query string into structured tokens, provides interactive chip toggling and dropdown selection, and synchronizes submissions seamlessly with GitHub's native Turbo router and browser history.

**Tech Stack:** TypeScript, Vite, Vitest, Chrome Extension Manifest V3, GitHub Primer Design Tokens & Octicons.

## Global Constraints

- Platform: Chrome / Chromium browsers (Manifest V3).
- Host Permissions: `https://github.com/*` (PR listing pages `/*/*/pulls*`).
- Zero tokens: Operates entirely client-side without GitHub PAT or OAuth.
- Look & Feel: Must look 100% native to GitHub using GitHub Primer CSS variables and classes, supporting Light and Dark modes automatically.
- No placeholders or TBDs: Every file path, interface, and test step is fully specified.

---

### Task 1: Project Scaffolding & Build Configuration

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `public/manifest.json`

**Interfaces:**
- Consumes: Node.js / npm environment
- Produces: Runnable build pipeline (`npm run build`) outputting extension to `dist/` and test runner (`npm run test`)

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "github-pr-filter-extension",
  "version": "1.0.0",
  "description": "Native GitHub PR filter bar with quick chips and query builder",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "test": "vitest run"
  },
  "devDependencies": {
    "@types/chrome": "^0.0.306",
    "@types/node": "^22.0.0",
    "typescript": "^5.5.4",
    "vite": "^6.0.0",
    "vitest": "^3.0.0"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": ["chrome", "vitest/globals"]
  },
  "include": ["src/**/*", "tests/**/*"]
}
```

- [ ] **Step 3: Create `vite.config.ts`**

```typescript
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        content: resolve(__dirname, 'src/content.ts'),
      },
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
  test: {
    globals: true,
    environment: 'node',
  },
});
```

- [ ] **Step 4: Create `public/manifest.json`**

```json
{
  "manifest_version": 3,
  "name": "GitHub PR Filter",
  "version": "1.0.0",
  "description": "Native PR filter bar and quick chips for GitHub repository pull requests.",
  "content_scripts": [
    {
      "matches": ["https://github.com/*/*/pulls*"],
      "js": ["assets/content.js"],
      "css": ["assets/content.css"],
      "run_at": "document_end"
    }
  ]
}
```

- [ ] **Step 5: Install dependencies and verify environment**

Run: `npm install`
Expected: Dependencies installed with exit code 0.

- [ ] **Step 6: Commit**

```bash
git add package.json tsconfig.json vite.config.ts public/manifest.json package-lock.json
git commit -m "chore: scaffold extension build pipeline and manifest v3 config"
```

---

### Task 2: Query Engine (Types, Tokenizer, Serializer, Presets) with Unit Tests

**Files:**
- Create: `src/query/types.ts`
- Create: `src/query/tokenizer.ts`
- Create: `src/query/serializer.ts`
- Create: `src/query/presets.ts`
- Test: `tests/query.test.ts`

**Interfaces:**
- Consumes: Raw GitHub search strings (e.g. `is:pr is:open author:@me`)
- Produces: 
  - `parseQuery(raw: string): QueryToken[]`
  - `serializeQuery(tokens: QueryToken[]): string`
  - `togglePreset(currentQuery: string, presetId: string): string`
  - `isPresetActive(currentQuery: string, presetId: string): boolean`

- [ ] **Step 1: Write the failing unit tests in `tests/query.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import { parseQuery } from '../src/query/tokenizer';
import { serializeQuery } from '../src/query/serializer';
import { PRESETS, togglePreset, isPresetActive } from '../src/query/presets';

describe('Query Tokenizer', () => {
  it('parses empty or whitespace query to empty token array', () => {
    expect(parseQuery('')).toEqual([]);
    expect(parseQuery('   ')).toEqual([]);
  });

  it('parses qualifiers, values, and negations correctly', () => {
    const tokens = parseQuery('is:pr is:open author:@me -review:approved "free text"');
    expect(tokens).toEqual([
      { raw: 'is:pr', qualifier: 'is', value: 'pr', negated: false },
      { raw: 'is:open', qualifier: 'is', value: 'open', negated: false },
      { raw: 'author:@me', qualifier: 'author', value: '@me', negated: false },
      { raw: '-review:approved', qualifier: 'review', value: 'approved', negated: true },
      { raw: '"free text"', value: '"free text"', negated: false },
    ]);
  });
});

describe('Query Serializer', () => {
  it('serializes tokens back to clean search string', () => {
    const tokens = [
      { raw: 'is:pr', qualifier: 'is', value: 'pr', negated: false },
      { raw: 'is:open', qualifier: 'is', value: 'open', negated: false },
      { raw: 'author:@me', qualifier: 'author', value: '@me', negated: false },
    ];
    expect(serializeQuery(tokens)).toBe('is:pr is:open author:@me');
  });

  it('ensures baseline is:pr is present', () => {
    const tokens = [{ raw: 'author:@me', qualifier: 'author', value: '@me', negated: false }];
    expect(serializeQuery(tokens)).toBe('is:pr author:@me');
  });
});

describe('Presets and Toggling', () => {
  it('identifies active presets', () => {
    const query = 'is:pr is:open review-requested:@me';
    expect(isPresetActive(query, 'needs-my-review')).toBe(true);
    expect(isPresetActive(query, 'my-prs')).toBe(false);
  });

  it('adds preset tokens when toggling on', () => {
    const initial = 'is:pr is:open';
    const updated = togglePreset(initial, 'needs-my-review');
    expect(isPresetActive(updated, 'needs-my-review')).toBe(true);
    expect(updated).toContain('review-requested:@me');
  });

  it('removes preset tokens when toggling off', () => {
    const initial = 'is:pr is:open review-requested:@me';
    const updated = togglePreset(initial, 'needs-my-review');
    expect(isPresetActive(updated, 'needs-my-review')).toBe(false);
    expect(updated).not.toContain('review-requested:@me');
  });

  it('replaces mutually exclusive state (is:open vs is:closed)', () => {
    const initial = 'is:pr is:open';
    const updated = togglePreset(initial, 'drafts');
    expect(updated).toContain('draft:true');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/query.test.ts`
Expected: FAIL with "Cannot find module" errors.

- [ ] **Step 3: Implement `src/query/types.ts`**

```typescript
export interface QueryToken {
  raw: string;
  qualifier?: string;
  value?: string;
  negated: boolean;
}

export interface PresetDefinition {
  id: string;
  label: string;
  tokens: QueryToken[];
}
```

- [ ] **Step 4: Implement `src/query/tokenizer.ts`**

```typescript
import { QueryToken } from './types';

export function parseQuery(query: string): QueryToken[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  // Match qualifiers with values or quoted strings or single words
  const regex = /(-?[\w-]+:"[^"]+"|-[a-zA-Z0-9_/@.-]+:[^\s]+|[a-zA-Z0-9_/@.-]+:[^\s]+|"[^"]+"|[^\s]+)/g;
  const matches = trimmed.match(regex) || [];

  return matches.map((match) => {
    let negated = false;
    let tokenStr = match;

    if (tokenStr.startsWith('-')) {
      negated = true;
      tokenStr = tokenStr.slice(1);
    }

    const colonIndex = tokenStr.indexOf(':');
    if (colonIndex > 0) {
      const qualifier = tokenStr.slice(0, colonIndex);
      const value = tokenStr.slice(colonIndex + 1);
      return {
        raw: match,
        qualifier,
        value,
        negated,
      };
    }

    return {
      raw: match,
      value: tokenStr,
      negated,
    };
  });
}
```

- [ ] **Step 5: Implement `src/query/serializer.ts`**

```typescript
import { QueryToken } from './types';

export function serializeQuery(tokens: QueryToken[]): string {
  const hasIsPr = tokens.some((t) => t.qualifier === 'is' && t.value === 'pr' && !t.negated);
  const normalized = hasIsPr
    ? [...tokens]
    : [{ raw: 'is:pr', qualifier: 'is', value: 'pr', negated: false }, ...tokens];

  return normalized
    .map((t) => {
      if (t.qualifier && t.value !== undefined) {
        return `${t.negated ? '-' : ''}${t.qualifier}:${t.value}`;
      }
      return `${t.negated ? '-' : ''}${t.value || t.raw}`;
    })
    .join(' ');
}
```

- [ ] **Step 6: Implement `src/query/presets.ts`**

```typescript
import { PresetDefinition, QueryToken } from './types';
import { parseQuery } from './tokenizer';
import { serializeQuery } from './serializer';

export const PRESETS: PresetDefinition[] = [
  {
    id: 'needs-my-review',
    label: 'Needs My Review',
    tokens: [
      { raw: 'is:open', qualifier: 'is', value: 'open', negated: false },
      { raw: 'review-requested:@me', qualifier: 'review-requested', value: '@me', negated: false },
    ],
  },
  {
    id: 'my-prs',
    label: 'Created by Me',
    tokens: [
      { raw: 'is:open', qualifier: 'is', value: 'open', negated: false },
      { raw: 'author:@me', qualifier: 'author', value: '@me', negated: false },
    ],
  },
  {
    id: 'ready-to-merge',
    label: 'Ready to Merge',
    tokens: [
      { raw: 'is:open', qualifier: 'is', value: 'open', negated: false },
      { raw: '-is:draft', qualifier: 'is', value: 'draft', negated: true },
      { raw: 'review:approved', qualifier: 'review', value: 'approved', negated: false },
      { raw: 'status:success', qualifier: 'status', value: 'success', negated: false },
    ],
  },
  {
    id: 'no-bots',
    label: 'Exclude Bots',
    tokens: [
      { raw: '-author:app/dependabot', qualifier: 'author', value: 'app/dependabot', negated: true },
      { raw: '-author:app/renovate', qualifier: 'author', value: 'app/renovate', negated: true },
      { raw: '-author:app/github-actions', qualifier: 'author', value: 'app/github-actions', negated: true },
    ],
  },
  {
    id: 'drafts',
    label: 'Drafts',
    tokens: [
      { raw: 'is:open', qualifier: 'is', value: 'open', negated: false },
      { raw: 'draft:true', qualifier: 'draft', value: 'true', negated: false },
    ],
  },
];

function tokenMatches(a: QueryToken, b: QueryToken): boolean {
  if (a.qualifier !== b.qualifier) return false;
  if (a.value !== b.value) return false;
  if (a.negated !== b.negated) return false;
  return true;
}

export function isPresetActive(queryStr: string, presetId: string): boolean {
  const preset = PRESETS.find((p) => p.id === presetId);
  if (!preset) return false;

  const currentTokens = parseQuery(queryStr);
  return preset.tokens.every((pToken) =>
    currentTokens.some((cToken) => tokenMatches(cToken, pToken))
  );
}

export function togglePreset(queryStr: string, presetId: string): string {
  const preset = PRESETS.find((p) => p.id === presetId);
  if (!preset) return queryStr;

  const currentTokens = parseQuery(queryStr);
  const active = isPresetActive(queryStr, presetId);

  if (active) {
    // Remove preset tokens
    const filtered = currentTokens.filter(
      (c) => !preset.tokens.some((p) => tokenMatches(c, p))
    );
    return serializeQuery(filtered);
  } else {
    // Handle mutual exclusions
    let updated = [...currentTokens];
    for (const pToken of preset.tokens) {
      if (pToken.qualifier === 'draft' && pToken.value === 'true') {
        updated = updated.filter((t) => !(t.qualifier === 'is' && t.value === 'draft' && t.negated));
      }
      if (!updated.some((c) => tokenMatches(c, pToken))) {
        updated.push(pToken);
      }
    }
    return serializeQuery(updated);
  }
}
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `npx vitest run tests/query.test.ts`
Expected: All tests pass with exit code 0.

- [ ] **Step 8: Commit**

```bash
git add src/query/ tests/query.test.ts
git commit -m "feat(query): implement query tokenizer, serializer, and preset manager with tests"
```

---

### Task 3: UI Components & Native Primer Styling

**Files:**
- Create: `src/ui/icons.ts`
- Create: `src/ui/styles.css`
- Create: `src/ui/filterBar.ts`

**Interfaces:**
- Consumes: `parseQuery`, `serializeQuery`, `PRESETS`, `togglePreset`, `isPresetActive`
- Produces: `renderFilterBar(initialQuery: string, onApply: (query: string) => void): HTMLElement`

- [ ] **Step 1: Create `src/ui/icons.ts` with GitHub Octicons SVGs**

```typescript
export const ICONS = {
  search: `<svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" class="octicon octicon-search" fill="currentColor"><path d="M10.68 11.74a6 6 0 0 1-7.922-8.982 6 6 0 0 1 8.982 7.922l3.04 3.04a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215ZM11.5 7a4.499 4.499 0 1 0-8.997 0A4.499 4.499 0 0 0 11.5 7Z"></path></svg>`,
  x: `<svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" class="octicon octicon-x" fill="currentColor"><path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z"></path></svg>`,
  filter: `<svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" class="octicon octicon-filter" fill="currentColor"><path d="M0 2.75C0 2.06.56 1.5 1.25 1.5h13.5c.69 0 1.25.56 1.25 1.25v1.69c0 .33-.13.65-.37.88L10 9.94v4.31c0 .41-.34.75-.75.75a.75.75 0 0 1-.44-.14l-2.5-1.88a.75.75 0 0 1-.31-.61V9.94L.37 5.32A1.24 1.24 0 0 1 0 4.44V2.75Zm1.5.25v1.44l5.44 5.06a.75.75 0 0 1 .25.55v3.13l1.5 1.12V10c0-.2.08-.39.25-.55l5.44-5.06V3H1.5Z"></path></svg>`,
  check: `<svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" class="octicon octicon-check" fill="currentColor"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"></path></svg>`,
  chevronDown: `<svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" class="octicon octicon-triangle-down" fill="currentColor"><path d="m4.427 7.427 3.396 3.396a.25.25 0 0 0 .354 0l3.396-3.396A.25.25 0 0 0 11.396 7H4.604a.25.25 0 0 0-.177.427Z"></path></svg>`
};
```

- [ ] **Step 2: Create `src/ui/styles.css` using GitHub's native Primer CSS tokens**

```css
.gh-pr-filter-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  margin-bottom: 16px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif;
}

.gh-pr-filter-top-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  position: relative;
}

.gh-pr-filter-input-wrapper {
  display: flex;
  align-items: center;
  flex: 1;
  position: relative;
  border: 1px solid var(--borderColor-default, #d0d7de);
  border-radius: 6px;
  background-color: var(--bgColor-default, #ffffff);
  box-shadow: var(--shadow-resting-xsmall, inset 0 1px 0 rgba(208, 215, 222, 0.2));
  transition: border-color 0.2s cubic-bezier(0.3, 0, 0.5, 1), box-shadow 0.2s cubic-bezier(0.3, 0, 0.5, 1);
}

.gh-pr-filter-input-wrapper:focus-within {
  border-color: var(--fgColor-accent, #0969da);
  box-shadow: inset 0 0 0 1px var(--fgColor-accent, #0969da);
}

.gh-pr-filter-icon {
  display: flex;
  align-items: center;
  padding-left: 10px;
  color: var(--fgColor-muted, #656d76);
}

.gh-pr-filter-input {
  flex: 1;
  padding: 5px 12px;
  font-size: 14px;
  line-height: 20px;
  border: none;
  background: transparent;
  color: var(--fgColor-default, #1f2328);
  outline: none;
}

.gh-pr-filter-clear-btn {
  display: flex;
  align-items: center;
  padding: 4px 8px;
  border: none;
  background: transparent;
  color: var(--fgColor-muted, #656d76);
  cursor: pointer;
  border-radius: 4px;
}

.gh-pr-filter-clear-btn:hover {
  color: var(--fgColor-danger, #d1242f);
}

.gh-pr-filter-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 12px;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  white-space: nowrap;
  vertical-align: middle;
  cursor: pointer;
  user-select: none;
  border: 1px solid var(--borderColor-default, #d0d7de);
  border-radius: 6px;
  color: var(--fgColor-default, #1f2328);
  background-color: var(--bgColor-muted, #f6f8fa);
  transition: 80ms cubic-bezier(0.65, 0, 0.35, 1);
}

.gh-pr-filter-btn:hover {
  background-color: var(--bgColor-neutral-muted, #eaeef2);
  border-color: var(--borderColor-muted, #afb8c1);
}

.gh-pr-filter-btn-primary {
  color: #ffffff;
  background-color: var(--bgColor-success-emphasis, #1f883d);
  border-color: var(--borderColor-success-emphasis, rgba(31, 35, 40, 0.15));
}

.gh-pr-filter-btn-primary:hover {
  background-color: #1a7f37;
}

/* Chip Strip */
.gh-pr-filter-chips {
  display: flex;
  align-items: center;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 2px;
  scrollbar-width: thin;
}

.gh-pr-chip {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  font-size: 12px;
  font-weight: 500;
  line-height: 20px;
  border-radius: 100px;
  border: 1px solid var(--borderColor-default, #d0d7de);
  background-color: var(--bgColor-default, #ffffff);
  color: var(--fgColor-default, #1f2328);
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.gh-pr-chip:hover {
  background-color: var(--bgColor-muted, #f6f8fa);
}

.gh-pr-chip.active {
  background-color: var(--bgColor-accent-muted, #ddf4ff);
  border-color: var(--borderColor-accent-emphasis, #0969da);
  color: var(--fgColor-accent, #0969da);
  font-weight: 600;
}

/* Popover Menu */
.gh-pr-popover {
  position: absolute;
  top: 100%;
  right: 68px;
  margin-top: 4px;
  width: 280px;
  background-color: var(--bgColor-default, #ffffff);
  border: 1px solid var(--borderColor-default, #d0d7de);
  border-radius: 8px;
  box-shadow: var(--shadow-floating-large, 0 8px 24px rgba(140, 149, 159, 0.2));
  z-index: 100;
  display: none;
  flex-direction: column;
}

.gh-pr-popover.open {
  display: flex;
}

.gh-pr-popover-header {
  padding: 8px 12px;
  font-weight: 600;
  font-size: 12px;
  color: var(--fgColor-muted, #656d76);
  border-bottom: 1px solid var(--borderColor-muted, #d8dee4);
}

.gh-pr-popover-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  font-size: 13px;
  cursor: pointer;
  color: var(--fgColor-default, #1f2328);
  border-bottom: 1px solid var(--borderColor-subtle, #f0f2f5);
}

.gh-pr-popover-item:hover {
  background-color: var(--bgColor-muted, #f6f8fa);
}
```

- [ ] **Step 3: Implement `src/ui/filterBar.ts`**

```typescript
import { ICONS } from './icons';
import { PRESETS, togglePreset, isPresetActive } from '../query/presets';

export interface FilterBarOptions {
  initialQuery: string;
  onApply: (query: string) => void;
}

export function renderFilterBar(options: FilterBarOptions): HTMLElement {
  let currentQuery = options.initialQuery || 'is:pr is:open';

  const container = document.createElement('div');
  container.className = 'gh-pr-filter-container';

  // --- Top Bar ---
  const topBar = document.createElement('div');
  topBar.className = 'gh-pr-filter-top-bar';

  const inputWrapper = document.createElement('div');
  inputWrapper.className = 'gh-pr-filter-input-wrapper';

  const iconSpan = document.createElement('span');
  iconSpan.className = 'gh-pr-filter-icon';
  iconSpan.innerHTML = ICONS.search;

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'gh-pr-filter-input';
  input.placeholder = 'Filter pull requests...';
  input.value = currentQuery;

  const clearBtn = document.createElement('button');
  clearBtn.type = 'button';
  clearBtn.className = 'gh-pr-filter-clear-btn';
  clearBtn.title = 'Clear search';
  clearBtn.innerHTML = ICONS.x;

  inputWrapper.appendChild(iconSpan);
  inputWrapper.appendChild(input);
  inputWrapper.appendChild(clearBtn);

  // Filters Popover Button
  const filterBtn = document.createElement('button');
  filterBtn.type = 'button';
  filterBtn.className = 'gh-pr-filter-btn';
  filterBtn.innerHTML = `${ICONS.filter} Filters ${ICONS.chevronDown}`;

  // Popover Menu
  const popover = document.createElement('div');
  popover.className = 'gh-pr-popover';
  popover.innerHTML = `
    <div class="gh-pr-popover-header">Quick Criteria</div>
    <div class="gh-pr-popover-item" data-token="is:open">Open PRs</div>
    <div class="gh-pr-popover-item" data-token="is:closed">Closed PRs</div>
    <div class="gh-pr-popover-item" data-token="review:approved">Approved</div>
    <div class="gh-pr-popover-item" data-token="review:changes_requested">Changes Requested</div>
    <div class="gh-pr-popover-item" data-token="status:success">Passing CI</div>
  `;

  // Apply Button
  const applyBtn = document.createElement('button');
  applyBtn.type = 'button';
  applyBtn.className = 'gh-pr-filter-btn gh-pr-filter-btn-primary';
  applyBtn.innerText = 'Apply';

  topBar.appendChild(inputWrapper);
  topBar.appendChild(filterBtn);
  topBar.appendChild(applyBtn);
  topBar.appendChild(popover);

  // --- Bottom Chip Row ---
  const chipStrip = document.createElement('div');
  chipStrip.className = 'gh-pr-filter-chips';

  function updateChips() {
    chipStrip.innerHTML = '';
    PRESETS.forEach((preset) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'gh-pr-chip' + (isPresetActive(currentQuery, preset.id) ? ' active' : '');
      chip.innerText = preset.label;
      chip.addEventListener('click', () => {
        currentQuery = togglePreset(currentQuery, preset.id);
        input.value = currentQuery;
        updateChips();
        options.onApply(currentQuery);
      });
      chipStrip.appendChild(chip);
    });
  }

  updateChips();

  // Event Listeners
  clearBtn.addEventListener('click', () => {
    currentQuery = 'is:pr is:open';
    input.value = currentQuery;
    updateChips();
    options.onApply(currentQuery);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      currentQuery = input.value;
      options.onApply(currentQuery);
    }
  });

  input.addEventListener('input', () => {
    currentQuery = input.value;
    updateChips();
  });

  filterBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    popover.classList.toggle('open');
  });

  document.addEventListener('click', (e) => {
    if (!popover.contains(e.target as Node) && e.target !== filterBtn) {
      popover.classList.remove('open');
    }
  });

  popover.querySelectorAll<HTMLElement>('.gh-pr-popover-item').forEach((item) => {
    item.addEventListener('click', () => {
      const token = item.getAttribute('data-token');
      if (token) {
        if (!currentQuery.includes(token)) {
          currentQuery = `${currentQuery.trim()} ${token}`;
        }
        input.value = currentQuery;
        popover.classList.remove('open');
        updateChips();
        options.onApply(currentQuery);
      }
    });
  });

  applyBtn.addEventListener('click', () => {
    options.onApply(input.value);
  });

  container.appendChild(topBar);
  container.appendChild(chipStrip);

  return container;
}
```

- [ ] **Step 4: Commit**

```bash
git add src/ui/
git commit -m "feat(ui): create native Primer-styled filter bar, preset chips, and popover"
```

---

### Task 4: Content Script Entrypoint & GitHub Turbo Lifecycle Controller

**Files:**
- Create: `src/content.ts`

**Interfaces:**
- Consumes: `renderFilterBar`, `src/ui/styles.css`
- Produces: Injected and mounted extension component on `github.com/*/*/pulls*`

- [ ] **Step 1: Implement `src/content.ts`**

```typescript
import './ui/styles.css';
import { renderFilterBar } from './ui/filterBar';

const MOUNTED_ATTR = 'data-gh-pr-filter-mounted';

function isPullRequestsPage(): boolean {
  return /^\/[^/]+\/[^/]+\/pulls(\/.*)?$/.test(window.location.pathname);
}

function getQueryFromURL(): string {
  const params = new URLSearchParams(window.location.search);
  return params.get('q') || 'is:pr is:open';
}

function applyQuery(query: string) {
  const currentParams = new URLSearchParams(window.location.search);
  currentParams.set('q', query);
  const newUrl = `${window.location.pathname}?${currentParams.toString()}`;

  // Find native GitHub form if available and submit via Turbo
  const nativeInput = document.querySelector<HTMLInputElement>('input[name="q"]');
  const nativeForm = nativeInput?.closest('form');

  if (nativeInput && nativeForm) {
    nativeInput.value = query;
    if (typeof nativeForm.requestSubmit === 'function') {
      nativeForm.requestSubmit();
      return;
    }
  }

  // Fallback to window.location navigation
  window.location.href = newUrl;
}

function mount() {
  if (!isPullRequestsPage()) return;

  // Target GitHub subnav search container
  const target = document.querySelector<HTMLElement>('.subnav-search, form[action$="/pulls"], [data-target="search-input.input"]');
  if (!target) return;

  const parentContainer = target.parentElement;
  if (!parentContainer) return;

  // Check for existing mount
  if (parentContainer.querySelector(`[${MOUNTED_ATTR}]`)) {
    return;
  }

  const query = getQueryFromURL();
  const filterBar = renderFilterBar({
    initialQuery: query,
    onApply: applyQuery,
  });

  filterBar.setAttribute(MOUNTED_ATTR, 'true');

  // Hide or replace the native input container
  target.style.display = 'none';
  parentContainer.insertBefore(filterBar, target);
}

// Initial mount
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount);
} else {
  mount();
}

// GitHub Turbo lifecycle listeners
document.addEventListener('turbo:render', mount);
document.addEventListener('turbo:load', mount);
window.addEventListener('popstate', mount);
```

- [ ] **Step 2: Commit**

```bash
git add src/content.ts
git commit -m "feat(content): integrate injection controller with GitHub Turbo lifecycle"
```

---

### Task 5: End-to-End Build & Verification

**Files:**
- Output: `dist/`

**Interfaces:**
- Consumes: All source files
- Produces: Complete unpacked Chrome Extension in `dist/` ready to load in `chrome://extensions`

- [ ] **Step 1: Run unit tests**

Run: `npm run test`
Expected: All tests pass.

- [ ] **Step 2: Run Vite build**

Run: `npm run build`
Expected: Builds without errors; `dist/manifest.json`, `dist/assets/content.js`, and `dist/assets/content.css` are created.

- [ ] **Step 3: Verify extension structure**

Verify:
- `dist/manifest.json` exists.
- `dist/assets/content.js` exists.
- `dist/assets/content.css` exists.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "build: verify complete extension bundle"
```
