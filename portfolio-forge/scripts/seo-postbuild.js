/* eslint-disable */
// Runs after `react-scripts build`. Turns the single-page shell into real, crawlable HTML for every
// public route (title, description, canonical, Open Graph, JSON-LD and readable content), and writes
// sitemap.xml and robots.txt. Keeps the original shell as app.html for dynamic routes (/p/..., editor).
const fs = require('fs');
const path = require('path');

const BUILD = path.join(__dirname, '..', 'build');
const content = require('../src/seo/content.json');
const SITE = (process.env.REACT_APP_SITE_URL || 'https://portfolio-forge-4e0a9.web.app').replace(/\/+$/, '');
const NAME = content.site.name;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const abs = (p) => `${SITE}${p === '/' ? '' : p}`;
const today = new Date().toISOString().slice(0, 10);

const shell = fs.readFileSync(path.join(BUILD, 'index.html'), 'utf8');
if (!shell.includes('<div id="root"></div>')) throw new Error('seo-postbuild: root element not found in build/index.html');
fs.writeFileSync(path.join(BUILD, 'app.html'), shell);

const ORG = { '@type': 'Organization', name: NAME, url: SITE, logo: `${SITE}/logo512.png` };
const crumbs = (items) => ({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map(([n, p], i) => ({ '@type': 'ListItem', position: i + 1, name: n, item: abs(p) })) });
const app = (name, url, d) => ({ '@context': 'https://schema.org', '@type': 'WebApplication', name, url, description: d, applicationCategory: 'BusinessApplication', operatingSystem: 'Any', isAccessibleForFree: true, offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, publisher: ORG });
const ldFor = (key, pg) => {
  const url = abs(pg.path);
  if (key === 'home') return [{ '@context': 'https://schema.org', '@type': 'WebSite', name: NAME, url: SITE, description: pg.description, inLanguage: 'en' }, { '@context': 'https://schema.org', ...ORG }, { '@context': 'https://schema.org', '@type': 'WebApplication', name: NAME, url: SITE, applicationCategory: 'BusinessApplication', operatingSystem: 'Any', browserRequirements: 'Requires JavaScript', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } }];
  if (key === 'app') return [app(pg.h1, url, pg.description), crumbs([['Home', '/'], [pg.h1, pg.path]])];
  const type = { about: 'AboutPage', contact: 'ContactPage', collection: 'CollectionPage', page: 'WebPage' }[key] || 'WebPage';
  return [{ '@context': 'https://schema.org', '@type': type, name: pg.title, url, description: pg.description, isPartOf: { '@type': 'WebSite', name: NAME, url: SITE } }, crumbs([['Home', '/'], [pg.h1, pg.path]])];
};

const NAV = [['/', 'Home'], ['/tools/ats', 'ATS checker'], ['/tools/pdf', 'PDF editor'], ['/guides', 'Guides'], ['/about', 'About'], ['/contact', 'Contact'], ['/privacy', 'Privacy'], ['/terms', 'Terms']];
const navHtml = `<nav aria-label="Main">${NAV.map(([p, n]) => `<a href="${p}">${esc(n)}</a>`).join(' · ')}</nav>`;

function render({ title, description, p, ld, body, type = 'website' }) {
  const url = abs(p);
  const head = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}" />`,
    `<meta name="robots" content="index, follow, max-image-preview:large" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:site_name" content="${esc(NAME)}" />`,
    `<meta property="og:type" content="${type}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${SITE}/logo512.png" />`,
    `<meta name="twitter:card" content="summary" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(description)}" />`,
    ...ld.map((o) => `<script type="application/ld+json" data-prerender="1">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`),
  ].join('\n    ');
  let html = shell
    .replace(/<title>[\s\S]*?<\/title>/, '')
    .replace(/<meta\s+name="description"[\s\S]*?\/>/, '')
    .replace(/<meta\s+property="og:[^>]*>/g, '')
    .replace('</head>', `    ${head}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root"><header data-prerender="1">${navHtml}</header><main data-prerender="1">${body}</main></div>`);
  return html;
}

function write(rel, html) {
  const file = path.join(BUILD, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
}

const urls = [];
Object.entries(content.pages).forEach(([key, pg]) => {
  const body = `<h1>${esc(pg.h1)}</h1><p>${esc(pg.blurb)}</p>` + (key === 'guides' ? `<ul>${content.guides.map((g) => `<li><a href="/guides/${g.slug}">${esc(g.title)}</a> – ${esc(g.description)}</li>`).join('')}</ul>` : '');
  const html = render({ title: pg.title, description: pg.description, p: pg.path, ld: ldFor(pg.ld, pg), body });
  write(pg.path === '/' ? 'index.html' : `${pg.path.replace(/^\//, '')}.html`, html);
  urls.push([pg.path, key === 'home' ? '1.0' : '0.8']);
});
content.guides.forEach((g) => {
  const p = `/guides/${g.slug}`;
  const body = `<article><h1>${esc(g.title)}</h1><p>Published ${esc(g.date)}</p>${g.sections.map((s) => `<section><h2>${esc(s.h)}</h2>${s.p.map((t) => `<p>${esc(t)}</p>`).join('')}</section>`).join('')}</article>`;
  const ld = [
    { '@context': 'https://schema.org', '@type': 'Article', headline: g.title, description: g.description, datePublished: g.date, dateModified: g.date, mainEntityOfPage: abs(p), author: ORG, publisher: ORG, image: `${SITE}/logo512.png` },
    crumbs([['Home', '/'], ['Guides', '/guides'], [g.title, p]]),
  ];
  write(`guides/${g.slug}.html`, render({ title: `${g.title} – ${NAME}`, description: g.description, p, ld, body, type: 'article' }));
  urls.push([p, '0.7']);
});

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(([p, pr]) => `  <url><loc>${abs(p)}${p === '/' ? '/' : ''}</loc><lastmod>${today}</lastmod><priority>${pr}</priority></url>`).join('\n')}\n</urlset>\n`;
fs.writeFileSync(path.join(BUILD, 'sitemap.xml'), sitemap);
fs.writeFileSync(path.join(BUILD, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /tracker\nDisallow: /account\nDisallow: /resume/\nDisallow: /api_v2/\n\nSitemap: ${SITE}/sitemap.xml\n`);
console.log(`seo-postbuild: ${urls.length} pages, sitemap.xml, robots.txt, app.html (site ${SITE})`);
