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
