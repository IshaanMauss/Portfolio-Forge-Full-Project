import React, { useState, Suspense, lazy } from 'react';
import { useParams } from 'react-router-dom';
import { usePublishedPortfolio } from '../hooks/usePublishedPortfolio';
import { safeUrl } from '../utils/escape';
import ToggleSwitch from './ToggleSwitch';
import './Resume.css';
import { toast } from 'react-toastify';
import Seo from '../seo/Seo';

const ResumePdfPreview = lazy(() => import('./ResumePdfPreview'));

function Resume() {
  const { userId, versionId } = useParams();
  const { data: portfolioData, loading } = usePublishedPortfolio(userId, versionId);
  const [applyTheme, setApplyTheme] = useState(false);
  const [showPdf, setShowPdf] = useState(false);

  const formatUrl = safeUrl;

  const isFutureYear = (year) => {
    if (!year || isNaN(year)) return false;
    const currentYear = new Date().getFullYear();
    return parseInt(year) > currentYear;
  };

  const printResume = () => window.print();

  const downloadPdf = async () => {
    try {
      const { buildResumePdf } = await import('../utils/resumePdf');
      const { bytes } = await buildResumePdf(portfolioData, portfolioData.resume);
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${(portfolioData.userName || 'Resume').replace(/[^\w.-]+/g, '_')}_Resume.pdf`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      toast.success('PDF downloaded. It contains real, selectable text.');
    } catch (err) {
      console.error('PDF generation error:', err);
      toast.error('Could not generate the PDF. Please try again.');
    }
  };

  if (loading) return <div className="loading-screen">Loading Resume...</div>;
  if (!portfolioData) return <div className="loading-screen">Could not find resume data.</div>;

  const {
    userName, userSubtitle, location, links, bio, portfolioLink,
    blogPosts = { items: [] }, customSections = { items: [] },
    hardSkills = { items: [] }, softSkills = { items: [] },
    interests = { items: [] }, certifications = { items: [] },
    projects = { items: [] }, education, 
    profilePicUrl,
    theme = {}
  } = portfolioData;

  const dynamicStyles = {
    '--accent-color': theme.accentColor || '#64ffda',
    '--bg-color': theme.backgroundColor || '#0a192f',
    '--text-color': theme.textColor || '#333',
    '--header-color': theme.textColor || '#112240',
  };

  const imageToDisplay = profilePicUrl;

  return (
    <>
      <Seo title={`${userName || 'Resume'} – Resume`} path="/resume" noindex />
      <div className="resume-actions">
        <div className="theme-toggle-wrapper">
          <ToggleSwitch label="Apply Portfolio Theme" checked={applyTheme} onChange={() => setApplyTheme(!applyTheme)} />
        </div>
        <button onClick={downloadPdf} title="Real-text PDF, readable by applicant tracking systems">Download PDF</button>
        <button onClick={() => setShowPdf((v) => !v)} aria-pressed={showPdf}>{showPdf ? 'Show web view' : 'Preview PDF'}</button>
        <button onClick={printResume} title="Opens the print dialog (web layout)">Print</button>
      </div>
      {showPdf && (
        <div className="resume-pdf-preview">
          <Suspense fallback={<p className="muted">Building preview…</p>}><ResumePdfPreview data={portfolioData} settings={portfolioData.resume} width={640} /></Suspense>
        </div>
      )}
      <div id="resume-content" className={`resume-container ${applyTheme ? 'theme-applied' : ''}`} style={showPdf ? { display: 'none' } : (applyTheme ? dynamicStyles : {})}>
        <header className="resume-header">
          {imageToDisplay && <img id="resume-profile-pic" src={imageToDisplay} alt="Profile" referrerPolicy="no-referrer" crossOrigin="anonymous" className="profile-pic-resume" />}
          <h1>{userName}</h1>
          <p className="subtitle">{userSubtitle}</p>
          <div className="contact-info">
            {location?.value && <span>{location.value}</span>}
            {links?.email && <> | <a id="email-link" href={`mailto:${links.email}`}>{links.email}</a></>}
            {links?.linkedin && <> | <a id="linkedin-link" href={formatUrl(links.linkedin)} target="_blank" rel="noopener noreferrer">LinkedIn</a></>}
            {links?.github && <> | <a id="github-link" href={formatUrl(links.github)} target="_blank" rel="noopener noreferrer">GitHub</a></>}
            {portfolioLink?.showOnPage !== false && portfolioLink?.value && <> | <a id="portfolio-link" href={formatUrl(portfolioLink.value)} target="_blank" rel="noopener noreferrer">Portfolio</a></>}
          </div>
        </header>
        <main className="resume-main">
          <div className="main-col-resume">
            <section><h2>About Me</h2><p>{bio}</p></section>
            {projects?.showOnPage && projects.items.length > 0 && <section><h2>Projects</h2>{projects.items.map((p, i) => (<div key={i} className="project-item-resume"><h3>{p.title}</h3><p>{p.description}</p></div>))}</section>}
            {certifications?.showOnPage && certifications.items.length > 0 && <section><h2>Certifications</h2>{certifications.items.map((c, i) => (<div key={i} className="certification-item-resume"><h3>{c.name}</h3><p>{c.issuer}</p></div>))}</section>}
          </div>
          <div className="sidebar-col-resume">
            {blogPosts?.showOnResume && blogPosts.items?.length > 0 && <section><h2>Blog Posts</h2>{blogPosts.items.map((p, i) => (<div key={i} className="project-item-resume"><h3>{p.title}</h3><p>{p.content}</p></div>))}</section>}
            {customSections?.showOnResume && customSections.items?.length > 0 && <section><h2>{customSections.title || 'Custom Section'}</h2>{customSections.items.map((item, i) => (<div key={i} className="project-item-resume"><h3>{item.title}</h3><p>{item.content}</p></div>))}</section>}
            {hardSkills?.showOnPage && hardSkills.items.length > 0 && <section><h2>Hard Skills</h2><ul className="skills-list-resume">{hardSkills.items.map(s => <li key={s}>{s}</li>)}</ul></section>}
            {softSkills?.showOnPage && softSkills.items.length > 0 && <section><h2>Soft Skills</h2><ul className="skills-list-resume">{softSkills.items.map(s => <li key={s}>{s}</li>)}</ul></section>}
            {interests?.showOnPage && interests.items.length > 0 && <section><h2>Interests</h2><ul className="skills-list-resume">{interests.items.map(i => <li key={i}>{i}</li>)}</ul></section>}
            {(education?.college?.showOnPage || education?.class12?.showOnPage || education?.class10?.showOnPage) && (
              <section>
                <h2>Education</h2>
                {education.college?.showOnPage && (<div className="education-item-resume"><h3>{education.college.name}</h3><p>{education.college.course} - {education.college.gradYear}{isFutureYear(education.college.gradYear) && <span className="expected-year"> (Expected)</span>}</p></div>)}
                {education.class12?.showOnPage && (<div className="education-item-resume"><h3>Class XII - {education.class12.board}</h3><p>{education.class12.school}, {education.class12.passingYear}</p><p>Percentage: {education.class12.percentage}%</p></div>)}
                {education.class10?.showOnPage && (<div className="education-item-resume"><h3>Class X - {education.class10.board}</h3><p>{education.class10.school}, {education.class10.passingYear}</p><p>Percentage: {education.class10.percentage}%</p></div>)}
              </section>
            )}
          </div>
        </main>
      </div>
    </>
  );
}

export default Resume;