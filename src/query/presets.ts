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
  const qA = a.qualifier === 'state' ? 'is' : a.qualifier;
  const qB = b.qualifier === 'state' ? 'is' : b.qualifier;
  if (qA !== qB) return false;
  if (a.value !== b.value) return false;
  if (a.negated !== b.negated) return false;
  return true;
}

export function isPresetActive(
  queryStr: string,
  presetOrId: string | PresetDefinition,
  allPresets: PresetDefinition[] = PRESETS
): boolean {
  const preset = typeof presetOrId === 'string'
    ? allPresets.find((p) => p.id === presetOrId)
    : presetOrId;
  if (!preset) return false;

  const currentTokens = parseQuery(queryStr);
  if (preset.tokens.length === 0) return false;
  return preset.tokens.every((pToken) =>
    currentTokens.some((cToken) => tokenMatches(cToken, pToken))
  );
}

function isBaselineToken(token: QueryToken): boolean {
  const q = token.qualifier === 'state' ? 'is' : token.qualifier;
  if (!q) return false;
  return q === 'is' && (token.value === 'pr' || token.value === 'open');
}

export function togglePreset(
  queryStr: string,
  presetOrId: string | PresetDefinition,
  allPresets: PresetDefinition[] = PRESETS
): string {
  const preset = typeof presetOrId === 'string'
    ? allPresets.find((p) => p.id === presetOrId)
    : presetOrId;
  if (!preset) return queryStr;

  const currentTokens = parseQuery(queryStr);
  const active = isPresetActive(queryStr, preset, allPresets);

  if (active) {
    // Only remove distinguishing non-baseline tokens so other presets & state are preserved
    const specificTokens = preset.tokens.filter((p) => !isBaselineToken(p));
    const tokensToRemove = specificTokens.length > 0 ? specificTokens : preset.tokens;

    const filtered = currentTokens.filter(
      (c) => !tokensToRemove.some((p) => tokenMatches(c, p))
    );

    // Ensure baseline is:open is preserved if neither is:open nor is:closed is present
    const hasState = filtered.some((t) => {
      const q = t.qualifier === 'state' ? 'is' : t.qualifier;
      return q === 'is' && (t.value === 'open' || t.value === 'closed');
    });

    if (!hasState) {
      filtered.push({ raw: 'is:open', qualifier: 'is', value: 'open', negated: false });
    }

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
