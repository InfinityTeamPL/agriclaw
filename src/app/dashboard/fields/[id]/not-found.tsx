import Link from 'next/link';
import { MapPinOff } from 'lucide-react';

// Pole usunięte, ukryte albo nieistniejące (np. stary link po „Usuń pole").
export default function FieldNotFound() {
  return (
    <div className="max-w-xl mx-auto p-6 sm:p-10 text-center">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-lg bg-card border border-border mb-5">
        <MapPinOff className="w-7 h-7 text-muted-foreground" aria-hidden="true" />
      </div>
      <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
        Nie znaleziono pola
      </h1>
      <p className="mt-2 text-muted-foreground leading-relaxed">
        Takiego pola nie ma na Twoim koncie. Mogło zostać usunięte albo link jest nieaktualny.
      </p>
      <Link
        href="/dashboard/fields"
        className="mt-6 inline-flex items-center justify-center min-h-11 px-6 rounded-md bg-primary text-primary-foreground font-semibold shadow-card hover:brightness-110 transition"
      >
        Wszystkie pola
      </Link>
    </div>
  );
}
