// Turns reviewed import results into [path, value] updates for updatePortfolio().
const uniqCI = (existing, incoming) => {
  const seen = new Set(existing.map((s) => String(s).toLowerCase()));
  return [...existing, ...incoming.filter((s) => { const k = String(s).toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; })];
};

export function resumeUpdates(portfolio, parsed, picks) {
  const u = [];
  const on = (k) => picks.includes(k);
  if (on('name') && parsed.name) u.push(['userName', parsed.name]);
  if (on('headline') && parsed.headline) u.push(['userSubtitle', parsed.headline]);
  if (on('summary') && parsed.summary) u.push(['bio', parsed.summary]);
  if (on('email') && parsed.email) u.push(['links.email', parsed.email]);
  if (on('linkedin') && parsed.linkedin) u.push(['links.linkedin', parsed.linkedin]);
  if (on('github') && parsed.github) u.push(['links.github', parsed.github]);
  if (on('skills') && parsed.skills.length) u.push(['hardSkills.items', uniqCI(portfolio.hardSkills?.items || [], parsed.skills)], ['hardSkills.showOnPage', true]);
  if (on('education') && (parsed.education.name || parsed.education.course)) {
    const e = parsed.education;
    if (e.name) u.push(['education.college.name', e.name]);
    if (e.course) u.push(['education.college.course', e.course]);
    if (e.gradYear) u.push(['education.college.gradYear', e.gradYear]);
    u.push(['education.college.showOnPage', true]);
  }
  if (on('experience') && parsed.experience.length) {
    const cs = portfolio.customSections || {};
    const defaultTitle = !cs.title || cs.title === 'Custom Section';
    if (defaultTitle) u.push(['customSections.title', 'Experience']);
    u.push(['customSections.items', [...parsed.experience, ...(cs.items || [])]], ['customSections.showOnPage', true]);
  }
  if (on('projects') && parsed.projects.length) u.push(...projectUpdates(portfolio, parsed.projects));
  if (on('certifications') && parsed.certifications.length) {
    const ex = portfolio.certifications?.items || [];
    const names = new Set(ex.map((c) => c.name.toLowerCase()));
    u.push(['certifications.items', [...parsed.certifications.filter((c) => !names.has(c.name.toLowerCase())), ...ex]], ['certifications.showOnPage', true]);
  }
  return u;
}

export function projectUpdates(portfolio, newProjects, skills = []) {
  const ex = portfolio.projects?.items || [];
  const titles = new Set(ex.map((p) => p.title.toLowerCase()));
  const fresh = newProjects.filter((p) => !titles.has(p.title.toLowerCase()));
  const u = [['projects.items', [...fresh, ...ex]], ['projects.showOnPage', true]];
  if (skills.length) u.push(['hardSkills.items', uniqCI(portfolio.hardSkills?.items || [], skills)], ['hardSkills.showOnPage', true]);
  return u;
}
