// Downscale zdjęcia po stronie klienta PRZED wysłaniem do API.
//
// Powód: telefony robią zdjęcia 3–12 MB. Zakodowane base64 puchną o ~33% i
// lądują w JSON body requestu → przekraczają limit 4.5 MB Vercela, więc POST
// /api/diagnose i /api/scouting padają (413) zanim dotrą do handlera. Do tego
// modele wizyjne (Gemma/Claude) i tak skalują wejście do ~1.5 Mpix, więc
// wysyłanie oryginału to czysta strata.
//
// Rozwiązanie: dekodujemy obraz, skalujemy dłuższy bok do maxDim i re-enkodujemy
// jako JPEG. Efekt to zwykle 150–600 KB — mieści się w limicie i wystarcza
// modelowi. Zwraca data URL (`data:image/jpeg;base64,...`).

export async function downscaleImageFile(
  file: File,
  maxDim = 1600,
  quality = 0.85,
): Promise<string> {
  const dataUrl = await readAsDataUrl(file);

  // Dekodowanie. HEIC/nietypowe formaty mogą się nie zdekodować w <img> —
  // wtedy fallback do oryginału (walidacja rozmiaru po stronie wywołującego).
  let img: HTMLImageElement;
  try {
    img = await decode(dataUrl);
  } catch {
    return dataUrl;
  }

  const longest = Math.max(img.width, img.height);
  const scale = Math.min(1, maxDim / longest);

  // Już małe i lekkie → nie ruszaj (unikamy rekompresji bez potrzeby).
  if (scale === 1 && dataUrl.length < 1_200_000) return dataUrl;

  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, w, h);

  try {
    const out = canvas.toDataURL('image/jpeg', quality);
    // Gdyby z jakiegoś powodu wyszło większe niż oryginał (rzadkie), zwróć mniejsze.
    return out.length < dataUrl.length ? out : dataUrl;
  } catch {
    return dataUrl;
  }
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Nie udało się odczytać pliku'));
    reader.readAsDataURL(file);
  });
}

function decode(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Nie udało się zdekodować obrazu'));
    img.src = dataUrl;
  });
}
