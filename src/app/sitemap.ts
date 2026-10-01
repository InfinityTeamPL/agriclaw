import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: Array<[string, number]> = [
    ['', 1],
    ['/beta', 0.8],
    ['/signup', 0.6],
    ['/login', 0.4],
    ['/privacy', 0.2],
    ['/terms', 0.2],
  ];
  return pages.map(([path, priority]) => ({ url: `${SITE_URL}${path}`, changeFrequency: 'weekly', priority }));
}
