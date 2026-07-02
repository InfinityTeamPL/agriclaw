import Link from 'next/link';
import { NdviKeyline } from '@/components/brand/NdviKeyline';

export function Footer() {
  return (
    <footer className="relative bg-card text-muted-foreground py-12 border-t border-border">
      {/* Sygnatura marki: rampa NDVI jako górna krawędź stopki */}
      <NdviKeyline className="absolute inset-x-0 top-0" height={2} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-display font-semibold text-sm">Ag</span>
              </div>
              <span className="font-display font-semibold text-foreground text-lg tracking-tight">AgriClaw</span>
            </div>
            <p className="text-sm max-w-md">
              Twój cyfrowy agronom. Skan pola z góry + konkretna rada przez WhatsApp.
            </p>
          </div>

          <div>
            <div className="hud-label mb-3">
              Produkt
            </div>
            <ul className="space-y-2 text-sm">
              <li><Link href="/signup" className="hover:text-foreground transition">Zacznij bezpłatnie</Link></li>
              <li><Link href="/login" className="hover:text-foreground transition">Zaloguj</Link></li>
              <li><Link href="#jak" className="hover:text-foreground transition">Jak to działa</Link></li>
            </ul>
          </div>

          <div>
            <div className="hud-label mb-3">
              Firma
            </div>
            <ul className="space-y-2 text-sm">
              <li><a href="mailto:contact@infinityteam.io" className="hover:text-foreground transition">contact@infinityteam.io</a></li>
              <li><Link href="/privacy" className="hover:text-foreground transition">Polityka prywatności</Link></li>
              <li><Link href="/terms" className="hover:text-foreground transition">Regulamin</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-border flex flex-col sm:flex-row justify-between gap-4 hud-label">
          <div>© <span className="tabular">{new Date().getFullYear()}</span> AgriClaw. Wszelkie prawa zastrzeżone.</div>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-foreground transition">Prywatność</Link>
            <Link href="/terms" className="hover:text-foreground transition">Regulamin</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
