import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-400 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">Ag</span>
              </div>
              <span className="font-bold text-white text-lg">AgriClaw</span>
            </div>
            <p className="text-sm max-w-md">
              Open-source AI agronom z danymi z kosmosu. Budowane przez Infinity Team na silniku OpenClaw.
            </p>
          </div>

          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-gray-500 mb-3">
              Produkt
            </div>
            <ul className="space-y-2 text-sm">
              <li><Link href="/signup" className="hover:text-white transition">Zacznij bezpłatnie</Link></li>
              <li><Link href="/login" className="hover:text-white transition">Zaloguj</Link></li>
              <li><Link href="#jak" className="hover:text-white transition">Jak to działa</Link></li>
            </ul>
          </div>

          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-gray-500 mb-3">
              Kontakt
            </div>
            <ul className="space-y-2 text-sm">
              <li><a href="mailto:contact@infinityteam.io" className="hover:text-white transition">contact@infinityteam.io</a></li>
              <li><a href="https://clawlabs.pro" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">clawlabs.pro</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-gray-800 flex flex-col sm:flex-row justify-between gap-4 text-xs text-gray-500">
          <div>© {new Date().getFullYear()} Infinity Team · Apache-2.0</div>
          <div className="flex gap-4">
            <span>Sentinel-2: Copernicus</span>
            <span>SMAP: NASA</span>
            <span>Open-Meteo: CC-BY 4.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
