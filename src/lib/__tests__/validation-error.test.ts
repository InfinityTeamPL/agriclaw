import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { validationError } from '@/lib/http/validation-error';
import { apiErrorMessage } from '@/lib/ui/api-error';

const schema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(5),
  age: z.number().min(18),
});

async function run(input: unknown) {
  const parsed = schema.safeParse(input);
  if (parsed.success) throw new Error('oczekiwano błędu');
  const res = validationError(parsed.error);
  return { status: res.status, body: await res.json() };
}

describe('validationError', () => {
  it('zwraca 400 i polskie zdanie w error (string, nie obiekt)', async () => {
    const { status, body } = await run({ email: 'jan@firma', name: 'Jan', age: 30 });
    expect(status).toBe(400);
    expect(body.error).toBe('Podaj poprawny adres email.');
    expect(body.fields.email).toEqual(['Podaj poprawny adres email.']);
  });

  it('brakujące pole to „wymagane", nie angielskie „Required"', async () => {
    const { body } = await run({ name: 'Jan', age: 30 });
    expect(body.error).toBe('To pole jest wymagane.');
  });

  it('za długi tekst i za mała liczba mają polskie komunikaty', async () => {
    const long = await run({ email: 'a@b.pl', name: 'Za długie imię', age: 30 });
    expect(long.body.error).toBe('Za długie (max 5 znaków).');
    const small = await run({ email: 'a@b.pl', name: 'Jan', age: 10 });
    expect(small.body.error).toBe('Wartość musi być nie mniejsza niż 18.');
  });
});

describe('apiErrorMessage', () => {
  it('bierze string z error', () => {
    expect(apiErrorMessage({ error: 'Coś nie tak.' }, 'domyślny')).toBe('Coś nie tak.');
  });

  it('rozumie starszy format Zod flatten()', () => {
    const data = { error: { formErrors: [], fieldErrors: { name: ['Za krótkie'] } } };
    expect(apiErrorMessage(data, 'domyślny')).toBe('Za krótkie');
  });

  it('wraca do komunikatu domyślnego, gdy ciało jest puste lub dziwne', () => {
    expect(apiErrorMessage(null, 'domyślny')).toBe('domyślny');
    expect(apiErrorMessage({ error: '' }, 'domyślny')).toBe('domyślny');
    expect(apiErrorMessage({}, 'domyślny')).toBe('domyślny');
  });
});
