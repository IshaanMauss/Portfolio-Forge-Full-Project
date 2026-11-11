// Site-wide constants used by the legal pages. Set REACT_APP_CONTACT_EMAIL in .env.local / hosting env.
export const SITE_NAME = 'Portfolio Forge';
export const CONTACT_EMAIL = process.env.REACT_APP_CONTACT_EMAIL || '';
export const REPO_URL = 'https://github.com/IshaanMauss/Portfolio-Forge-Full-Project';
export const LEGAL_UPDATED = '11 November 2026';

// Canonical origin for SEO tags, sitemap and structured data. Set REACT_APP_SITE_URL to your custom domain.
export const SITE_URL = (process.env.REACT_APP_SITE_URL || 'https://portfolio-forge-4e0a9.web.app').replace(/\/+$/, '');
