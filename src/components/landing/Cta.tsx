import { Arrow, Eyebrow, Pill, SectionTitle, WRAP } from './ui';

export function Cta() {
  return (
    <section className="pb-[75px] md:pb-[110px]">
      <div
        className={`${WRAP} flex min-h-[470px] flex-col items-start justify-center rounded-[24px] bg-cover bg-center p-8 md:p-[65px]`}
        style={{
          backgroundImage:
            "linear-gradient(90deg,#102015 10%,rgba(16,32,21,.35)),url('/landing/agriclaw-wheat-landscape.webp')",
        }}
      >
        <Eyebrow>Beta · darmowo dla pierwszych 100 rolników</Eyebrow>
        <SectionTitle className="max-w-[760px]">
          Twoje pole.
          <br />
          <em className="font-[family-name:var(--font-playfair)] font-medium tracking-[-0.055em] text-[#d5edb7]">
            Twój agent. Twój czas.
          </em>
        </SectionTitle>
        <p className="mb-9 max-w-[560px] text-lg leading-relaxed sm:text-xl">
          Zobaczysz pierwszą analizę pola w 90 sekund od rejestracji. Bez karty, bez kontraktu, bez
          sprzedawcy.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Pill href="/signup">
            Zacznij bezpłatnie <Arrow />
          </Pill>
          <Pill href="/login" variant="outline">
            Mam już konto
          </Pill>
        </div>
      </div>
    </section>
  );
}
