import React from 'react';
import { Link } from 'react-router-dom';
import Seo from '../seo/Seo';
import SiteFooter from '../components/SiteFooter';
import { SITE_NAME, REPO_URL } from '../utils/site';
import '../components/Legal.css';

export default function About() {
  return (
    <main className="legal-page">
      <Seo page="about" />
      <h1>About {SITE_NAME}</h1>
      <p>{SITE_NAME} is a free portfolio and resume builder. It exists because good job-search tools are often locked behind subscriptions, and because many people, especially students and early-career developers, need more than one version of themselves: one portfolio for jobs, another for freelance work, another for college applications.</p>

      <h2>What you can do here</h2>
      <ul>
        <li>Write your portfolio once and keep separate versions for different goals.</li>
        <li>Share each published version with its own public link.</li>
        <li>Download a text-based PDF resume that applicant tracking systems can read.</li>
        <li>Check a resume with the <Link to="/tools/ats">ATS checker</Link>, and merge, rotate or sign PDFs with the <Link to="/tools/pdf">PDF editor</Link>. Both run in your browser and never upload your file.</li>
        <li>Read our <Link to="/guides">guides</Link> on resumes, portfolios and project write-ups.</li>
      </ul>

      <h2>How it is funded</h2>
      <p>The editor and tools are free. To cover hosting, the free tools and guide pages may show advertising in the future. Ads will never appear inside the editor, and we will ask for your choice before any non-essential cookie is set. Details are in the <Link to="/privacy">Privacy Policy</Link>.</p>

      <h2>How your data is handled</h2>
      <p>Your draft is private and visible only to you. Only the copy you choose to publish is public, and sections you hide are removed first. You can export or permanently delete everything from your account page at any time. We do not sell your data.</p>

      <h2>Who makes it</h2>
      <p>{SITE_NAME} is built and maintained by an independent developer in India, published under the name WRAP. The code is open source, so anyone can read how it works at <a href={REPO_URL} target="_blank" rel="noopener noreferrer">our repository</a>, suggest changes or report problems.</p>

      <h2>Accuracy and limits</h2>
      <p>The ATS checker is an estimate based on common parsing checks. It is not the score of any specific employer&apos;s system and does not guarantee any outcome. AI suggestions can be wrong, so always review them before using them.</p>

      <p>Questions or feedback? See the <Link to="/contact">contact page</Link>.</p>
      <SiteFooter />
    </main>
  );
}
