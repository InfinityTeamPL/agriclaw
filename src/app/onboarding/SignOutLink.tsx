'use client';

import { signOut } from 'next-auth/react';

// Wyjście z onboardingu: bez tego rolnik, który założył konto na zły adres e-mail,
// nie miał jak się wylogować (kreator nie ma nawigacji panelu).
export function SignOutLink({ email }: { email: string }) {
  return (
    <p className="text-center text-xs text-muted-foreground">
      Zalogowano jako <span className="font-mono">{email}</span>.{' '}
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: '/login' })}
        className="min-h-8 font-medium text-primary hover:underline"
      >
        To nie Ty? Wyloguj się
      </button>
    </p>
  );
}
