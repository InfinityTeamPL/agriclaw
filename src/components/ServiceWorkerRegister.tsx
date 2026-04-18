'use client';

import { useEffect } from 'react';

// Rejestruje service worker — tylko w produkcji, żeby nie kolidować z HMR w dev.
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    if (process.env.NODE_ENV !== 'production') return;

    const register = async () => {
      try {
        await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      } catch (err) {
        // Log po cichu — brak SW nie powinien krytycznie łamać aplikacji.
        console.warn('[sw] registration failed', err);
      }
    };

    // Rejestrujemy po window "load" żeby nie konkurować z pierwszym renderem.
    if (document.readyState === 'complete') {
      register();
    } else {
      window.addEventListener('load', register, { once: true });
      return () => window.removeEventListener('load', register);
    }
  }, []);

  return null;
}
