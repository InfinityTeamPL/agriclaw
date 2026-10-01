// Warstwa „dlaczego" (XAI) — wspólne helpery dla list, gdzie nie ma miejsca na
// pełny WhyPanel (panel „Dziś", powiadomienia).

/**
 * Pierwsza przesłanka PROGOWA w jednej linii, np. „Dni bez deszczu 15 · próg: co najmniej 14".
 * Reguły układają `why` tak, że rozstrzygająca przesłanka idzie pierwsza.
 */
export function topReason(why: unknown): string | null {
  if (!Array.isArray(why)) return null;
  const items = why as Array<{ label?: string; value?: string; threshold?: string | null }>;
  const e = items.find((x) => x?.threshold) ?? items[0];
  if (!e?.label || !e.value) return null;
  return e.threshold ? `${e.label} ${e.value} · próg: ${e.threshold}` : `${e.label} ${e.value}`;
}
