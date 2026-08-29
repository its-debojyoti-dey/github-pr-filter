import { QueryToken } from './types';

export function parseQuery(query: string): QueryToken[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  // Match qualifiers with values or quoted strings or single words
  const regex = /(-?[\w-]+:"[^"]+"|-[a-zA-Z0-9_/@.-]+:[^\s]+|[a-zA-Z0-9_/@.-]+:[^\s]+|"[^"]+"|[^\s]+)/g;
  const matches = trimmed.match(regex) || [];

  return matches.map((match) => {
    let negated = false;
    let tokenStr = match;

    if (tokenStr.startsWith('-')) {
      negated = true;
      tokenStr = tokenStr.slice(1);
    }

    const colonIndex = tokenStr.indexOf(':');
    if (colonIndex > 0) {
      const qualifier = tokenStr.slice(0, colonIndex);
      const value = tokenStr.slice(colonIndex + 1);
      return {
        raw: match,
        qualifier,
        value,
        negated,
      };
    }

    return {
      raw: match,
      value: tokenStr,
      negated,
    };
  });
}
