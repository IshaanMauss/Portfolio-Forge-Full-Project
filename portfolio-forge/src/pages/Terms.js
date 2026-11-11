import React from 'react';
import { Link } from 'react-router-dom';
import { SITE_NAME, REPO_URL, LEGAL_UPDATED } from '../utils/site';
import '../components/Legal.css';

function Terms() {
  return (
    <main className="legal-page">
      <title>Terms of Use | Portfolio Forge</title>
      <meta name="description" content="The rules for using Portfolio Forge." />
      <h1>Terms of Use</h1>
      <p className="updated">Last updated {LEGAL_UPDATED}</p>
      <p>By using {SITE_NAME} you agree to these terms. They are short on purpose.</p>

      <h2>Who can use it</h2>
      <p>You must be 18 or older. You are responsible for your account and for what you publish.</p>

      <h2>Your content</h2>
      <p>You own what you write and upload. You give us permission to store it and, for what you choose to publish, to display it at your public link. Only publish things you have the right to share, and do not include other people&apos;s private information.</p>

      <h2>Not allowed</h2>
      <ul>
        <li>Illegal content, harassment, hate, or content that sexualises minors.</li>
        <li>Impersonating another person or organisation, or fake credentials.</li>
        <li>Malware, phishing, spam, or links to them.</li>
        <li>Abusing the service: scraping at scale, bypassing limits, or attacking it.</li>
      </ul>
      <p>We may remove content or suspend accounts that break these rules. To report a published page, use the report option on our <a href={`${REPO_URL}/issues`} target="_blank" rel="noopener noreferrer">repository</a>.</p>

      <h2>Tools run on your device</h2>
      <p>The ATS checker gives an <strong>estimate</strong> based on common parsing checks. It is not the score of any employer&apos;s system and is no guarantee of any outcome. Always keep a copy of your original files before editing PDFs.</p>

      <h2>AI features</h2>
      <p>AI suggestions can be wrong. Review them before you use them. Daily limits apply.</p>

      <h2>Free service, no warranty</h2>
      <p>The service is provided &ldquo;as is&rdquo;, free of charge, without warranties of any kind. To the extent the law allows, we are not liable for lost data or indirect losses. Export your data from the <Link to="/account">Account</Link> page whenever you like.</p>

      <h2>Open-source code</h2>
      <p>The source code is licensed under the licence in the repository. These terms cover the hosted service; the name and logo are not covered by the code licence.</p>

      <h2>Law</h2>
      <p>These terms are governed by the laws of India, and courts in India have jurisdiction, unless your local consumer law says otherwise.</p>

      <h2>Privacy</h2>
      <p>See our <Link to="/privacy">Privacy Policy</Link> for how data is handled.</p>
    </main>
  );
}

export default Terms;
