// Builds the node/edge graph for the portfolio constellation from portfolio data. Pure + deterministic.
// Skills are linked to the projects that mention them, so a visitor can see which projects prove a skill.

const MAX_PROJECTS = 8;
const MAX_SKILLS = 14;

export function buildGraph(data) {
  const nodes = [];
  const edges = [];
  const name = data?.userName || 'Portfolio';
  nodes.push({ id: 'me', type: 'me', label: name, pos: [0, 0, 0], size: 0.34, info: { title: name, text: data?.userSubtitle || '' } });

  const projects = (data?.projects?.items || []).slice(0, MAX_PROJECTS);
  const pN = projects.length;
  projects.forEach((p, i) => {
    const a = (i / Math.max(pN, 1)) * Math.PI * 2;
    const text = p.description || '';
    nodes.push({
      id: `p${i}`, type: 'project', label: p.title, size: 0.17 + Math.min(text.length / 900, 1) * 0.13,
      pos: [Math.cos(a) * 2.3, Math.sin(i * 1.7) * 0.9, Math.sin(a) * 2.3],
      info: { title: p.title, text, links: [p.githubUrl && ['Code', p.githubUrl], p.liveUrl && ['Live', p.liveUrl]].filter(Boolean), keywords: p.keywords },
    });
    edges.push([0, nodes.length - 1]);
  });

  const skills = (data?.hardSkills?.showOnPage === false ? [] : data?.hardSkills?.items || []).slice(0, MAX_SKILLS);
  const sN = skills.length;
  const golden = Math.PI * (3 - Math.sqrt(5));
  skills.forEach((s, i) => {
    const y = sN > 1 ? 1 - (i / (sN - 1)) * 2 : 0;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const th = golden * i;
    const idx = nodes.length;
    const provedBy = [];
    projects.forEach((p, pi) => {
      const hay = `${p.title || ''} ${p.keywords || ''} ${p.description || ''}`.toLowerCase();
      if (s.length > 1 && hay.includes(s.toLowerCase())) { provedBy.push(p.title); edges.push([1 + pi, idx]); }
    });
    if (!provedBy.length) edges.push([0, idx]);
    nodes.push({
      id: `s${i}`, type: 'skill', label: s, size: 0.08 + Math.min(provedBy.length, 3) * 0.025,
      pos: [Math.cos(th) * r * 3.8, y * 2.6, Math.sin(th) * r * 3.8],
      info: { title: s, text: provedBy.length ? `Demonstrated in: ${provedBy.join(', ')}` : 'Listed skill', provedBy },
    });
  });
  return { nodes, edges };
}
