import { describe, it, expect } from 'vitest';
import { topReason } from '../why';

describe('topReason', () => {
  it('bierze pierwszą przesłankę z progiem', () => {
    expect(
      topReason([
        { label: 'Faza', value: 'wschody', threshold: null },
        { label: 'Minimum nocne (prognoza)', value: '−3,2°C', threshold: 'uszkodzenia od −2,0°C' },
      ]),
    ).toBe('Minimum nocne (prognoza) −3,2°C · próg: uszkodzenia od −2,0°C');
  });

  it('bez progów — pierwsza przesłanka bez „próg"', () => {
    expect(topReason([{ label: 'NDVI', value: '0,46', threshold: null }])).toBe('NDVI 0,46');
  });

  it('stare rekomendacje bez why (null) i śmieci → null', () => {
    expect(topReason(null)).toBeNull();
    expect(topReason({})).toBeNull();
    expect(topReason([{}])).toBeNull();
  });
});
