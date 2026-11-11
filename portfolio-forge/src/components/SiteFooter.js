import React from 'react';
import { Link } from 'react-router-dom';
import { SITE_NAME, REPO_URL } from '../utils/site';
import './Legal.css';

// Real, always-visible footer for public pages. Legal and contact links must be easy to find.
export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <nav aria-label="Footer">
        <Link to="/">Home</Link>
        <Link to="/tools/ats">ATS checker</Link>
        <Link to="/tools/pdf">PDF editor</Link>
        <Link to="/guides">Guides</Link>
        <Link to="/about">About</Link>
        <Link to="/contact">Contact</Link>
        <Link to="/privacy">Privacy</Link>
        <Link to="/terms">Terms</Link>
        <a href={REPO_URL} target="_blank" rel="noopener noreferrer">Source code</a>
      </nav>
      <p>© {new Date().getFullYear()} {SITE_NAME}. Free and open source.</p>
    </footer>
  );
}
