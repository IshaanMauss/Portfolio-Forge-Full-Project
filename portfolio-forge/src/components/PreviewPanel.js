import React from 'react';
import { escapeHtml as e, safeUrl, safeColor } from '../utils/escape';

const FONTS = ['Poppins', 'Roboto Slab', 'Lato'];

function PreviewPanel({ portfolioData }) {
  if (!portfolioData) {
    return <main className="preview-panel"><div>Loading Preview...</div></main>;
  }

  const {
    theme = {},
    userName = 'Your Name',
    userSubtitle = 'Your Subtitle',
    profilePicUrl,
    bio = '',
    location = {},
    education = {},
    hardSkills = { showOnPage: true, items: [] },
    softSkills = { showOnPage: true, items: [] },
    interests = { showOnPage: true, items: [] },
    certifications = { showOnPage: true, items: [] },
    projects = { showOnPage: true, items: [] },
    blogPosts = { showOnPage: false, items: [] },
    customSections = { title: 'Custom Section', showOnPage: false, items: [] }
  } = portfolioData;

  const isFutureYear = (year) => {
    if (!year || isNaN(year)) return false;
    return parseInt(year) > new Date().getFullYear();
  };

  // Every user-supplied value below goes through escapeHtml / safeUrl / safeColor.
  const font = FONTS.includes(theme.font) ? theme.font : 'Poppins';
  const bg = safeColor(theme.backgroundColor, '#0a192f');
  const fg = safeColor(theme.textColor, '#ccd6f6');
  const accent = safeColor(theme.accentColor, '#64ffda');

  const styles = `
    <style>
      body { font-family: '${font}', sans-serif; background-color: ${bg}; color: ${fg}; line-height: 1.7; margin: 0; padding: 2rem; }
      h1, h2, h3, h4 { color: ${fg}; }
      a { color: ${accent}; text-decoration: none; }
      .accent { color: ${accent}; }
      .section { margin-bottom: 2rem; padding: 1.5rem; background-color: rgba(255,255,255, 0.03); border-radius: 8px; }
      .header { text-align: center; margin-bottom: 3rem; background: none; padding: 0;}
      .profile-pic { width: 150px; height: 150px; border-radius: 50%; object-fit: cover; border: 4px solid ${accent}; margin-bottom: 1rem; }
      .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; }
      .card { background-color: rgba(255,255,255, 0.05); padding: 1.5rem; border-radius: 8px; }
      .skills-list { display: flex; flex-wrap: wrap; gap: 0.5rem; padding: 0; list-style: none; justify-content: center; }
      .skills-list li { background-color: ${accent}; color: ${bg}; padding: 0.3rem 0.8rem; border-radius: 20px; font-weight: 500;}
      .expected-year { font-style: italic; opacity: 0.8; font-size: 0.9em; }
    </style>
  `;

  const link = (url, label) => {
    const href = safeUrl(url);
    return href ? `<a href="${e(href)}" target="_blank" rel="noopener noreferrer">${label}</a>` : '';
  };

  const list = (items) => (items || []).map(i => `<li>${e(i)}</li>`).join('');
  const picUrl = safeUrl(profilePicUrl);

  const eduCard = (title, line1, line2) =>
    `<div class="card"><h4>${e(title)}</h4><p>${line1}</p>${line2 ? `<p>${line2}</p>` : ''}</div>`;

  const previewContent = `
    <html>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&family=Roboto+Slab&family=Lato&display=swap" rel="stylesheet">
        ${styles}
      </head>
      <body>
        <header class="header section">
          ${picUrl ? `<img src="${e(picUrl)}" alt="Profile" class="profile-pic">` : ''}
          <h1>${e(userName)}</h1><h2 class="accent">${e(userSubtitle)}</h2>
          ${location?.showOnPage ? `<p>${e(location.value)}</p>` : ''}
        </header>
        <section class="section"><h3>About Me</h3><p>${e(bio)}</p></section>
        ${hardSkills?.showOnPage && hardSkills?.items?.length > 0 ? `<section class="section"><h3>Hard Skills</h3><ul class="skills-list">${list(hardSkills.items)}</ul></section>` : ''}
        ${softSkills?.showOnPage && softSkills?.items?.length > 0 ? `<section class="section"><h3>Soft Skills</h3><ul class="skills-list">${list(softSkills.items)}</ul></section>` : ''}
        ${interests?.showOnPage && interests?.items?.length > 0 ? `<section class="section"><h3>Interests</h3><ul class="skills-list">${list(interests.items)}</ul></section>` : ''}
        ${projects?.showOnPage && projects?.items?.length > 0 ? `<section class="section"><h3>Projects</h3><div class="grid">${projects.items.map(p => `<div class="card"><h4>${e(p.title || 'Project Title')}</h4><p>${e(p.description || '')}</p>${[link(p.liveUrl, 'Live Demo'), link(p.githubUrl, 'GitHub')].filter(Boolean).join(' | ')}</div>`).join('')}</div></section>` : ''}
        ${certifications?.showOnPage && certifications?.items?.length > 0 ? `<section class="section"><h3>Certifications</h3><div class="grid">${certifications.items.map(c => `<div class="card"><h4>${e(c.name)}</h4><p>Issued by: ${e(c.issuer)}</p></div>`).join('')}</div></section>` : ''}
        ${(education?.college?.showOnPage || education?.class12?.showOnPage || education?.class10?.showOnPage) ? `
        <section class="section">
          <h3>Education</h3>
          <div class="grid">
            ${education.college?.showOnPage ? eduCard(education.college.name, `${e(education.college.course)} - ${e(education.college.gradYear)}${isFutureYear(education.college.gradYear) ? '<span class="expected-year"> (Expected)</span>' : ''}`) : ''}
            ${education.class12?.showOnPage ? eduCard(`Class XII - ${education.class12.board || ''}`, `${e(education.class12.school)}, ${e(education.class12.passingYear)}`, `Percentage: ${e(education.class12.percentage)}%`) : ''}
            ${education.class10?.showOnPage ? eduCard(`Class X - ${education.class10.board || ''}`, `${e(education.class10.school)}, ${e(education.class10.passingYear)}`, `Percentage: ${e(education.class10.percentage)}%`) : ''}
          </div>
        </section>` : ''}
        ${blogPosts?.showOnPage && blogPosts?.items?.length > 0 ? `<section class="section"><h3>Blog Posts</h3><div class="grid">${blogPosts.items.map(p => `<div class="card"><h4>${e(p.title)}</h4><p>${e(p.content)}</p></div>`).join('')}</div></section>` : ''}
        ${customSections?.showOnPage && customSections?.items?.length > 0 ? `<section class="section"><h3>${e(customSections.title || 'Custom Section')}</h3><div class="grid">${customSections.items.map(item => `<div class="card"><h4>${e(item.title)}</h4><p>${e(item.content)}</p></div>`).join('')}</div></section>` : ''}
      </body>
    </html>
  `;

  // sandbox="" => no scripts and an opaque origin: even if something slipped
  // through escaping, it could not touch the app or the user's session.
  return (
    <main className="preview-panel">
      <iframe id="portfolio-preview" sandbox="" srcDoc={previewContent} title="Portfolio Preview"></iframe>
    </main>
  );
}
export default PreviewPanel;
