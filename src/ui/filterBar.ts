import { ICONS } from './icons';
import { PRESETS, togglePreset, isPresetActive } from '../query/presets';
import { parseQuery } from '../query/tokenizer';
import { serializeQuery } from '../query/serializer';

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

  const filterOptions = [
    { section: 'Status & State' },
    { label: 'Open PRs', token: 'is:open', removeToken: 'is:closed' },
    { label: 'Closed PRs', token: 'is:closed', removeToken: 'is:open' },
    { label: 'Draft PRs', token: 'draft:true' },
    { section: 'Reviews' },
    { label: 'Approved', token: 'review:approved' },
    { label: 'Changes Requested', token: 'review:changes_requested' },
    { label: 'Review Required', token: 'review:required' },
    { label: 'Reviewed by Me', token: 'reviewed-by:@me' },
    { section: 'CI & Checks' },
    { label: 'Checks Passed', token: 'status:success' },
    { label: 'Checks Failed', token: 'status:failure' },
    { label: 'Checks Pending', token: 'status:pending' },
  ];

  function renderPopoverItems() {
    popover.innerHTML = '';
    filterOptions.forEach((item) => {
      if (item.section) {
        const header = document.createElement('div');
        header.className = 'gh-pr-popover-header';
        header.innerText = item.section;
        popover.appendChild(header);
      } else if (item.token) {
        const row = document.createElement('div');
        row.className = 'gh-pr-popover-item';
        const isActive = currentQuery.includes(item.token);

        row.innerHTML = `
          <span>${item.label}</span>
          ${isActive ? `<span style="color: var(--fgColor-accent, #0969da);">${ICONS.check}</span>` : ''}
        `;

        row.addEventListener('click', (e) => {
          e.stopPropagation();
          const tokens = parseQuery(currentQuery);
          if (isActive) {
            // Remove token
            const filtered = tokens.filter((t) => t.raw !== item.token);
            currentQuery = serializeQuery(filtered);
          } else {
            // Remove conflicting token if specified
            let updated = item.removeToken
              ? tokens.filter((t) => t.raw !== item.removeToken)
              : tokens;
            const newTokens = parseQuery(item.token);
            updated = [...updated, ...newTokens];
            currentQuery = serializeQuery(updated);
          }
          input.value = currentQuery;
          updateChips();
          renderPopoverItems();
          options.onApply(currentQuery);
        });

        popover.appendChild(row);
      }
    });
  }

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
        renderPopoverItems();
        options.onApply(currentQuery);
      });
      chipStrip.appendChild(chip);
    });
  }

  updateChips();
  renderPopoverItems();

  // Clear Event
  clearBtn.addEventListener('click', () => {
    currentQuery = 'is:pr is:open';
    input.value = currentQuery;
    updateChips();
    renderPopoverItems();
    options.onApply(currentQuery);
  });

  // Enter to submit
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

  // Popover toggle
  filterBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    renderPopoverItems();
    popover.classList.toggle('open');
  });

  document.addEventListener('click', (e) => {
    if (!popover.contains(e.target as Node) && e.target !== filterBtn) {
      popover.classList.remove('open');
    }
  });

  applyBtn.addEventListener('click', () => {
    options.onApply(input.value);
  });

  container.appendChild(topBar);
  container.appendChild(chipStrip);

  return container;
}
