import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db, auth } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import ToggleSwitch from './ToggleSwitch';
import './Resume.css';
import { toast } from 'react-toastify';
import FeedbackToast from './FeedbackToast';

function Resume({ user }) {
  const { userId, versionId } = useParams();
  const [portfolioData, setPortfolioData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applyTheme, setApplyTheme] = useState(false);

  useEffect(() => {
    const fetchPortfolio = async () => {
      if (!userId) { setLoading(false); return; }
      const docRef = doc(db, "portfolios", userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const fullData = docSnap.data();
        const versionToShow = versionId || fullData.meta?.activeVersion || 'default';
        setPortfolioData(fullData.portfolios[versionToShow]);
      }
      setLoading(false);
    };
    fetchPortfolio();
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

  const exportToPdf = () => {
    const resumeElement = document.getElementById('resume-content');
    const { userName = 'User' } = portfolioData;

    if (!resumeElement) {
      toast.error("Could not find resume content to download.");
      return;
    }
    toast.info("Generating a high-quality PDF...");

    const scrollY = window.scrollY;
    window.scrollTo(0, 0);

    html2canvas(resumeElement, {
        scale: 2.5,
        useCORS: true,
        logging: true,
        dpi: 192,
        letterRendering: true,
    }).then(canvas => {
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasHeight / canvasWidth;
        
        let imgWidth = pdfWidth;
        let imgHeight = pdfWidth * ratio;
        let x_offset = 0;
        let y_offset = 0;

        if (imgHeight > pdfHeight) {
            imgHeight = pdfHeight;
            imgWidth = imgHeight / ratio;
            x_offset = (pdfWidth - imgWidth) / 2;
        }

        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        pdf.addImage(imageData, 'JPEG', x_offset, y_offset, imgWidth, imgHeight, null, 'MEDIUM');

        const scaleFactor = imgWidth / resumeElement.offsetWidth;
        const resumeRect = resumeElement.getBoundingClientRect();

        ['email-link', 'linkedin-link', 'github-link'].forEach(id => {
            const linkEl = document.getElementById(id);
            if (linkEl) {
                const rect = linkEl.getBoundingClientRect();
                const relativeX = rect.left - resumeRect.left;
                const relativeY = rect.top - resumeRect.top;

                const x = x_offset + (relativeX * scaleFactor);
                const y = y_offset + (relativeY * scaleFactor);
                const w = rect.width * scaleFactor;
                const h = rect.height * scaleFactor;
                
                pdf.link(x, y, w, h, { url: linkEl.href });
            }
        });

        pdf.save(`${userName.replace(/\s+/g, '_')}_Resume.pdf`);
        toast.success("PDF Downloaded!");

        setTimeout(() => {
          if (toast.isActive('feedback-toast')) return;
          toast(<FeedbackToast userId={userId} currentUser={user} />, {
            toastId: 'feedback-toast',
            className: 'modal-toast-container',
            position: "top-center",
            autoClose: false,
            closeOnClick: false,
            draggable: false,
          });
        }, 2000);

    }).catch(err => {
        console.error("PDF Generation Error:", err);
        toast.error("Could not generate PDF. Check console for details.");
    }).finally(() => {
        window.scrollTo(0, scrollY);
    });
  };

  if (loading) return <div className="loading-screen">Loading Resume...</div>;
  if (!portfolioData) return <div className="loading-screen">Could not find resume data.</div>;

  const {
    userName, userSubtitle, location, links, bio,
    hardSkills = { items: [] }, softSkills = { items: [] },
    interests = { items: [] }, certifications = { items: [] },
    projects = { items: [] }, education, 
    profilePicUrl, profilePicDataUrl, // Get the new Data URL field
    theme = {}
  } = portfolioData;

  const dynamicStyles = {
    '--accent-color': theme.accentColor || '#64ffda',
    '--bg-color': theme.backgroundColor || '#0a192f',
    '--text-color': theme.textColor || '#333',
    '--header-color': theme.textColor || '#112240',
  };

  // --- THIS IS THE SECOND FIX ---
  // Prioritize the local Data URL to prevent CORS errors.
  const imageToDisplay = profilePicDataUrl || profilePicUrl;

  return (
    <>
      <div className="resume-actions">
        <div className="theme-toggle-wrapper">
          <ToggleSwitch label="Apply Portfolio Theme" checked={applyTheme} onChange={() => setApplyTheme(!applyTheme)} />
        </div>
        <button onClick={exportToPdf}>Download as PDF</button>
      </div>
      <div id="resume-content" className={`resume-container ${applyTheme ? 'theme-applied' : ''}`} style={applyTheme ? dynamicStyles : {}}>
        <header className="resume-header">
          {/* Use the safe image source and keep crossOrigin for fallback */}
          {imageToDisplay && <img id="resume-profile-pic" src={imageToDisplay} alt="Profile" crossOrigin="anonymous" className="profile-pic-resume" />}
          <h1>{userName}</h1>
          <p className="subtitle">{userSubtitle}</p>
          <div className="contact-info">
            {location?.value && <span>{location.value}</span>}
            {links?.email && <> | <a id="email-link" href={`mailto:${links.email}`}>{links.email}</a></>}
            {links?.linkedin && <> | <a id="linkedin-link" href={formatUrl(links.linkedin)} target="_blank" rel="noopener noreferrer">LinkedIn</a></>}
            {links?.github && <> | <a id="github-link" href={formatUrl(links.github)} target="_blank" rel="noopener noreferrer">GitHub</a></>}
          </div>
        </header>
        <main className="resume-main">
          <div className="main-col-resume">
            <section><h2>About Me</h2><p>{bio}</p></section>
            {projects?.showOnPage && projects.items.length > 0 && <section><h2>Projects</h2>{projects.items.map((p, i) => (<div key={i} className="project-item-resume"><h3>{p.title}</h3><p>{p.description}</p></div>))}</section>}
            {certifications?.showOnPage && certifications.items.length > 0 && <section><h2>Certifications</h2>{certifications.items.map((c, i) => (<div key={i} className="certification-item-resume"><h3>{c.name}</h3><p>{c.issuer}</p></div>))}</section>}
          </div>
          <div className="sidebar-col-resume">
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