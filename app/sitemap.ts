import { MetadataRoute } from 'next';
import { locales } from '@/i18n';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ai-coloring-and-tracing.vercel.app';

  // Define all routes
  const routes = [
    '',
    '/create',
    '/dashboard',
    '/how-to-use',
    '/about-us',
    '/parenting-newsletter',
  ];

  // Generate sitemap entries for each route and locale
  const sitemapEntries: MetadataRoute.Sitemap = [];

  routes.forEach((route) => {
    // Add default English version (no locale prefix)
    sitemapEntries.push({
      url: `${baseUrl}${route}`,
      lastModified: new Date(),
      changeFrequency: route === '' ? 'daily' : 'weekly',
      priority: route === '' ? 1 : 0.8,
      alternates: {
        languages: locales.reduce((acc, locale) => {
          acc[locale] = `${baseUrl}/${locale}${route}`;
          return acc;
        }, {} as Record<string, string>),
      },
    });

    // Add other locales
    locales.filter((locale) => locale !== 'en').forEach((locale) => {
      sitemapEntries.push({
        url: `${baseUrl}/${locale}${route}`,
        lastModified: new Date(),
        changeFrequency: route === '' ? 'daily' : 'weekly',
        priority: route === '' ? 1 : 0.8,
      });
    });
  });

  return sitemapEntries;
}

