'use client';

// Slot w topbarze na kontrolki specyficzne dla strony (np. selektor silnika na
// stronie agenta). Strona portaluje swój element w pasek nawigacji — obok
// dzwonka/profilu — zamiast zajmować miejsce w treści. Gdy strona nie korzysta
// ze slotu, target jest pustym divem (bez wizualnego śladu).
//
// Provider żyje w DashboardShell (layout nie remountuje się między stronami),
// więc slot trwa, a portal montuje/odmontowuje się per strona.

import { createContext, useContext, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

const SlotElContext = createContext<HTMLElement | null>(null);
const SetSlotElContext = createContext<(el: HTMLElement | null) => void>(() => {});

export function TopbarSlotProvider({ children }: { children: ReactNode }) {
  const [el, setEl] = useState<HTMLElement | null>(null);
  return (
    <SetSlotElContext.Provider value={setEl}>
      <SlotElContext.Provider value={el}>{children}</SlotElContext.Provider>
    </SetSlotElContext.Provider>
  );
}

/** Miejsce w topbarze, do którego trafi zawartość z TopbarPortal. */
export function TopbarSlotTarget({ className }: { className?: string }) {
  const setEl = useContext(SetSlotElContext);
  return <div ref={setEl} className={className} />;
}

/** Renderuje `children` w slocie topbara (jeśli już istnieje). */
export function TopbarPortal({ children }: { children: ReactNode }) {
  const el = useContext(SlotElContext);
  if (!el) return null;
  return createPortal(children, el);
}
