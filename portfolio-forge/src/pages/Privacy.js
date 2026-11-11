import React from 'react';
import { Link } from 'react-router-dom';
import { SITE_NAME, CONTACT_EMAIL, REPO_URL, LEGAL_UPDATED } from '../utils/site';
import '../components/Legal.css';

function Privacy() {
  const contact = CONTACT_EMAIL
    ? <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
    : <a href={`${REPO_URL}/issues`} target="_blank" rel="noopener noreferrer">our GitHub repository</a>;
  return (
    <main className="legal-page">
      <title>Privacy Policy | Portfolio Forge</title>
      <meta name="description" content="What Portfolio Forge stores, why, and how you can export or delete it." />
      <h1>Privacy Policy</h1>
      <p className="updated">Last updated {LEGAL_UPDATED}</p>
      <p>{SITE_NAME} is a free, open-source portfolio and resume builder. This page explains, in plain words, what we handle and what we don&apos;t.</p>

      <h2>The short version</h2>
      <ul>
        <li>The <strong>ATS checker</strong> and <strong>PDF editor</strong> run entirely in your browser. Your PDF is never uploaded to us.</li>
        <li>If you create an account, we store the portfolio you write. Only the copy you click <em>Save &amp; Publish</em> on is public.</li>
        <li>You can download or permanently delete everything from your <Link to="/account">Account</Link> page at any time.</li>
        <li>We don&apos;t sell your data.</li>
      </ul>

      <h2>What we collect, and why</h2>
      <table>
        <thead><tr><th>Data</th><th>Why</th><th>Where / who sees it</th></tr></thead>
        <tbody>
          <tr><td>Google account name, email, photo, and a user ID (when you sign in)</td><td>To sign you in and attach your portfolio to you</td><td>Firebase Authentication (Google Cloud). Not shown publicly by us.</td></tr>
          <tr><td>Your portfolio content: bio, experience, projects, links, theme</td><td>To provide the editor</td><td>Private draft in Cloud Firestore, visible only to you</td></tr>
          <tr><td>Job tracker entries you add (company, role, link, notes, deadlines)</td><td>To provide the tracker</td><td>Private document in Cloud Firestore, visible only to you</td></tr>
          <tr><td>Published copy of your portfolio</td><td>To give you a shareable link</td><td>Cloud Firestore, <strong>public</strong>. Hidden sections and your address are removed first.</td></tr>
          <tr><td>Profile picture you upload</td><td>To show on your portfolio</td><td>Cloud Storage; public if you publish</td></tr>
          <tr><td>AI-assist text you submit (optional)</td><td>To suggest wording</td><td>Sent to Cloudflare Workers AI to generate the reply. We keep only a per-day usage counter.</td></tr>
          <tr><td>GitHub username you type into the import tool</td><td>To list your <em>public</em> repositories</td><td>Sent from your browser straight to GitHub&apos;s public API; we do not store it</td></tr>
          <tr><td>Feedback you choose to send (rating, comment, your email)</td><td>To improve the product</td><td>Private collection in Cloud Firestore, readable only by the maintainer and by you. Deleted with your account.</td></tr>
          <tr><td>Theme choice and similar settings</td><td>To remember your preferences</td><td>Your browser&apos;s local storage only</td></tr>
        </tbody>
      </table>

      <h2>Things that happen without an account</h2>
      <ul>
        <li>Visitors to a public portfolio load fonts from Google Fonts, so Google receives their IP address.</li>
        <li>Our hosting provider (Firebase Hosting) keeps standard server logs.</li>
        <li>We currently run no analytics and no advertising trackers.</li>
      </ul>

      <h2>Cookies and local storage</h2>
      <p>We set no tracking or advertising cookies today. Signing in uses Firebase Authentication, which keeps a sign-in token in your browser&apos;s storage so you stay logged in. We also keep your theme choice there. These are strictly necessary and are removed when you sign out or clear site data.</p>

      <h2>Importing from GitHub or a resume PDF</h2>
      <ul>
        <li>The GitHub import reads <strong>public</strong> repositories only, straight from your browser to GitHub. We never ask for your GitHub password or a token and cannot see private repositories.</li>
        <li>Repository text (README, file names, dependency lists) is held in your browser&apos;s memory while you review it and is discarded when you leave. We do not copy it to our servers. Only the project entries you choose to add are saved to your portfolio.</li>
        <li>Repository text is treated as untrusted data. It is never run as code or sent to an AI model.</li>
        <li>Resume PDFs you import are read inside your browser and never uploaded.</li>
      </ul>

      <h2>Advertising</h2>
      <p>This is a free service and may show ads in the future, only on tool and content pages, never inside the editor. If ads are switched on, we will ask for your choice before any non-essential cookie is set, and you can change it later. Advertising partners may process data under their own privacy policies.</p>

      <h2>Your rights</h2>
      <p>You can access, correct, export and erase your data. Use the <Link to="/account">Account</Link> page for export and deletion; deletion removes your draft, published copies, uploaded pictures and sign-in record. Backups and logs may keep traces for a short period before they expire. Under India&apos;s Digital Personal Data Protection Act and similar laws (such as GDPR), you may also complain to us or the relevant regulator. Write to {contact}.</p>

      <h2>Children</h2>
      <p>{SITE_NAME} is for people aged 18 and over. We do not knowingly collect data from children.</p>

      <h2>Security</h2>
      <p>Data is stored with Google Cloud (Firebase) and protected by access rules that restrict each draft to its owner. No system is perfectly secure; if you find a problem, please report it as described in our <a href={`${REPO_URL}/blob/main/SECURITY.md`} target="_blank" rel="noopener noreferrer">security policy</a>.</p>

      <h2>Changes</h2>
      <p>If this policy changes in a meaningful way we will update the date above and, for account holders, say so in the app.</p>

      <h2>Open source</h2>
      <p>The code is public at <a href={REPO_URL} target="_blank" rel="noopener noreferrer">our repository</a>, so you can check these claims yourself.</p>
    </main>
  );
}

export default Privacy;
