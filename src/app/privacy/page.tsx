import Link from 'next/link';

export const metadata = {
  title: 'Polityka prywatności · AgriClaw',
  description: 'Jak AgriClaw przetwarza dane osobowe rolników.',
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white py-16 px-4">
      <div className="max-w-3xl mx-auto prose prose-gray">
        <Link href="/" className="text-sm text-emerald-700 hover:underline">
          ← wróć na stronę główną
        </Link>

        <h1 className="text-4xl font-bold tracking-tight text-gray-900 mt-6 mb-2">
          Polityka prywatności
        </h1>
        <p className="text-sm text-gray-500 mb-8">Ostatnia aktualizacja: 18 kwietnia 2026</p>

        <section className="space-y-6 text-gray-700 leading-relaxed">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">1. Administrator danych</h2>
            <p>
              Administratorem Twoich danych osobowych jest AgriClaw (dalej „My", „Serwis").
              Kontakt w sprawach prywatności: <a className="text-emerald-700 hover:underline" href="mailto:contact@infinityteam.io">contact@infinityteam.io</a>.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">2. Jakie dane przetwarzamy</h2>
            <p>
              Przetwarzamy adres e-mail, hasło (w postaci zahaszowanej), nazwę gospodarstwa oraz granice pól,
              które sam wskazujesz na mapie. Zapisujemy historię analiz Twoich pól i rekomendacji, które otrzymałeś.
              Jeśli korzystasz z integracji WhatsApp — Twój numer telefonu.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">3. Cel i podstawa prawna</h2>
            <p>
              Dane przetwarzamy w celu świadczenia usługi (art. 6 ust. 1 lit. b RODO), utrzymania konta,
              wysyłki powiadomień i poprawy jakości rekomendacji. Dane techniczne (logi) — na podstawie
              naszego uzasadnionego interesu (art. 6 ust. 1 lit. f RODO).
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">4. Twoje prawa</h2>
            <p>
              Masz prawo dostępu do danych, ich sprostowania, usunięcia, ograniczenia przetwarzania,
              przenoszenia oraz wniesienia sprzeciwu. Możesz też w dowolnym momencie zamknąć konto
              i pobrać wszystkie dane w formie eksportu. Przysługuje Ci skarga do Prezesa UODO.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">5. Przechowywanie danych</h2>
            <p>
              Dane konta przechowujemy dopóki konto jest aktywne. Po jego zamknięciu usuwamy je
              w ciągu 30 dni, z wyjątkiem danych, do których zatrzymania zobowiązują nas przepisy.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">6. Pliki cookies</h2>
            <p>
              Używamy technicznie niezbędnych plików cookies (utrzymanie sesji) oraz podstawowych
              cookies analitycznych bez profilowania. Możesz wyłączyć je w ustawieniach przeglądarki.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">7. Bezpieczeństwo</h2>
            <p>
              Hasła przechowujemy w formie zahaszowanej (bcrypt). Transmisja danych jest zawsze
              szyfrowana (TLS). Dostęp do baz mają wyłącznie osoby realizujące usługę.
            </p>
          </div>
        </section>

        <div className="mt-12">
          <Link href="/terms" className="text-emerald-700 hover:underline">
            Zobacz też: Regulamin →
          </Link>
        </div>
      </div>
    </main>
  );
}
