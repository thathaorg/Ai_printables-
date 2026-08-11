import type { Metadata } from 'next';
import type { Locale } from '@/i18n';

interface SEOConfig {
  title: string;
  description: string;
  keywords?: string[];
  ogImage?: string;
  locale?: Locale;
  canonicalUrl?: string;
}

const defaultKeywords = [
  'coloring pages',
  'tracing worksheets',
  'kids activities',
  'educational worksheets',
  'AI coloring',
  'alphabet tracing',
  'preschool activities',
  'toddler activities',
  'printable worksheets',
  'learning for kids'
];

const siteConfig = {
  name: 'Kiwiz',
  description: 'Free printable worksheets for toddlers — presets for coloring, tracing, and counting. No account needed.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://ai-printables.vercel.app',
  ogImage: '/brand/printables-float.png',
  twitterHandle: '@kiwiz_app',
};

export function generateMetadata({
  title,
  description,
  keywords = defaultKeywords,
  ogImage = siteConfig.ogImage,
  locale = 'en',
  canonicalUrl,
}: SEOConfig): Metadata {
  const fullTitle = title.includes('Kiwiz') ? title : `${title} | Kiwiz`;
  const url = canonicalUrl || siteConfig.url;

  return {
    title: fullTitle,
    description,
    keywords: keywords.join(', '),
    authors: [{ name: 'Kiwiz Team' }],
    creator: 'Kiwiz',
    publisher: 'Kiwiz',
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL(siteConfig.url),
    alternates: {
      canonical: url,
      languages: {
        'en': '/en',
        'fr': '/fr',
        'es': '/es',
        'de': '/de',
      },
    },
    openGraph: {
      type: 'website',
      locale,
      url,
      title: fullTitle,
      description,
      siteName: siteConfig.name,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [ogImage],
      creator: siteConfig.twitterHandle,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    },
  };
}

// Structured Data (JSON-LD) generators
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    logo: `${siteConfig.url}/brand/logo.svg`,
    sameAs: [
      // Add social media URLs here when available
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'support@kiwiz.com',
      contactType: 'Customer Support',
    },
  };
}

export function generateWebApplicationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      ratingCount: '10000',
    },
  };
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${siteConfig.url}${item.url}`,
    })),
  };
}

export function generateArticleSchema(article: {
  title: string;
  description: string;
  image: string;
  datePublished: string;
  dateModified?: string;
  author: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    image: `${siteConfig.url}${article.image}`,
    datePublished: article.datePublished,
    dateModified: article.dateModified || article.datePublished,
    author: {
      '@type': 'Person',
      name: article.author,
    },
    publisher: {
      '@type': 'Organization',
      name: siteConfig.name,
      logo: {
        '@type': 'ImageObject',
        url: `${siteConfig.url}/brand/logo.svg`,
      },
    },
  };
}

