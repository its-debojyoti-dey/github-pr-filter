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

function mount() {
  if (!isPullRequestsPage()) return;

  const target = findTarget();
  if (!target) return;

  const parentContainer = target.parentElement;
  if (!parentContainer) return;

  const existing = parentContainer.querySelector<HTMLElement>(`[${MOUNTED_ATTR}]`);
  if (existing) {
    // If already mounted, ensure query in input matches current URL query
    const urlQuery = getQueryFromURL();
    const input = existing.querySelector<HTMLInputElement>('.gh-pr-filter-input');
    if (input && input.value !== urlQuery) {
      input.value = urlQuery;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
    return;
  }

  const query = getQueryFromURL();
  const filterBar = renderFilterBar({
    initialQuery: query,
    onApply: applyQuery,
  });

  filterBar.setAttribute(MOUNTED_ATTR, 'true');

  // Hide the native input container and insert the custom filter component
  target.style.display = 'none';
  parentContainer.insertBefore(filterBar, target);
  console.log('[GitHub PR Filter] Filter bar mounted successfully.');
}

// Initial mount
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount);
} else {
  mount();
}

// GitHub Turbo / PJAX lifecycle listeners
document.addEventListener('turbo:render', mount);
document.addEventListener('turbo:load', mount);
window.addEventListener('popstate', mount);

// MutationObserver to catch asynchronous React/Turbo hydration
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

