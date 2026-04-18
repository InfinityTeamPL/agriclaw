export { default } from 'next-auth/middleware';

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/onboarding/:path*',
    '/api/fields/:path*',
    '/api/analysis/:path*',
    '/api/agents/:path*',
    '/api/chat/:path*',
    '/api/farms/:path*',
    '/api/diagnose',
    '/api/geocode',
    '/api/treatments/:path*',
    '/api/user',
    '/api/weather/:path*',
    '/api/scouting/:path*',
  ],
};
