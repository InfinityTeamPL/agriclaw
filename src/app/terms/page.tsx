import Link from 'next/link';

export const metadata = {
  title: 'Regulamin · AgriClaw',
  description: 'Zasady korzystania z serwisu AgriClaw.',
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white py-16 px-4">
      <div className="max-w-3xl mx-auto prose prose-gray">
        <Link href="/" className="text-sm text-emerald-700 hover:underline">
          ← wróć na stronę główną
        </Link>

        <h1 className="text-4xl font-bold tracking-tight text-gray-900 mt-6 mb-2">
          Regulamin serwisu
        </h1>
        <p className="text-sm text-gray-500 mb-8">Ostatnia aktualizacja: 18 kwietnia 2026</p>

        <section className="space-y-6 text-gray-700 leading-relaxed">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">1. O czym to jest</h2>
            <p>
              Regulamin opisuje zasady korzystania z AgriClaw — serwisu, który pomaga rolnikom
              monitorować kondycję pól i podejmować decyzje agrotechniczne. Zakładając konto,
              akceptujesz ten regulamin. Jeśli z czymś się nie zgadzasz, po prostu nie korzystaj
              z serwisu — niczego Ci nie naliczymy.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">2. Kto może korzystać</h2>
            <p>
              Z serwisu mogą korzystać osoby pełnoletnie prowadzące działalność rolniczą
              albo osoby działające w jej imieniu. Dla celów testowych pozwalamy też korzystać osobom,
              które po prostu chcą zobaczyć, jak działa — nie będziemy rygorystyczni.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">3. Rejestracja i konto</h2>
            <p>
              Do korzystania potrzebny jest e-mail i hasło. Możesz też logować się przez Google.
              Nie udostępniaj swojego hasła innym. Dbaj o to, żeby dane pól były Twoje, albo żebyś
              miał zgodę właściciela na ich wprowadzenie.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">4. Jak działa rada</h2>
            <p>
              AgriClaw liczy wskaźniki zdrowia roślin, wilgotności gleby i prognozę pogody,
              a następnie AgroAgent podpowiada, co z tym zrobić. Rady mają charakter informacyjny.
              Decyzję o oprysku, nawożeniu, siewie czy zbiorze zawsze podejmujesz Ty — jako gospodarz.
              Nie gwarantujemy, że każde podpowiedzenie jest idealnie trafne — rzeczywistość na polu
              jest bardziej skomplikowana niż najlepszy model.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">5. Plan darmowy i płatny</h2>
            <p>
              W fazie testów serwis jest darmowy. Jeśli w przyszłości wprowadzimy plany płatne,
              poinformujemy Cię z wyprzedzeniem i zawsze będziesz mógł wyeksportować swoje dane
              albo zrezygnować. Nie stosujemy automatycznego zwiększania opłat bez Twojej zgody.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">6. Co należy do Ciebie, a co do nas</h2>
            <p>
              Twoje dane (adres, granice pól, historia, zapisane rozmowy) — należą do Ciebie.
              Oprogramowanie, interfejs, modele i infrastruktura — należą do nas.
              Możesz eksportować swoje dane w dowolnej chwili.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">7. Dostępność</h2>
            <p>
              Robimy, co możemy, żeby serwis działał bez przerw. Czasem jednak trzeba coś zaktualizować,
              a czasem coś pada. Nie odpowiadamy za straty wynikłe z chwilowej niedostępności.
              Jeśli jesteś zaskoczony awarią — napisz, nagłośnimy, naprawimy.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">8. Zakończenie korzystania</h2>
            <p>
              Konto możesz zamknąć w każdej chwili. Możemy zawiesić konto, jeśli ktoś łamie regulamin,
              próbuje nadużywać serwisu albo naraża innych użytkowników. W razie zamknięcia — dane
              usuwamy zgodnie z polityką prywatności.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">9. Zmiany regulaminu</h2>
            <p>
              Jeśli coś się zmieni, powiadomimy Cię e-mailem albo przez aplikację z wyprzedzeniem
              co najmniej 14 dni. Jeśli się nie zgadzasz — możesz zamknąć konto bez konsekwencji.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">10. Kontakt</h2>
            <p>
              W każdej sprawie napisz na <a className="text-emerald-700 hover:underline" href="mailto:contact@infinityteam.io">contact@infinityteam.io</a>.
              Staramy się odpowiadać w ciągu 48 godzin w dni robocze.
            </p>
          </div>
        </section>

        <div className="mt-12">
          <Link href="/privacy" className="text-emerald-700 hover:underline">
            Zobacz też: Polityka prywatności →
          </Link>
        </div>
      </div>
    </main>
  );
}
