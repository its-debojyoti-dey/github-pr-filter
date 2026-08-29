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
