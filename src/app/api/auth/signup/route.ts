import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { rateLimitByIpAsync } from '@/lib/rate-limit';
import { validationError } from '@/lib/http/validation-error';

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Hasło musi mieć co najmniej 8 znaków.'),
  name: z.string().min(1, 'Podaj imię.').max(100, 'Imię jest za długie.'),
});

export async function POST(req: NextRequest) {
  const rl = await rateLimitByIpAsync(req, 5, 15 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json({ error: 'Za dużo prób. Spróbuj za chwilę.' }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const { email, password, name } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return NextResponse.json({ error: 'Konto z tym adresem email już istnieje.' }, { status: 409 });
  }

  const hashed = await hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      password: hashed,
      name,
      emailVerified: true, // MVP: bez email verification flow
    },
    select: { id: true, email: true, name: true },
  });

  return NextResponse.json(user, { status: 201 });
}
