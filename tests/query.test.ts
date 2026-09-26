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

  it('recognizes state:open synonymously with is:open for presets', () => {
    const query = 'is:pr state:open review-requested:@me';
    expect(isPresetActive(query, 'needs-my-review')).toBe(true);
    const myPrsQuery = 'is:pr state:open author:@me';
    expect(isPresetActive(myPrsQuery, 'my-prs')).toBe(true);
  });

  it('correctly toggles ready-to-merge multi-token preset', () => {
    const initial = 'is:pr is:open';
    const active = togglePreset(initial, 'ready-to-merge');
    expect(isPresetActive(active, 'ready-to-merge')).toBe(true);
    expect(active).toContain('review:approved');
    expect(active).toContain('status:success');
    expect(active).toContain('-is:draft');

    const toggledOff = togglePreset(active, 'ready-to-merge');
    expect(isPresetActive(toggledOff, 'ready-to-merge')).toBe(false);
    expect(toggledOff).not.toContain('review:approved');
    expect(toggledOff).not.toContain('status:success');
  });

  it('correctly toggles exclude-bots negative qualifiers', () => {
    const initial = 'is:pr is:open';
    const active = togglePreset(initial, 'no-bots');
    expect(isPresetActive(active, 'no-bots')).toBe(true);
    expect(active).toContain('-author:app/dependabot');

    const toggledOff = togglePreset(active, 'no-bots');
    expect(isPresetActive(toggledOff, 'no-bots')).toBe(false);
    expect(toggledOff).not.toContain('-author:app/dependabot');
  });

  it('preserves other active presets when deselecting one preset', () => {
    // 1. Activate Needs My Review
    let query = togglePreset('is:pr is:open', 'needs-my-review');
    expect(isPresetActive(query, 'needs-my-review')).toBe(true);

    // 2. Activate Exclude Bots alongside it
    query = togglePreset(query, 'no-bots');
    expect(isPresetActive(query, 'needs-my-review')).toBe(true);
    expect(isPresetActive(query, 'no-bots')).toBe(true);

    // 3. Deselect Needs My Review
    query = togglePreset(query, 'needs-my-review');
    // Needs My Review is now off, but Exclude Bots MUST remain active!
    expect(isPresetActive(query, 'needs-my-review')).toBe(false);
    expect(isPresetActive(query, 'no-bots')).toBe(true);
    expect(query).toContain('is:open');
    expect(query).toContain('-author:app/dependabot');
    expect(query).not.toContain('review-requested:@me');
  });

  it('preserves Drafts preset when deselecting Needs My Review', () => {
    let query = 'is:pr is:open';
    query = togglePreset(query, 'needs-my-review');
    query = togglePreset(query, 'drafts');

    expect(isPresetActive(query, 'needs-my-review')).toBe(true);
    expect(isPresetActive(query, 'drafts')).toBe(true);

    // Deselect Needs My Review
    query = togglePreset(query, 'needs-my-review');
    expect(isPresetActive(query, 'needs-my-review')).toBe(false);
    expect(isPresetActive(query, 'drafts')).toBe(true);
    expect(query).toContain('draft:true');
    expect(query).toContain('is:open');
  });
});
