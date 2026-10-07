import { formatDatePL } from './format';

interface ScoutingPopupItem {
  tag: string;
  severity: string;
  note: string | null;
  photoUrl: string | null;
  createdAt: string;
}

const TAGS: Record<string, { label: string; color: string }> = {
  disease: { label: 'Choroba', color: '#f59e0b' },
  pest: { label: 'Szkodnik', color: '#dc2626' },
  frost: { label: 'Przymrozek', color: '#0ea5e9' },
  mechanical: { label: 'Mechaniczne', color: '#78716c' },
  weed: { label: 'Chwasty', color: '#16a34a' },
  other: { label: 'Inne', color: '#6b7280' },
};

const SEVERITY: Record<string, string> = {
  low: 'niska intensywność',
  medium: 'średnia intensywność',
  high: 'wysoka intensywność',
};

function tagMeta(tag: string) {
  return Object.prototype.hasOwnProperty.call(TAGS, tag) ? TAGS[tag] : TAGS.other;
}

export function scoutingTagColor(tag: string): string {
  return tagMeta(tag).color;
}

/** Zdjęcia z formularza są rasterami base64; pozostałe źródła muszą być URL HTTP(S). */
export function safeScoutingPhotoUrl(raw: string | null, baseUrl: string): string | null {
  if (!raw) return null;
  const value = raw.trim();
  if (!value || /[\u0000-\u001f\u007f\\<>"']/.test(value)) return null;

  const raster = /^data:image\/(?:jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/i.exec(value);
  if (raster) {
    // Wymagamy pełnych grup base64. SVG i HTML nigdy nie przechodzą tą ścieżką.
    return raster[1].length % 4 === 0 ? value : null;
  }

  // Nie przyjmuj //host, backslashy ani skróconych schematów typu https:host.
  if (value.startsWith('//')) return null;
  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(value);
  if (hasScheme && !/^https?:\/\//i.test(value)) return null;

  try {
    const base = new URL(baseUrl);
    const url = new URL(value, base);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return null;
    if (!hasScheme && url.origin !== base.origin) return null;
    return url.href;
  } catch {
    return null;
  }
}

/** Dane użytkownika trafiają wyłącznie do textContent / właściwości DOM, nigdy do HTML. */
export function createScoutingPopupContent(
  item: ScoutingPopupItem,
  baseUrl = document.baseURI
): HTMLDivElement {
  const tag = tagMeta(item.tag);
  const content = document.createElement('div');
  content.style.cssText = 'font-family:system-ui;font-size:12px;line-height:1.4';

  const title = document.createElement('div');
  title.style.fontWeight = '600';
  title.style.color = tag.color;
  const severity = Object.prototype.hasOwnProperty.call(SEVERITY, item.severity)
    ? SEVERITY[item.severity]
    : 'intensywność nieokreślona';
  title.textContent = `${tag.label} · ${severity}`;
  content.append(title);

  const date = document.createElement('div');
  date.style.cssText = 'color:#888;font-size:10px';
  date.textContent = formatDatePL(item.createdAt);
  content.append(date);

  if (item.note) {
    const note = document.createElement('div');
    note.style.cssText = 'margin-top:4px;color:#555;overflow-wrap:anywhere';
    note.textContent = item.note.slice(0, 100);
    content.append(note);
  }

  const photoUrl = safeScoutingPhotoUrl(item.photoUrl, baseUrl);
  if (photoUrl) {
    const photo = document.createElement('img');
    photo.src = photoUrl;
    photo.alt = `Zdjęcie obserwacji: ${tag.label.toLowerCase()}`;
    photo.loading = 'lazy';
    photo.referrerPolicy = 'no-referrer';
    photo.style.cssText = 'margin-top:6px;max-width:200px;max-height:120px;border-radius:6px';
    content.append(photo);
  }

  return content;
}
