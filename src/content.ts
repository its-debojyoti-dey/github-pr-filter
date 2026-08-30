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

  const query = getQueryFromURL();
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
    const urlQuery = getQueryFromURL();
    if (input.value !== urlQuery) {
      input.value = urlQuery;
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

