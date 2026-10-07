import Link from 'next/link';
import { LogoMark } from '@/components/brand/LogoMark';
import { WRAP } from './ui';

// Stopka landingu „filmowego" (ciemna). Footer.tsx zostaje jasny dla /beta.
export function LandingFooter() {
  return (
    <footer className="border-t border-white/15 py-12">
      <div className={WRAP}>
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="mb-3 flex items-center gap-3">
              <LogoMark size={32} />
              <span className="font-[family-name:var(--font-manrope)] text-lg font-extrabold tracking-[-0.07em]">
                AgriClaw
              </span>
            </div>
            <p className="max-w-md text-sm opacity-65">
              Twój cyfrowy agronom. Satelita nad polem, legalne środki w opryskiwaczu, księga polowa
              gotowa na kontrolę.
            </p>
          </div>

          <div>
            <div className="mb-3 text-xs font-bold uppercase tracking-[0.15em] opacity-90">Produkt</div>
            <ul className="space-y-2 text-sm opacity-65">
              <li><Link href="/signup" className="hover:opacity-100">Zacznij bezpłatnie</Link></li>
              <li><Link href="/login" className="hover:opacity-100">Zaloguj</Link></li>
              <li><Link href="#jak" className="hover:opacity-100">Jak to działa</Link></li>
            </ul>
          </div>

          <div>
            <div className="mb-3 text-xs font-bold uppercase tracking-[0.15em] opacity-90">Firma</div>
            <ul className="space-y-2 text-sm opacity-65">
              <li><a href="mailto:contact@infinityteam.io" className="hover:opacity-100">contact@infinityteam.io</a></li>
              <li><Link href="/privacy" className="hover:opacity-100">Polityka prywatności</Link></li>
              <li><Link href="/terms" className="hover:opacity-100">Regulamin</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col justify-between gap-4 border-t border-white/15 pt-8 text-[13px] opacity-65 sm:flex-row">
          <div>© {new Date().getFullYear()} AgriClaw. Wszelkie prawa zastrzeżone.</div>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:opacity-100">Prywatność</Link>
            <Link href="/terms" className="hover:opacity-100">Regulamin</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
