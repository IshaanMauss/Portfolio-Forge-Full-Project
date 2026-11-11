import React, { useEffect } from 'react';
import content from './content.json';
import { SITE_URL } from '../utils/site';

const absolute = (path) => `${SITE_URL}${path === '/' ? '' : path}`;
const ORG = { '@type': 'Organization', name: content.site.name, url: SITE_URL, logo: `${SITE_URL}/logo512.png` };

// Structured data that matches what is visibly on the page. No invented ratings or reviews.
export function buildJsonLd(key, page, extra = {}) {
  const url = absolute(page.path);
  const crumbs = (items) => ({ '@type': 'BreadcrumbList', itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: absolute(path) })) });
  const base = { '@context': 'https://schema.org' };
  if (key === 'home') {
    return [
      { ...base, '@type': 'WebSite', name: content.site.name, url: SITE_URL, description: page.description, inLanguage: 'en' },
      { ...base, ...ORG },
      { ...base, '@type': 'WebApplication', name: content.site.name, url: SITE_URL, applicationCategory: 'BusinessApplication', operatingSystem: 'Any', browserRequirements: 'Requires JavaScript', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } },
    ];
  }
  if (key === 'ats' || key === 'pdf') {
    return [
      { ...base, '@type': 'WebApplication', name: page.h1, url, description: page.description, applicationCategory: 'BusinessApplication', operatingSystem: 'Any', isAccessibleForFree: true, offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, publisher: ORG },
      { ...base, ...crumbs([['Home', '/'], [page.h1, page.path]]) },
    ];
  }
  if (key === 'article') {
    return [
      { ...base, '@type': 'Article', headline: extra.title, description: extra.description, datePublished: extra.date, dateModified: extra.date, mainEntityOfPage: url, author: ORG, publisher: ORG, image: `${SITE_URL}/logo512.png` },
      { ...base, ...crumbs([['Home', '/'], ['Guides', '/guides'], [extra.title, page.path]]) },
    ];
  }
  const type = { about: 'AboutPage', contact: 'ContactPage', collection: 'CollectionPage', page: 'WebPage' }[key] || 'WebPage';
  return [{ ...base, '@type': type, name: page.title, url, description: page.description, isPartOf: { '@type': 'WebSite', name: content.site.name, url: SITE_URL } }, { ...base, ...crumbs([['Home', '/'], [page.h1, page.path]]) }];
}

/**
 * Hoisted <title>/<meta>/<link> (React 19) plus JSON-LD. Pass `page` to use content.json,
 * or title/description/path for dynamic pages. `noindex` keeps private pages out of search.
 */
export default function Seo({ page, title, description, path, noindex = false, article }) {
  const entry = page ? content.pages[page] : null;
  const t = title || entry?.title || content.site.name;
  const d = description || entry?.description || '';
  const p = path || entry?.path || '/';
  const url = absolute(p);
  const ldKey = article ? 'article' : entry?.ld;
  const ld = !noindex && ldKey ? JSON.stringify(buildJsonLd(ldKey, { ...(entry || {}), path: p, title: t, description: d }, article || {})) : '';

  useEffect(() => {
    if (!ld) return undefined;
    const el = document.createElement('script');
    el.type = 'application/ld+json'; el.dataset.seo = '1'; el.text = ld;
    document.head.appendChild(el);
    return () => { if (el.parentNode) el.parentNode.removeChild(el); };
  }, [ld]);

  return (
    <>
      <title>{t}</title>
      {d && <meta name="description" content={d} />}
      <meta name="robots" content={noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large'} />
      {!noindex && <link rel="canonical" href={url} />}
      <meta property="og:site_name" content={content.site.name} />
      <meta property="og:type" content={article ? 'article' : 'website'} />
      <meta property="og:title" content={t} />
      {d && <meta property="og:description" content={d} />}
      {!noindex && <meta property="og:url" content={url} />}
      <meta property="og:image" content={`${SITE_URL}/logo512.png`} />
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={t} />
      {d && <meta name="twitter:description" content={d} />}
    </>
  );
}
