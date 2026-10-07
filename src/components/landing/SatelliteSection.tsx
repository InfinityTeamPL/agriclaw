import { SatelliteScanner } from './SatelliteScanner';
import { Eyebrow, SectionTitle, WRAP } from './ui';

// Sekcja z naszą animacją przelotu satelity i skanu pola. Układ „statement"
// z wariantu filmowego: tekst po lewej, animacja w ciemnej karcie po prawej.
export function SatelliteSection() {
  return (
    <section className="py-[75px] md:py-[110px]">
      <div className={`${WRAP} grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-[70px]`}>
        <div>
          <Eyebrow>Satelita nad Twoim polem</Eyebrow>
          <SectionTitle>
            Satelita przelatuje.
            <br />
            Agent robi robotę.
          </SectionTitle>
          <p className="text-xl leading-[1.55] opacity-70">
            Przy każdym nowym przelocie satelity agent sprawdza pole: zdrowie roślin, wodę, fazę
            rozwoju, pogodę i ryzyko chorób. Nowe zdjęcie co 2–5 dni, a radar widzi także przez chmury.
          </p>
        </div>

        <div className="rounded-[24px] bg-[#182a1c] p-3 sm:p-6">
          <SatelliteScanner variant="dark" />
        </div>
      </div>
    </section>
  );
}
