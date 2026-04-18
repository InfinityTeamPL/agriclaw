import type { VercelConfig } from '@vercel/config/v1';

export const config: VercelConfig = {
  framework: 'nextjs',
  buildCommand: 'prisma generate && next build',
  functions: {
    'src/app/api/cron/daily/route.ts': { maxDuration: 300 },
    'src/app/api/chat/stream/route.ts': { maxDuration: 800 },
    'src/app/api/analysis/[fieldId]/route.ts': { maxDuration: 120 },
    'src/app/api/agents/deploy/route.ts': { maxDuration: 300 },
  },
  crons: [
    { path: '/api/cron/daily', schedule: '0 4 * * *' },
    { path: '/api/cron/health', schedule: '*/15 * * * *' },
  ],
};
