// Błędy walidacji Zod → odpowiedź 400 z POLSKIM komunikatem (string), nie obiekt flatten().
// Wcześniej formularze dostawały { error: { fieldErrors } } i pokazywały rolnikowi
// ogólne "Nie udało się zapisać". Teraz `error` to zdanie, a `fields` zostaje do podświetleń.

import { NextResponse } from 'next/server';
import { z, type ZodError } from 'zod';

// Polskie komunikaty zamiast domyślnych angielskich ("Invalid email", "Required").
// Ustawiane globalnie przy pierwszym imporcie tego modułu (każda trasa, która go używa).
const polishErrorMap: z.ZodErrorMap = (issue, ctx) => {
  switch (issue.code) {
    case z.ZodIssueCode.invalid_type:
      return {
        message: issue.received === 'undefined' ? 'To pole jest wymagane.' : 'Nieprawidłowa wartość.',
      };
    case z.ZodIssueCode.invalid_string:
      if (issue.validation === 'email') return { message: 'Podaj poprawny adres email.' };
      if (issue.validation === 'url') return { message: 'Podaj poprawny adres URL.' };
      if (issue.validation === 'uuid') return { message: 'Nieprawidłowy identyfikator.' };
      return { message: 'Nieprawidłowy format.' };
    case z.ZodIssueCode.too_small:
      if (issue.type === 'string') {
        return {
          message: issue.minimum === 1 ? 'To pole nie może być puste.' : `Za krótkie (min. ${issue.minimum} znaków).`,
        };
      }
      if (issue.type === 'array') return { message: `Wymagane co najmniej ${issue.minimum}.` };
      return { message: `Wartość musi być nie mniejsza niż ${issue.minimum}.` };
    case z.ZodIssueCode.too_big:
      if (issue.type === 'string') return { message: `Za długie (max ${issue.maximum} znaków).` };
      if (issue.type === 'array') return { message: `Zbyt wiele elementów (max ${issue.maximum}).` };
      return { message: `Wartość musi być nie większa niż ${issue.maximum}.` };
    case z.ZodIssueCode.invalid_enum_value:
      return { message: 'Wybierz jedną z dostępnych opcji.' };
    default:
      return { message: ctx.defaultError };
  }
};

z.setErrorMap(polishErrorMap);

/** 400 z czytelnym zdaniem w `error` oraz mapą błędów pól w `fields`. */
export function validationError(err: ZodError) {
  const first = err.issues[0];
  const message = first?.message ?? 'Nieprawidłowe dane.';
  return NextResponse.json(
    { error: message, fields: err.flatten().fieldErrors },
    { status: 400 },
  );
}
