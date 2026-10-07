// Fonty landingu (wariant „filmowy"): Manrope do nagłówków, Playfair kursywą
// do akcentu. Ładowane tylko tu — reszta aplikacji zostaje przy Space Grotesk/Plex.
import { Manrope, Playfair_Display } from 'next/font/google';

export const manrope = Manrope({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-manrope',
  display: 'swap',
});

export const playfair = Playfair_Display({
  subsets: ['latin', 'latin-ext'],
  weight: ['500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
  display: 'swap',
});
