/** Publiczny adres aplikacji — linki absolutne w OG, sitemap, robots. */
export const SITE_URL = (process.env.NEXTAUTH_URL || 'https://agripol.xyz').replace(/\/$/, '');
