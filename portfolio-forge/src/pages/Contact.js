import React from 'react';
import { Link } from 'react-router-dom';
import Seo from '../seo/Seo';
import SiteFooter from '../components/SiteFooter';
import { SITE_NAME, CONTACT_EMAIL, REPO_URL } from '../utils/site';
import '../components/Legal.css';

export default function Contact() {
  return (
    <main className="legal-page">
      <Seo page="contact" />
      <h1>Contact</h1>
      <p>The best way to reach the {SITE_NAME} maintainer depends on what you need.</p>
      <h2>Support, questions and feedback</h2>
      <p>{CONTACT_EMAIL ? <>Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. </> : null}You can also open an issue on <a href={`${REPO_URL}/issues`} target="_blank" rel="noopener noreferrer">GitHub</a>. If you are signed in, the feedback form after publishing sends your comments privately to the maintainer.</p>
      <h2>Privacy requests</h2>
      <p>You can download or delete all of your data yourself from the <Link to="/account">Account</Link> page. For anything else, such as a question about how data is handled, write to us and we will reply as soon as we can. See the <Link to="/privacy">Privacy Policy</Link>.</p>
      <h2>Report a published page</h2>
      <p>If a public portfolio breaks our <Link to="/terms">Terms of Use</Link>, report it with the page link on <a href={`${REPO_URL}/issues`} target="_blank" rel="noopener noreferrer">GitHub</a>{CONTACT_EMAIL ? <> or by email</> : null}.</p>
      <h2>Security issues</h2>
      <p>Please report vulnerabilities privately as described in our <a href={`${REPO_URL}/blob/main/SECURITY.md`} target="_blank" rel="noopener noreferrer">security policy</a> instead of posting them publicly.</p>
      <SiteFooter />
    </main>
  );
}
