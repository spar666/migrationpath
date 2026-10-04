import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SITE_URL = 'https://migrationpath.com.au';
const SITE_NAME = 'MigrationPath';
const DEFAULT_DESCRIPTION =
  'Explore Australian visa pathways, calculate skilled migration points, search occupations and check employer-sponsored eligibility.';

type SeoConfig = {
  title: string;
  description: string;
  noIndex?: boolean;
};

const exactPages: Record<string, SeoConfig> = {
  '/': {
    title: 'Australian Visa Pathways & Migration Tools | MigrationPath',
    description: DEFAULT_DESCRIPTION,
  },
  '/points-calculator': {
    title: 'Australian Skilled Migration Points Calculator | MigrationPath',
    description:
      'Estimate your Australian skilled migration points and understand the factors that may affect your visa pathway.',
  },
  '/occupation-search': {
    title: 'Australian Skilled Occupation Search | MigrationPath',
    description:
      'Search Australian skilled occupations and explore the visa pathways and occupation lists connected to your role.',
  },
  '/consultation': {
    title: 'Australian Migration Consultation | MigrationPath',
    description:
      'Discuss your Australian visa options and migration strategy with a registered migration professional.',
  },
  '/get-started': {
    title: 'Find Your Australian Visa Pathway | MigrationPath',
    description:
      'Answer a few questions to find the most relevant Australian migration assessment for your circumstances.',
  },
  '/pre-screen': {
    title: 'Employer Sponsored Visa Eligibility Check | MigrationPath',
    description:
      'Complete an indicative eligibility check for Australian employer-sponsored visa pathways, including subclasses 482 and 186.',
  },
  '/partner-audit': {
    title: 'Australian Sponsorship Eligibility Check | MigrationPath',
    description:
      'Check indicative eligibility for an Australian employer-sponsored visa or assess whether a business may be ready to sponsor a worker.',
  },
  '/news': {
    title: 'Australian Immigration News & Visa Updates | MigrationPath',
    description:
      'Read Australian immigration news, visa policy updates, occupation-list changes and practical migration insights.',
  },
  '/pathways/skilled': {
    title: 'Skilled Migration Pathways to Australia | MigrationPath',
    description:
      'Explore Australian skilled migration pathways, points requirements, occupation lists and state nomination options.',
  },
  '/pathways/partner': {
    title: 'Australian Partner Visa Pathways | MigrationPath',
    description:
      'Understand Australian partner visa pathways, key eligibility considerations and the steps involved in preparing an application.',
  },
  '/pathways/employer': {
    title: 'Employer Sponsored Visa Pathways | MigrationPath',
    description:
      'Explore Australian employer-sponsored visa options for skilled workers and sponsoring businesses.',
  },
  '/pathways/485': {
    title: 'Temporary Graduate Visa Subclass 485 Enquiry | MigrationPath',
    description:
      'Request an assessment of your Temporary Graduate visa subclass 485 options after completing eligible Australian study.',
  },
  '/pathways/858': {
    title: 'National Innovation Visa Subclass 858 Enquiry | MigrationPath',
    description:
      'Request an assessment for Australia’s National Innovation visa subclass 858 pathway for internationally recognised talent.',
  },
};

function setMeta(selector: string, attributes: Record<string, string>) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement('meta');
    document.head.appendChild(element);
  }
  Object.entries(attributes).forEach(([name, value]) => element!.setAttribute(name, value));
}

function routeConfig(pathname: string): SeoConfig {
  if (exactPages[pathname]) return exactPages[pathname];
  if (pathname.startsWith('/news/')) {
    return {
      title: 'Australian Immigration Article | MigrationPath',
      description: 'Read Australian immigration analysis and visa pathway updates from MigrationPath.',
    };
  }
  if (pathname.startsWith('/visas/')) {
    const parts = pathname.split('/').filter(Boolean).slice(1).map(decodeURIComponent);
    const label = parts.join(' ').replace(/-/g, ' ');
    return {
      title: `${label ? `${label} Visa Information` : 'Australian Visa Information'} | MigrationPath`,
      description: `Explore eligibility information and next steps for ${label || 'Australian visa pathways'}.`,
    };
  }
  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/consult/schedule') ||
    pathname.startsWith('/consult/book') ||
    pathname.startsWith('/consult/confirmed')
  ) {
    return {
      title: `Secure page | ${SITE_NAME}`,
      description: 'Secure MigrationPath workflow.',
      noIndex: true,
    };
  }
  return {
    title: `Page not found | ${SITE_NAME}`,
    description: DEFAULT_DESCRIPTION,
    noIndex: true,
  };
}

function upsertJsonLd(id: string, value: object) {
  let script = document.getElementById(id) as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(value);
}

export function SiteSeo() {
  const { pathname } = useLocation();

  useEffect(() => {
    const normalizedPath = pathname === '/' ? '/' : pathname.replace(/\/+$/, '');
    const config = routeConfig(normalizedPath);
    const canonical = `${SITE_URL}${normalizedPath === '/' ? '' : normalizedPath}`;

    document.title = config.title;
    setMeta('meta[name="description"]', { name: 'description', content: config.description });
    setMeta('meta[name="robots"]', {
      name: 'robots',
      content: config.noIndex
        ? 'noindex, nofollow'
        : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
    });
    setMeta('meta[property="og:title"]', { property: 'og:title', content: config.title });
    setMeta('meta[property="og:description"]', { property: 'og:description', content: config.description });
    setMeta('meta[property="og:url"]', { property: 'og:url', content: canonical });
    setMeta('meta[property="og:type"]', { property: 'og:type', content: 'website' });
    setMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: SITE_NAME });
    setMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary' });
    setMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: config.title });
    setMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: config.description });

    let canonicalLink = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = canonical;

    upsertJsonLd('site-identity-jsonld', {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          '@id': `${SITE_URL}/#organization`,
          name: SITE_NAME,
          url: SITE_URL,
        },
        {
          '@type': 'WebSite',
          '@id': `${SITE_URL}/#website`,
          url: SITE_URL,
          name: SITE_NAME,
          publisher: { '@id': `${SITE_URL}/#organization` },
          inLanguage: 'en-AU',
        },
        {
          '@type': 'WebPage',
          '@id': `${canonical}#webpage`,
          url: canonical,
          name: config.title,
          description: config.description,
          isPartOf: { '@id': `${SITE_URL}/#website` },
          inLanguage: 'en-AU',
        },
      ],
    });
  }, [pathname]);

  return null;
}

type PageSeoProps = {
  title: string;
  description: string;
  type?: 'website' | 'article';
  datePublished?: string;
  dateModified?: string;
};

/** Overrides route defaults once API-backed page content is available. */
export function PageSeo({
  title,
  description,
  type = 'website',
  datePublished,
  dateModified,
}: PageSeoProps) {
  const { pathname } = useLocation();

  useEffect(() => {
    const canonical = `${SITE_URL}${pathname === '/' ? '' : pathname.replace(/\/+$/, '')}`;
    const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
    document.title = fullTitle;
    setMeta('meta[name="description"]', { name: 'description', content: description });
    setMeta('meta[property="og:title"]', { property: 'og:title', content: fullTitle });
    setMeta('meta[property="og:description"]', { property: 'og:description', content: description });
    setMeta('meta[property="og:type"]', { property: 'og:type', content: type });
    setMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: fullTitle });
    setMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: description });

    const schema = type === 'article'
      ? {
          '@context': 'https://schema.org',
          '@type': 'Article',
          '@id': `${canonical}#article`,
          headline: title,
          description,
          datePublished,
          dateModified: dateModified ?? datePublished,
          mainEntityOfPage: { '@id': `${canonical}#webpage` },
          publisher: { '@id': `${SITE_URL}/#organization` },
          inLanguage: 'en-AU',
        }
      : {
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          '@id': `${canonical}#detail`,
          url: canonical,
          name: title,
          description,
          isPartOf: { '@id': `${SITE_URL}/#website` },
          inLanguage: 'en-AU',
        };
    upsertJsonLd('page-detail-jsonld', schema);

    return () => document.getElementById('page-detail-jsonld')?.remove();
  }, [dateModified, datePublished, description, pathname, title, type]);

  return null;
}
