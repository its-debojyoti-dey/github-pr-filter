import './ui/styles.css';
import { renderFilterBar } from './ui/filterBar';

const MOUNTED_ATTR = 'data-gh-pr-filter-mounted';

function isPullRequestsPage(): boolean {
  return /^\/[^/]+\/[^/]+\/pulls(\/.*)?$/.test(window.location.pathname);
}

function getBasePullsPath(): string {
  const match = window.location.pathname.match(/^(\/[^/]+\/[^/]+\/pulls)/);
  return match ? match[1] : window.location.pathname;
}

function getCurrentQuery(): string {
  // 1. Check URL query parameter ?q=...
  const params = new URLSearchParams(window.location.search);
  const qParam = params.get('q');
  if (qParam && qParam.trim()) {
    return qParam.trim();
  }

  // 2. Check native GitHub search input value (populated for path shortcuts like /pulls/review-requested/@me or /pulls/@me)
  const nativeInput = document.querySelector<HTMLInputElement>(
    'input#js-issues-search, form.subnav-search input[name="q"], input[name="q"]'
  );
  if (nativeInput && nativeInput.value && nativeInput.value.trim()) {
    return nativeInput.value.trim();
  }

  // 3. Fallback to path shortcuts if native input is not yet populated
  const pathname = window.location.pathname;
  if (pathname.includes('/pulls/review-requested/@me')) {
    return 'is:open is:pr review-requested:@me';
  }
  if (pathname.endsWith('/pulls/@me') || pathname.includes('/pulls/created_by/@me')) {
    return 'is:open is:pr author:@me';
  }
  if (pathname.includes('/pulls/mentioned/@me')) {
    return 'is:open is:pr mentions:@me';
  }

  return 'is:pr is:open';
}

function applyQuery(query: string) {
  const basePath = getBasePullsPath();
  const searchParams = new URLSearchParams();
  searchParams.set('q', query);
  const targetUrl = `${basePath}?${searchParams.toString()}`;

  // Find native GitHub form if available and submit via Turbo
  const nativeInput = document.querySelector<HTMLInputElement>(
    'input#js-issues-search, form.subnav-search input[name="q"], input[name="q"]'
  );
  const nativeForm = nativeInput?.closest('form');

  if (nativeInput && nativeForm) {
    nativeForm.action = basePath;
    nativeInput.value = query;
    if (typeof nativeForm.requestSubmit === 'function') {
      nativeForm.requestSubmit();
      return;
    }
  }

  // Fallback to window.location navigation
  window.location.href = targetUrl;
}

function findTarget(): HTMLElement | null {
  const formOrSubnav = document.querySelector<HTMLElement>(
    '.subnav-search, form[action$="/pulls"], [data-target="search-input.input"]'
  );
  if (formOrSubnav) return formOrSubnav;

  // Fallback: locate native issues search input and find its parent form or wrapper
  const searchInput = document.querySelector<HTMLInputElement>('input#js-issues-search, input[name="q"]');
  if (searchInput) {
    return searchInput.closest('form') || searchInput.parentElement;
  }

  return null;
}

function hideNativeElements(parent: HTMLElement, target?: HTMLElement) {
  if (target) {
    target.style.setProperty('display', 'none', 'important');
  }
  parent.querySelectorAll<HTMLElement>('.subnav-search-context, [data-target="subnav-search-context"], details.details-reset').forEach((d) => {
    if (d.querySelector('summary')?.textContent?.trim().startsWith('Filters') || d.classList.contains('subnav-search-context')) {
      d.style.setProperty('display', 'none', 'important');
    }
  });
  parent.querySelectorAll<HTMLElement>('form.subnav-search, form[action$="/pulls"]').forEach((f) => {
    f.style.setProperty('display', 'none', 'important');
  });

  // Fix Labels and Milestones button stretching vertically
  parent.style.setProperty('align-items', 'flex-start', 'important');
  const sibling = parent.querySelector<HTMLElement>('.ml-2.pl-2, [data-target="labels-milestones"]');
  if (sibling) {
    sibling.style.setProperty('align-self', 'flex-start', 'important');
  }

  // Fix New pull request button alignment to top row
  const rowContainer = parent.closest<HTMLElement>('.d-flex.flex-justify-between, .flex-items-end');
  if (rowContainer) {
    rowContainer.style.setProperty('align-items', 'flex-start', 'important');
    rowContainer.querySelectorAll<HTMLElement>('.ml-2.d-flex, .d-flex.ml-auto, a[href$="/pulls/new"], a[href*="/compare"]').forEach((el) => {
      el.style.setProperty('align-self', 'flex-start', 'important');
    });
  }
}

function mount() {
  if (!isPullRequestsPage()) return;

  const target = findTarget();
  if (!target) return;

  const parentContainer = target.parentElement;
  if (!parentContainer) return;

  hideNativeElements(parentContainer, target);

  // If already mounted, do NOT touch input.value or reset user input
  const existing = parentContainer.querySelector<HTMLElement>(`[${MOUNTED_ATTR}]`);
  if (existing) {
    return;
  }

  const query = getCurrentQuery();
  const filterBar = renderFilterBar({
    initialQuery: query,
    onApply: applyQuery,
  });

  filterBar.setAttribute(MOUNTED_ATTR, 'true');
  parentContainer.insertBefore(filterBar, target);
  console.log('[GitHub PR Filter] Filter bar mounted successfully.');
}

function onUrlNavigation() {
  if (!isPullRequestsPage()) return;
  mount();
  const existing = document.querySelector<HTMLElement>(`[${MOUNTED_ATTR}]`);
  if (!existing) return;
  const input = existing.querySelector<HTMLInputElement>('.gh-pr-filter-input');
  // Only sync from URL if user is not actively typing in the input
  if (input && document.activeElement !== input) {
    const currentQ = getCurrentQuery();
    if (input.value.trim() !== currentQ.trim()) {
      input.value = currentQ;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }
}

// Initial mount
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount);
} else {
  mount();
}

// GitHub Turbo / PJAX lifecycle listeners
document.addEventListener('turbo:render', mount);
document.addEventListener('turbo:load', onUrlNavigation);
window.addEventListener('popstate', onUrlNavigation);

// MutationObserver ONLY ensures the component is mounted if React/Turbo swaps the DOM
let observerDebounceTimer: number | null = null;
const observer = new MutationObserver(() => {
  if (!isPullRequestsPage()) return;
  if (observerDebounceTimer !== null) {
    window.clearTimeout(observerDebounceTimer);
  }
  observerDebounceTimer = window.setTimeout(() => {
    mount();
  }, 50);
});

observer.observe(document.documentElement, {
  childList: true,
  subtree: true,
});

