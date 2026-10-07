import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FieldsList, type FieldListItem } from './FieldsList';

vi.mock('@/components/dashboard/FieldSatThumb', () => ({ FieldSatThumb: () => null }));

const asOf = '2026-10-07T10:00:00Z';
const base: FieldListItem = {
  id: 'fresh',
  name: 'Łąka Żółta',
  crop: 'corn',
  areaHectares: 5,
  createdAt: '2025-01-01T00:00:00Z',
  polygon: {
    type: 'Polygon',
    coordinates: [
      [
        [19, 52],
        [19.01, 52],
        [19, 52.01],
        [19, 52],
      ],
    ],
  },
  ndviMean: 0.46,
  ndviObservedAt: '2026-10-06T10:00:00Z',
  ndviSource: 'sentinel-2',
};
const items: FieldListItem[] = [
  base,
  { ...base, id: 'old', name: 'Za lasem', crop: 'wheat', ndviObservedAt: '2026-09-01T10:00:00Z' },
  {
    ...base,
    id: 'missing',
    name: 'Nowe pole',
    crop: 'wheat',
    ndviMean: null,
    ndviObservedAt: null,
    ndviSource: null,
  },
  { ...base, id: 'demo', name: 'Pole pokazowe', ndviSource: 'mock' },
];

beforeEach(() => localStorage.clear());
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('field catalogue workflows', () => {
  it('exposes actual observation dates and excludes demo data from recent coverage', () => {
    render(<FieldsList items={items} asOf={asOf} />);
    expect(screen.getByText('1 z 4 pól')).toBeTruthy();
    const field = screen.getByRole('link', { name: /Łąka Żółta/ });
    expect(within(field).getByText('06.10.2026')).toBeTruthy();
    expect(within(field).getByText('NDVI 0,46')).toBeTruthy();
    expect(within(field).queryByText('01.01.2025')).toBeNull();
    expect(screen.getByRole('link', { name: /Pole pokazowe/ }).textContent).toContain('Dane demo');
    expect(screen.getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual([
      '/dashboard/fields/missing',
      '/dashboard/fields/old',
      '/dashboard/fields/demo',
      '/dashboard/fields/fresh',
    ]);
  });

  it('combines measurement status with a crop filter and resets an empty result', async () => {
    const user = userEvent.setup();
    render(<FieldsList items={items} asOf={asOf} />);
    await user.click(screen.getByRole('button', { name: /Do sprawdzenia/ }));
    expect(screen.getAllByRole('link')).toHaveLength(2);
    await user.selectOptions(screen.getByLabelText('Uprawa'), 'corn');
    expect(screen.queryAllByRole('link')).toHaveLength(0);
    expect(screen.getByRole('heading', { name: 'Nie znaleziono pól' })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Pokaż wszystkie pola' }));
    expect(screen.getAllByRole('link')).toHaveLength(4);
    expect((screen.getByLabelText('Uprawa') as HTMLSelectElement).value).toBe('all');
  });

  it('finds field names without diacritics and also searches Polish crop names', async () => {
    const user = userEvent.setup();
    render(<FieldsList items={items} asOf={asOf} />);
    const input = screen.getByLabelText('Znajdź pole');
    await user.type(input, 'laka zolta');
    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(screen.getByRole('link', { name: /Łąka Żółta/ })).toBeTruthy();
    await user.clear(input);
    await user.type(input, 'pszenica');
    expect(screen.getAllByRole('link')).toHaveLength(2);
  });

  it('keeps the reading date in list view and remembers only display preferences', async () => {
    const user = userEvent.setup();
    const first = render(<FieldsList items={items} asOf={asOf} />);
    await user.click(screen.getByRole('button', { name: 'Widok: lista' }));
    expect(screen.getByRole('button', { name: 'Widok: lista' }).getAttribute('aria-pressed')).toBe(
      'true'
    );
    expect(
      within(screen.getByRole('link', { name: /Łąka Żółta/ })).getByText('06.10.2026')
    ).toBeTruthy();
    await user.selectOptions(screen.getByLabelText('Kolejność'), 'name');
    await user.type(screen.getByLabelText('Znajdź pole'), 'sekretna nazwa');
    const saved = localStorage.getItem('agriclaw.fields.display.v1')!;
    expect(JSON.parse(saved)).toEqual({ view: 'list', sort: 'name' });
    first.unmount();
    render(<FieldsList items={items} asOf={asOf} />);
    expect(screen.getByRole('button', { name: 'Widok: lista' }).getAttribute('aria-pressed')).toBe(
      'true'
    );
    expect((screen.getByLabelText('Znajdź pole') as HTMLInputElement).value).toBe('');
    expect(screen.getAllByRole('link')).toHaveLength(4);
  });

  it('works when stored preferences are malformed', () => {
    localStorage.setItem('agriclaw.fields.display.v1', '{broken');
    render(<FieldsList items={items} asOf={asOf} />);
    expect(screen.getAllByRole('link')).toHaveLength(4);
    expect(screen.getByRole('button', { name: 'Widok: siatka' }).getAttribute('aria-pressed')).toBe(
      'true'
    );
  });

  it('does not show an invalid NDVI as a normal measurement or sort it before valid values', async () => {
    const user = userEvent.setup();
    render(
      <FieldsList
        items={[base, { ...base, id: 'invalid', name: 'Błędny pomiar', ndviMean: -2 }]}
        asOf={asOf}
      />
    );
    const invalid = screen.getByRole('link', { name: /Błędny pomiar/ });
    expect(within(invalid).getByText('Brak NDVI')).toBeTruthy();
    expect(within(invalid).getByText('Dane do sprawdzenia')).toBeTruthy();
    expect(invalid.textContent).not.toContain('-2,00');
    await user.selectOptions(screen.getByLabelText('Kolejność'), 'ndvi-low');
    expect(screen.getAllByRole('link').at(-1)?.getAttribute('href')).toBe(
      '/dashboard/fields/invalid'
    );
  });

  it('labels a monthly composite without pretending its synthetic date is a scene date', () => {
    render(
      <FieldsList
        items={[
          { ...base, ndviSource: 'sentinel-2-history', ndviObservedAt: '2026-10-15T00:00:00Z' },
        ]}
        asOf={asOf}
      />
    );
    expect(screen.getByText('0 z 1 pola')).toBeTruthy();
    const field = screen.getByRole('link', { name: /Łąka Żółta/ });
    expect(within(field).getByText('Archiwum miesięczne')).toBeTruthy();
    expect(within(field).queryByText('15.10.2026')).toBeNull();
  });
});
