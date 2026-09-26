import { describe, it, expect, beforeEach } from 'vitest';
import {
  getCustomPresets,
  saveCustomPreset,
  deleteCustomPreset,
  clearCustomPresets,
} from '../src/storage/customPresets';
import { isPresetActive, togglePreset, PRESETS } from '../src/query/presets';

describe('Custom Presets Storage & Toggling', () => {
  beforeEach(async () => {
    await clearCustomPresets();
  });

  it('starts with empty custom presets', async () => {
    const presets = await getCustomPresets();
    expect(presets).toEqual([]);
  });

  it('saves and retrieves a new custom preset', async () => {
    const saved = await saveCustomPreset('Frontend Team', 'is:pr is:open label:frontend');
    expect(saved.label).toBe('Frontend Team');
    expect(saved.isCustom).toBe(true);
    expect(saved.tokens.length).toBe(3);

    const all = await getCustomPresets();
    expect(all.length).toBe(1);
    expect(all[0].id).toBe(saved.id);
    expect(all[0].label).toBe('Frontend Team');
  });

  it('deletes a custom preset by ID', async () => {
    const p1 = await saveCustomPreset('Hotfixes', 'is:pr is:open label:hotfix');
    const p2 = await saveCustomPreset('Dependencies', 'is:pr is:open label:dependencies');

    let all = await getCustomPresets();
    expect(all.length).toBe(2);

    await deleteCustomPreset(p1.id);

    all = await getCustomPresets();
    expect(all.length).toBe(1);
    expect(all[0].id).toBe(p2.id);
  });

  it('detects when a custom preset is active in a query', async () => {
    const custom = await saveCustomPreset('QA Ready', 'is:pr is:open label:qa-ready');
    const query = 'is:pr is:open label:qa-ready author:octocat';

    expect(isPresetActive(query, custom, [custom])).toBe(true);
    expect(isPresetActive('is:pr is:open', custom, [custom])).toBe(false);
  });

  it('toggles custom preset on and off cleanly', async () => {
    const custom = await saveCustomPreset('Security', 'is:pr is:open label:security');
    const initial = 'is:pr is:open';

    const activated = togglePreset(initial, custom, [custom]);
    expect(activated).toContain('label:security');
    expect(isPresetActive(activated, custom, [custom])).toBe(true);

    const deactivated = togglePreset(activated, custom, [custom]);
    expect(deactivated).not.toContain('label:security');
    expect(isPresetActive(deactivated, custom, [custom])).toBe(false);
  });
});
