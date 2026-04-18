// Typy zabiegów agrotechnicznych + popularne środki ochrony roślin
// zarejestrowane w Polsce (MRiRW). Baza dla podpowiedzi w UI.

export const TREATMENT_TYPES = [
  { value: 'spray', label: 'Oprysk (ŚOR)', icon: '🌬️' },
  { value: 'fertilizer', label: 'Nawożenie', icon: '🧪' },
  { value: 'sowing', label: 'Siew', icon: '🌱' },
  { value: 'harvest', label: 'Zbiór', icon: '🌾' },
  { value: 'tillage', label: 'Uprawa gleby (orka/brona)', icon: '🚜' },
  { value: 'irrigation', label: 'Nawadnianie', icon: '💧' },
  { value: 'mowing', label: 'Koszenie', icon: '✂️' },
  { value: 'other', label: 'Inne', icon: '📝' },
] as const;

export type TreatmentType = typeof TREATMENT_TYPES[number]['value'];

export const TREATMENT_PURPOSES = {
  spray: [
    { value: 'disease', label: 'Choroba grzybowa' },
    { value: 'weed', label: 'Chwasty (herbicyd)' },
    { value: 'pest', label: 'Szkodniki (insektycyd)' },
    { value: 'regulator', label: 'Regulator wzrostu' },
    { value: 'desiccant', label: 'Desykacja' },
  ],
  fertilizer: [
    { value: 'n', label: 'Azot (N)' },
    { value: 'p', label: 'Fosfor (P)' },
    { value: 'k', label: 'Potas (K)' },
    { value: 'npk', label: 'NPK wieloskładnikowy' },
    { value: 'micro', label: 'Mikroelementy' },
    { value: 'foliar', label: 'Dokarmianie dolistne' },
    { value: 'organic', label: 'Obornik / gnojowica' },
  ],
} as const;

// Popularne środki ochrony roślin zarejestrowane w PL (wg MRiRW).
// Format: { nazwa handlowa, substancja czynna, dawka typowa, karencja, typ }
export const COMMON_PRODUCTS = [
  // Fungicydy zbożowe
  { name: 'Falcon 460 EC', substance: 'spiroksamina + tebukonazol + triadimenol', dose: 0.6, unit: 'l/ha', phi: 35, category: 'fungicide' },
  { name: 'Tilt Turbo 575 EC', substance: 'propikonazol + fenpropidyna', dose: 1.0, unit: 'l/ha', phi: 42, category: 'fungicide' },
  { name: 'Mystic 250 EC', substance: 'tebukonazol 250 g/l', dose: 1.0, unit: 'l/ha', phi: 35, category: 'fungicide' },
  { name: 'Amistar 250 SC', substance: 'azoksystrobina 250 g/l', dose: 1.0, unit: 'l/ha', phi: 35, category: 'fungicide' },
  { name: 'Input 460 EC', substance: 'protiokonazol + spiroksamina', dose: 1.25, unit: 'l/ha', phi: 42, category: 'fungicide' },
  // Herbicydy zbożowe
  { name: 'Atlantis Star', substance: 'mezosulfuron + iodosulfuron + tienkarbazon', dose: 0.333, unit: 'kg/ha', phi: null, category: 'herbicide' },
  { name: 'Huzar Activ Plus', substance: 'iodosulfuron + 2,4-D', dose: 1.0, unit: 'l/ha', phi: null, category: 'herbicide' },
  { name: 'Axial 50 EC', substance: 'pinoksaden 50 g/l', dose: 0.9, unit: 'l/ha', phi: null, category: 'herbicide' },
  { name: 'Mustang 306 SE', substance: 'florasulam + 2,4-D', dose: 0.5, unit: 'l/ha', phi: null, category: 'herbicide' },
  // Insektycydy
  { name: 'Karate Zeon 050 CS', substance: 'lambda-cyhalotryna 50 g/l', dose: 0.15, unit: 'l/ha', phi: 30, category: 'insecticide' },
  { name: 'Decis Mega 50 EW', substance: 'deltametryna 50 g/l', dose: 0.15, unit: 'l/ha', phi: 30, category: 'insecticide' },
  // Nawozy
  { name: 'Mocznik 46% N', substance: 'mocznik CO(NH2)2', dose: 200, unit: 'kg/ha', phi: null, category: 'fertilizer' },
  { name: 'Saletra amonowa 34% N', substance: 'azotan amonu NH4NO3', dose: 250, unit: 'kg/ha', phi: null, category: 'fertilizer' },
  { name: 'Polifoska 6', substance: 'N-P-K 6-20-30', dose: 300, unit: 'kg/ha', phi: null, category: 'fertilizer' },
  { name: 'Saletrzak 27% N', substance: 'Ca(NO3)2 + NH4NO3', dose: 280, unit: 'kg/ha', phi: null, category: 'fertilizer' },
  { name: 'Magnesal', substance: 'MgSO4 15%', dose: 5, unit: 'kg/ha', phi: null, category: 'fertilizer' },
  // Regulatory wzrostu
  { name: 'Cycocel 750', substance: 'chlorek chlorocholiny (CCC) 750 g/l', dose: 1.5, unit: 'l/ha', phi: null, category: 'regulator' },
  { name: 'Moddus 250 EC', substance: 'trineksapak etylu 250 g/l', dose: 0.4, unit: 'l/ha', phi: null, category: 'regulator' },
] as const;

export type CommonProduct = typeof COMMON_PRODUCTS[number];

export function findProduct(query: string): CommonProduct[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return COMMON_PRODUCTS.filter(
    (p) =>
      p.name.toLowerCase().includes(q) || p.substance.toLowerCase().includes(q),
  ).slice(0, 8);
}

export function getTreatmentTypeLabel(value: string): string {
  return TREATMENT_TYPES.find((t) => t.value === value)?.label ?? value;
}

export function getTreatmentTypeIcon(value: string): string {
  return TREATMENT_TYPES.find((t) => t.value === value)?.icon ?? '📝';
}
