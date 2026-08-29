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
  const target = document.querySelector<HTMLElement>(
    '.subnav-search, form[action$="/pulls"], [data-target="search-input.input"]'
  );
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

  // Hide the native input container and insert the custom filter component
  target.style.display = 'none';
  parentContainer.insertBefore(filterBar, target);
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
