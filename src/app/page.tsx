import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-b from-green-50 to-white">
      <div className="max-w-2xl text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium">
          <span className="w-2 h-2 rounded-full bg-green-600" />
          OpenClaw Agri · Beta
        </div>

        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-gray-900">
          AI agronom, który<br />
          <span className="text-green-600">wie co robić jutro rano.</span>
        </h1>

        <p className="text-lg md:text-xl text-gray-600 max-w-xl mx-auto">
          Satelity + pogoda + twoja historia pola → konkretna rada po polsku.
          Dostajesz WhatsApp: <em>"pole 3 pryskaj jutro 5:30"</em>. Tyle.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Link
            href="/signup"
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition"
          >
            Załóż konto
          </Link>
          <Link
            href="/login"
            className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition"
          >
            Zaloguj się
          </Link>
        </div>

        <div className="pt-8 text-sm text-gray-500">
          Darmowe dane: Sentinel-2 (ESA) · SMAP (NASA) · Open-Meteo · działa offline
        </div>
      </div>
    </main>
  );
}
