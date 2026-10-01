import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

// Prywatne części (panel, API, onboarding) poza indeksem — dane gospodarstw.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/dashboard', '/api', '/onboarding'] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
