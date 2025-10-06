import React from 'react';

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
    const currentYear = new Date().getFullYear();
    return parseInt(year) > currentYear;
  };

  const generateThemeStyles = () => `
    <style>
      body { 
        font-family: '${theme.font || 'Poppins'}', sans-serif; 
        background-color: ${theme.backgroundColor || '#0a192f'}; 
        color: ${theme.textColor || '#ccd6f6'}; 
        line-height: 1.7; margin: 0; padding: 2rem;
      }
      h1, h2, h3, h4 { color: ${theme.textColor || '#ccd6f6'}; }
      a { color: ${theme.accentColor || '#64ffda'}; text-decoration: none; }
      .accent { color: ${theme.accentColor || '#64ffda'}; }
      .section { margin-bottom: 2rem; padding: 1.5rem; background-color: rgba(255,255,255, 0.03); border-radius: 8px; }
      .header { text-align: center; margin-bottom: 3rem; background: none; padding: 0;}
      .profile-pic { width: 150px; height: 150px; border-radius: 50%; object-fit: cover; border: 4px solid ${theme.accentColor || '#64ffda'}; margin-bottom: 1rem; }
      .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; }
      .card { background-color: rgba(255,255,255, 0.05); padding: 1.5rem; border-radius: 8px; }
      .skills-list { display: flex; flex-wrap: wrap; gap: 0.5rem; padding: 0; list-style: none; justify-content: center; }
      .skills-list li { background-color: ${theme.accentColor || '#64ffda'}; color: ${theme.backgroundColor || '#0a192f'}; padding: 0.3rem 0.8rem; border-radius: 20px; font-weight: 500;}
      .expected-year { font-style: italic; opacity: 0.8; font-size: 0.9em; }
    </style>
  `;

  const previewContent = `
    <html>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&family=Roboto+Slab&family=Lato&display=swap" rel="stylesheet">
        ${generateThemeStyles()}
      </head>
      <body>
        <header class="header section">
            ${profilePicUrl ? `<img src="${profilePicUrl}" alt="Profile" class="profile-pic">` : ''}
            <h1>${userName}</h1><h2 class="accent">${userSubtitle}</h2>
            ${location?.showOnPage ? `<p>${location.value}</p>` : ''}
        </header>
        <section class="section"><h3>About Me</h3><p>${bio}</p></section>
        ${hardSkills?.showOnPage && hardSkills?.items?.length > 0 ? `<section class="section"><h3>Hard Skills</h3><ul class="skills-list">${hardSkills.items.map(skill => `<li>${skill}</li>`).join('')}</ul></section>` : ''}
        ${softSkills?.showOnPage && softSkills?.items?.length > 0 ? `<section class="section"><h3>Soft Skills</h3><ul class="skills-list">${softSkills.items.map(skill => `<li>${skill}</li>`).join('')}</ul></section>` : ''}
        ${interests?.showOnPage && interests?.items?.length > 0 ? `<section class="section"><h3>Interests</h3><ul class="skills-list">${interests.items.map(i => `<li>${i}</li>`).join('')}</ul></section>` : ''}
        ${projects?.showOnPage && projects?.items?.length > 0 ? `<section class="section"><h3>Projects</h3><div class="grid">${projects.items.map(p => `<div class="card"><h4>${p.title || 'Project Title'}</h4><p>${p.description || ''}</p>${p.liveUrl ? `<a href="${p.liveUrl}" target="_blank">Live Demo</a>` : ''}${p.githubUrl && p.liveUrl ? ' | ' : ''}${p.githubUrl ? `<a href="${p.githubUrl}" target="_blank">GitHub</a>` : ''}</div>`).join('')}</div></section>` : ''}
        ${certifications?.showOnPage && certifications?.items?.length > 0 ? `<section class="section"><h3>Certifications</h3><div class="grid">${certifications.items.map(c => `<div class="card"><h4>${c.name}</h4><p>Issued by: ${c.issuer}</p></div>`).join('')}</div></section>` : ''}
        
        ${(education?.college?.showOnPage || education?.class12?.showOnPage || education?.class10?.showOnPage) ? `
        <section class="section">
            <h3>Education</h3>
            <div class="grid">
              ${education.college?.showOnPage ? `<div class="card"><h4>${education.college.name}</h4><p>${education.college.course} - ${education.college.gradYear}${isFutureYear(education.college.gradYear) ? `<span class="expected-year"> (Expected)</span>` : ''}</p></div>` : ''}
              ${education.class12?.showOnPage ? `<div class="card"><h4>Class XII - ${education.class12.board}</h4><p>${education.class12.school}, ${education.class12.passingYear}</p><p>Percentage: ${education.class12.percentage}%</p></div>` : ''}
              ${education.class10?.showOnPage ? `<div class="card"><h4>Class X - ${education.class10.board}</h4><p>${education.class10.school}, ${education.class10.passingYear}</p><p>Percentage: ${education.class10.percentage}%</p></div>` : ''}
            </div>
        </section>` : ''}

        ${blogPosts?.showOnPage && blogPosts?.items?.length > 0 ? `<section class="section"><h3>Blog Posts</h3><div class="grid">${blogPosts.items.map(p => `<div class="card"><h4>${p.title}</h4><p>${p.content}</p></div>`).join('')}</div></section>` : ''}
        ${customSections?.showOnPage && customSections?.items?.length > 0 ? `<section class="section"><h3>${customSections.title || 'Custom Section'}</h3><div class="grid">${customSections.items.map(item => `<div class="card"><h4>${item.title}</h4><p>${item.content}</p></div>`).join('')}</div></section>` : ''}
      </body>
    </html>
  `;

  return (
    <main className="preview-panel">
      <iframe id="portfolio-preview" srcDoc={previewContent} title="Portfolio Preview"></iframe>
    </main>
  );
}
export default PreviewPanel;