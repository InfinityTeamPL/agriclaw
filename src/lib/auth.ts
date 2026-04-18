// Auth config AgriClaw — wzorzec z clawlabspro, uproszczony dla MVP
// - Google OAuth + Credentials (bcrypt)
// - JWT session (zgodny z Vercel Fluid Compute, bez DB session lookup)
// - Auto-tworzy User przy pierwszym Google signin (Farm tworzony w onboarding flow)

import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { compare } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/admin';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Hasło', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });

        if (!user || !user.password) return null;

        const passwordOk = await compare(credentials.password, user.password);
        if (!passwordOk) return null;

        if (!user.emailVerified) return null;

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async signIn({ user, account }) {
      // Google signin: auto-utwórz User jeśli nie istnieje
      if (account?.provider === 'google' && user.email) {
        const email = user.email.toLowerCase();
        const existing = await prisma.user.findUnique({ where: { email } });

        if (!existing) {
          await prisma.user.create({
            data: {
              email,
              name: user.name || email.split('@')[0],
              avatarUrl: (user as { image?: string }).image ?? null,
              emailVerified: true,
            },
          });
        } else if (!existing.avatarUrl && (user as { image?: string }).image) {
          await prisma.user.update({
            where: { id: existing.id },
            data: { avatarUrl: (user as { image?: string }).image ?? null },
          });
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email.toLowerCase() },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.isAdmin = isAdmin(dbUser.email);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string; isAdmin?: boolean }).id = token.id as string;
        (session.user as { id?: string; isAdmin?: boolean }).isAdmin = Boolean(token.isAdmin);
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    newUser: '/onboarding',
  },
};
