import { Eyebrow, SectionTitle, WRAP } from './ui';

const STEPS = [
  {
    n: '01 / ZAZNACZ POLE',
    title: 'Zaznacz pole',
    body: 'Wklejasz numer działki z wniosku do ARiMR — granicę pobieramy 1:1 z ewidencji gruntów (GUGiK). Albo obrysowujesz pole palcem na mapie.',
  },
  {
    n: '02 / AGENT',
    title: 'Agent robi robotę',
    body: 'Przy każdym nowym przelocie satelity agent sprawdza pole: zdrowie roślin, wodę, fazę rozwoju, pogodę i ryzyko chorób.',
  },
  {
    n: '03 / RADA',
    title: 'Dostajesz radę',
    body: 'Rano w aplikacji: „Pole 3 pryskaj jutro 5:30, okno się zamyka". Konkret, po polsku, z uzasadnieniem — bez tabel.',
  },
];

export function HowItWorks() {
  return (
    <section id="jak" className="scroll-mt-24 py-[75px] md:py-[110px]">
      <div className={WRAP}>
        <Eyebrow>Jak to działa</Eyebrow>
        <SectionTitle>
          Trzy kroki. Zero
          <br />
          specjalistycznego żargonu.
        </SectionTitle>

        <div className="mt-10 grid gap-3.5 rounded-[24px] bg-[#182a1c] p-6 md:grid-cols-3 md:p-[50px]">
          {STEPS.map((s) => (
            <div key={s.n} className="border-t border-current px-2 pt-6">
              <span className="text-[13px] tracking-[0.12em]">{s.n}</span>
              <b className="mb-2 mt-4 block font-[family-name:var(--font-manrope)] text-xl tracking-[-0.04em]">
                {s.title}
              </b>
              <p className="max-w-[34ch] text-[15px] leading-[1.55] opacity-70">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
