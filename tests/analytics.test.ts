import { afterEach, describe, expect, it, vi } from 'vitest';
import { track } from '@/lib/analytics';

afterEach(() => {
  delete (window as unknown as Record<string, unknown>).umami;
});

describe('track', () => {
  it('is a no-op when the umami script is absent', () => {
    expect(() => track('row_click', { player: 'Konsa' })).not.toThrow();
  });

  it('forwards event name and data to window.umami', () => {
    const spy = vi.fn();
    (window as unknown as Record<string, unknown>).umami = { track: spy };
    track('filter_change', { filter: 'position' });
    expect(spy).toHaveBeenCalledWith('filter_change', { filter: 'position' });
  });
});
