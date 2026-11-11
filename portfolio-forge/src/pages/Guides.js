import React from 'react';
import { Link, useParams } from 'react-router-dom';
import content from '../seo/content.json';
import Seo from '../seo/Seo';
import SiteFooter from '../components/SiteFooter';
import '../components/Legal.css';

export default function Guides() {
  const { slug } = useParams();
  const guide = slug ? content.guides.find((g) => g.slug === slug) : null;
  if (slug && !guide) {
    return (
      <main className="legal-page"><Seo title="Guide not found – Portfolio Forge" path="/guides" noindex />
        <h1>Guide not found</h1><p><Link to="/guides">See all guides</Link></p><SiteFooter /></main>
    );
  }
  if (guide) {
    const others = content.guides.filter((g) => g.slug !== guide.slug);
    return (
      <main className="legal-page article">
        <Seo title={`${guide.title} – Portfolio Forge`} description={guide.description} path={`/guides/${guide.slug}`} article={{ title: guide.title, description: guide.description, date: guide.date }} />
        <p className="crumbs"><Link to="/">Home</Link> / <Link to="/guides">Guides</Link></p>
        <article>
          <h1>{guide.title}</h1>
          <p className="updated">Published {guide.date}</p>
          {guide.sections.map((s) => (<section key={s.h}><h2>{s.h}</h2>{s.p.map((t, i) => <p key={i}>{t}</p>)}</section>))}
        </article>
        <h2>More guides</h2>
        <ul className="guide-list">{others.map((g) => (<li key={g.slug}><Link to={`/guides/${g.slug}`}>{g.title}</Link><p>{g.description}</p></li>))}</ul>
        <p>Ready to apply it? Try the <Link to="/tools/ats">free ATS resume checker</Link> or <Link to="/">build your portfolio</Link>.</p>
        <SiteFooter />
      </main>
    );
  }
  return (
    <main className="legal-page">
      <Seo page="guides" />
      <h1>{content.pages.guides.h1}</h1>
      <p>{content.pages.guides.blurb}</p>
      <ul className="guide-list">{content.guides.map((g) => (<li key={g.slug}><Link to={`/guides/${g.slug}`}>{g.title}</Link><p>{g.description}</p></li>))}</ul>
      <SiteFooter />
    </main>
  );
}
