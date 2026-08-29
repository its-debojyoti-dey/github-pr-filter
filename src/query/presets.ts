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
