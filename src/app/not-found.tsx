import Link from 'next/link';
import { MapPinOff } from 'lucide-react';

export const metadata = {
  title: 'Nie znaleziono strony · AgriClaw',
};

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-secondary px-4">
      <div className="max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-lg bg-card border border-border mb-6">
          <MapPinOff className="w-8 h-8 text-muted-foreground" aria-hidden="true" />
        </div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground mb-3">
          Nie znaleziono strony
        </h1>
        <p className="text-muted-foreground leading-relaxed mb-8">
          Tego adresu nie ma albo strona została przeniesiona. Wróć na stronę główną lub do panelu.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center min-h-11 px-6 rounded-md bg-primary text-primary-foreground font-semibold shadow-card hover:brightness-110 transition"
          >
            Przejdź do panelu
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center min-h-11 px-6 rounded-md border border-border bg-card font-medium text-foreground hover:bg-secondary transition"
          >
            Strona główna
          </Link>
        </div>
      </div>
    </main>
  );
}
