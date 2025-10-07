import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db, auth } from '../firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';

function PublicPortfolio() {
  const { userId, versionId } = useParams();
  const [portfolioData, setPortfolioData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPageUrl, setCurrentPageUrl] = useState('');
  
  const currentUser = auth.currentUser;

  useEffect(() => {
    setCurrentPageUrl(window.location.href);
    if (!userId) {
      setLoading(false);
      return;
    }
    const docRef = doc(db, "portfolios", userId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const fullData = docSnap.data();
        const versionToShow = versionId || fullData.meta?.activeVersion || 'default';
        setPortfolioData(fullData.portfolios[versionToShow]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [userId, versionId]);

  const formatUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `https://${url}`;
  };

  const isFutureYear = (year) => {
    if (!year || isNaN(year)) return false;
    const currentYear = new Date().getFullYear();
    return parseInt(year) > currentYear;
  };

  if (loading || !portfolioData) return <div className="loading-screen">Loading...</div>;

  const { theme = {}, userName, userSubtitle, profilePicUrl, bio, location, links, projects = { items: [] }, hardSkills = { items: [] }, softSkills = { items: [] }, interests = { items: [] }, education = {}, certifications = { items: [] }, blogPosts = { showOnPage: false, items: [] }, customSections = { showOnPage: false, items: [] } } = portfolioData;
  const layoutClass = theme.layout === 'compact' ? 'layout-compact' : 'layout-standard';
  const linkedInShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentPageUrl)}`;

  // --- THE FIX: Check if there's at least one link to show the contact section ---
  const showContactSection = links?.email || links?.linkedin || links?.github;

  return (
    <div className={`public-portfolio-container ${layoutClass}`} style={{ backgroundColor: theme.backgroundColor, color: theme.textColor }}>
      <header className="hero-public">
        <div className="hero-main-content">
          {profilePicUrl && <img src={profilePicUrl} alt="Profile" className="profile-pic-public" style={{ borderColor: theme.accentColor }}/>}
          <div className="hero-text">
            <h1>{userName}</h1>
            <h2 style={{ color: theme.accentColor }}>{userSubtitle}</h2>
            {location?.showOnPage && <p className="location-public">{location.value}</p>}
          </div>
        </div>
        <div className="hero-actions">
          {currentUser && currentUser.uid === userId && (
            <a href={linkedInShareUrl} target="_blank" rel="noopener noreferrer" className="linkedin-share-btn">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18px" height="18px"><path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.25 6.5 1.75 1.75 0 016.5 8.25zM19 19h-3v-4.75c0-1.4-1.2-2.5-2.5-2.5S11 12.85 11 14.25V19h-3v-9h2.9v1.3a3.11 3.11 0 012.6-1.4c2.5 0 4.5 2.2 4.5 5.1V19z"></path></svg>
              Share on LinkedIn
            </a>
          )}
        </div>
      </header>

      <div className="main-content-public">
        <main className="main-column-public">
          <section className="section-public about-section"><h3 style={{ borderBottomColor: theme.accentColor }}>About Me</h3><p>{bio}</p></section>
          {projects?.showOnPage && <section className="section-public projects-section"><h3 style={{ borderBottomColor: theme.accentColor }}>Projects</h3><div className="grid-container">{projects.items.map((p, i) => (<div key={i} className="item-card-public"><h4>{p.title}</h4><p>{p.description}</p><div className="project-links-public">{p.liveUrl && <a href={formatUrl(p.liveUrl)} target="_blank" rel="noopener noreferrer">Live Demo</a>}{p.githubUrl && <a href={formatUrl(p.githubUrl)} target="_blank" rel="noopener noreferrer">GitHub</a>}</div></div>))}</div></section>}
          {certifications?.showOnPage && certifications.items.length > 0 && <section className="section-public certifications-section"><h3 style={{ borderBottomColor: theme.accentColor }}>Certifications</h3><div className="grid-container">{certifications.items.map((c, i) => (<div key={i} className="item-card-public"><h4>{c.name}</h4><p>{c.issuer}</p></div>))}</div></section>}
          {blogPosts?.showOnPage && <section className="section-public blog-section-public"><h3 style={{ borderBottomColor: theme.accentColor }}>Blog Posts</h3><div className="grid-container">{blogPosts.items.map((p, i) => (<div key={i} className="item-card-public"><h4>{p.title}</h4><p>{p.content}</p></div>))}</div></section>}
          {customSections?.showOnPage && customSections.items.length > 0 && <section className="section-public custom-section"><h3 style={{ borderBottomColor: theme.accentColor }}>{customSections.title || 'Custom Section'}</h3><div className="grid-container">{customSections.items.map((item, i) => (<div key={i} className="item-card-public"><h4>{item.title}</h4><p>{item.content}</p></div>))}</div></section>}
        </main>
        <aside className="sidebar-column-public">
          {/* --- THE FIX IS HERE --- */}
          {showContactSection && (
            <section className="section-public card-public contact-section">
              <h4>Contact</h4>
              {links?.email && <a href={`mailto:${links.email}`}>{links.email}</a>}
              {links?.linkedin && <a href={formatUrl(links.linkedin)} target="_blank" rel="noopener noreferrer">LinkedIn</a>}
              {links?.github && <a href={formatUrl(links.github)} target="_blank" rel="noopener noreferrer">GitHub</a>}
            </section>
          )}
          {hardSkills?.showOnPage && <section className="section-public card-public hardskills-section"><h4>Hard Skills</h4><ul className="skills-list-public">{hardSkills.items.map(s => <li key={s} style={{ backgroundColor: theme.accentColor, color: theme.backgroundColor }}>{s}</li>)}</ul></section>}
          {softSkills?.showOnPage && <section className="section-public card-public softskills-section"><h4>Soft Skills</h4><ul className="skills-list-public">{softSkills.items.map(s => <li key={s} style={{ backgroundColor: theme.accentColor, color: theme.backgroundColor }}>{s}</li>)}</ul></section>}
          {interests?.showOnPage && <section className="section-public card-public interests-section"><h4>Interests & Hobbies</h4><ul className="skills-list-public">{interests.items.map(i => <li key={i} style={{ backgroundColor: theme.accentColor, color: theme.backgroundColor }}>{i}</li>)}</ul></section>}
          {(education?.college?.showOnPage || education?.class12?.showOnPage || education?.class10?.showOnPage) && (
            <section className="section-public card-public education-section">
              <h4>Education</h4>
              <div className="grid-container education-grid">
                {education.college?.showOnPage && (
                  <div className="item-card-public">
                    <strong>{education.college.name}</strong>
                    <p>{education.college.course} - {education.college.gradYear}
                      {isFutureYear(education.college.gradYear) && <span className="expected-year"> (Expected)</span>}
                    </p>
                  </div>
                )}
                {education.class12?.showOnPage && (
                  <div className="item-card-public">
                    <strong>Class XII - {education.class12.board}</strong>
                    <p>{education.class12.school}, {education.class12.passingYear}</p>
                    <p>Percentage: {education.class12.percentage}%</p>
                  </div>
                )}
                {education.class10?.showOnPage && (
                  <div className="item-card-public">
                    <strong>Class X - {education.class10.board}</strong>
                    <p>{education.class10.school}, {education.class10.passingYear}</p>
                    <p>Percentage: {education.class10.percentage}%</p>
                  </div>
                )}
              </div>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
export default PublicPortfolio;