import { PresetDefinition } from '../query/types';
import { parseQuery } from '../query/tokenizer';

const STORAGE_KEY = 'gh_pr_filter_custom_presets';

interface StoredPreset {
  id: string;
  label: string;
  query: string;
  createdAt: number;
}

function hasChromeStorage(): boolean {
  return typeof chrome !== 'undefined' && !!chrome.storage?.local;
}

export async function getCustomPresets(): Promise<PresetDefinition[]> {
  try {
    const rawList = await getRawStoredPresets();
    return rawList.map((p) => ({
      id: p.id,
      label: p.label,
      rawQuery: p.query,
      tokens: parseQuery(p.query),
      isCustom: true,
    }));
  } catch (err) {
    console.warn('[GitHub PR Filter] Failed to load custom presets:', err);
    return [];
  }
}

export async function saveCustomPreset(label: string, queryStr: string): Promise<PresetDefinition> {
  const cleanLabel = label.trim() || 'Custom Filter';
  const cleanQuery = queryStr.trim();
  const id = `custom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  const newStored: StoredPreset = {
    id,
    label: cleanLabel,
    query: cleanQuery,
    createdAt: Date.now(),
  };

  const existing = await getRawStoredPresets();
  const updated = [...existing, newStored];

  await persistStoredPresets(updated);

  return {
    id: newStored.id,
    label: newStored.label,
    rawQuery: newStored.query,
    tokens: parseQuery(newStored.query),
    isCustom: true,
  };
}

export async function deleteCustomPreset(id: string): Promise<void> {
  const existing = await getRawStoredPresets();
  const filtered = existing.filter((p) => p.id !== id);
  await persistStoredPresets(filtered);
}

export async function clearCustomPresets(): Promise<void> {
  await persistStoredPresets([]);
}

let memoryFallback: StoredPreset[] = [];

async function getRawStoredPresets(): Promise<StoredPreset[]> {
  try {
    if (hasChromeStorage()) {
      const result = await chrome.storage.local.get(STORAGE_KEY);
      return result[STORAGE_KEY] || [];
    } else if (typeof window !== 'undefined' && window.localStorage) {
      const item = window.localStorage.getItem(STORAGE_KEY);
      return item ? JSON.parse(item) : [];
    } else {
      return [...memoryFallback];
    }
  } catch (err) {
    console.warn('[GitHub PR Filter] Error reading stored presets:', err);
  }
  return [];
}

async function persistStoredPresets(presets: StoredPreset[]): Promise<void> {
  if (hasChromeStorage()) {
    await chrome.storage.local.set({ [STORAGE_KEY]: presets });
  } else if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  } else {
    memoryFallback = [...presets];
  }
}
