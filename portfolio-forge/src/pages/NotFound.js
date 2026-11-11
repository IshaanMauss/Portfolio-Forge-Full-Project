import React from 'react';
import { Link } from 'react-router-dom';
import Seo from '../seo/Seo';
import SiteFooter from '../components/SiteFooter';
import '../components/Legal.css';

// Rendered for unknown URLs. noindex stops search engines treating them as real pages.
export default function NotFound() {
  return (
    <main className="legal-page">
      <Seo title="Page not found – Portfolio Forge" path="/404" noindex />
      <h1>Page not found</h1>
      <p>We couldn&apos;t find that page. It may have moved, or the link may be wrong.</p>
      <p><Link to="/">Go to the home page</Link> or browse our <Link to="/guides">guides</Link>.</p>
      <SiteFooter />
    </main>
  );
}
