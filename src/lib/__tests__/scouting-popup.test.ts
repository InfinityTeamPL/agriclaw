import { describe, expect, it } from 'vitest';
import { createScoutingPopupContent, safeScoutingPhotoUrl } from '@/lib/ui/scouting-popup';

const BASE_URL = 'https://agriclaw.example/dashboard/fields/123';
const PNG = 'data:image/png;base64,iVBORw0KGgo=';

describe('safeScoutingPhotoUrl', () => {
  it('zachowuje lokalne zdjęcia i normalizuje adresy HTTP(S)', () => {
    expect(safeScoutingPhotoUrl('/photos/field.png', BASE_URL)).toBe(
      'https://agriclaw.example/photos/field.png'
    );
    expect(safeScoutingPhotoUrl('./leaf.jpg', BASE_URL)).toBe(
      'https://agriclaw.example/dashboard/fields/leaf.jpg'
    );
    expect(safeScoutingPhotoUrl('https://images.example/leaf.jpg', BASE_URL)).toBe(
      'https://images.example/leaf.jpg'
    );
    expect(safeScoutingPhotoUrl('http://images.example/leaf.jpg', BASE_URL)).toBe(
      'http://images.example/leaf.jpg'
    );
    expect(safeScoutingPhotoUrl(PNG, BASE_URL)).toBe(PNG);
    expect(safeScoutingPhotoUrl('data:image/jpeg;base64,/9j/AAAA', BASE_URL)).toBe(
      'data:image/jpeg;base64,/9j/AAAA'
    );
    expect(safeScoutingPhotoUrl('data:image/webp;base64,UklGRg==', BASE_URL)).toBe(
      'data:image/webp;base64,UklGRg=='
    );
  });

  it.each([
    'javascript:alert(1)',
    'java\nscript:alert(1)',
    'data:text/html;base64,PHNjcmlwdD4=',
    'data:image/svg+xml;base64,PHN2Zz4=',
    'data:image/png;base64,not-valid-base64',
    'data:image/png;base64,abc',
    'data:image/png;base64,AAAA====',
    '//evil.example/photo.jpg',
    '\\\\evil.example/photo.jpg',
    '/\\evil.example/photo.jpg',
    'https:evil.example/photo.jpg',
    'blob:https://agriclaw.example/photo',
    'file:///C:/photo.jpg',
    'https://user:secret@images.example/photo.jpg',
    'https://images.example/photo.jpg" onerror="alert(1)',
  ])('odrzuca niebezpieczne źródło: %s', (source) => {
    expect(safeScoutingPhotoUrl(source, BASE_URL)).toBeNull();
  });
});

describe('createScoutingPopupContent', () => {
  it('notatka z HTML pozostaje tekstem, a URL nie dodaje atrybutów ani elementów', () => {
    const note = '<img src=x onerror="alert(1)"><script>alert(2)</script>';
    const content = createScoutingPopupContent(
      {
        tag: 'disease',
        severity: 'high',
        note,
        photoUrl: 'https://images.example/photo.jpg" onerror="alert(3)',
        createdAt: '2026-10-07T10:00:00Z',
      },
      BASE_URL
    );

    expect(content.textContent).toContain(note);
    expect(content.querySelector('script, img, [onerror]')).toBeNull();
    expect(content.textContent).toContain('Choroba · wysoka intensywność');
    expect(content.textContent).toContain('07.10.2026');
  });

  it('dodaje bezpieczne zdjęcie z opisem i nie interpretuje kodów tagu jako HTML', () => {
    const content = createScoutingPopupContent(
      {
        tag: '<svg onload="alert(1)">',
        severity: '<script>alert(2)</script>',
        note: null,
        photoUrl: PNG,
        createdAt: '2026-10-07T10:00:00Z',
      },
      BASE_URL
    );

    expect(content.querySelector('svg, script, [onload]')).toBeNull();
    expect(content.textContent).toContain('Inne · intensywność nieokreślona');
    expect(content.querySelector('img')?.getAttribute('src')).toBe(PNG);
    expect(content.querySelector('img')?.alt).toBe('Zdjęcie obserwacji: inne');
  });

  it('nazwy właściwości prototypu też są nieznanymi kodami, nie metadanymi', () => {
    const content = createScoutingPopupContent(
      {
        tag: '__proto__',
        severity: 'constructor',
        note: null,
        photoUrl: null,
        createdAt: '2026-10-07T10:00:00Z',
      },
      BASE_URL
    );
    expect(content.textContent).toContain('Inne · intensywność nieokreślona');
  });
});
