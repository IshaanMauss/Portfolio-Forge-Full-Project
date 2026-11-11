import { buildGraph } from './constellation';

const data = {
  userName: 'Jane', userSubtitle: 'Dev',
  projects: { items: [{ title: 'Chat App', keywords: 'React, Socket.IO', description: 'Realtime chat' }, { title: 'Blog', keywords: 'Python', description: '' }] },
  hardSkills: { showOnPage: true, items: ['React', 'Python', 'Rust'] },
};

test('builds a graph linking skills to the projects that prove them', () => {
  const g = buildGraph(data);
  expect(g.nodes.map((n) => n.type)).toEqual(['me', 'project', 'project', 'skill', 'skill', 'skill']);
  const react = g.nodes.find((n) => n.label === 'React');
  expect(react.info.provedBy).toEqual(['Chat App']);
  const rust = g.nodes.find((n) => n.label === 'Rust');
  expect(rust.info.provedBy).toEqual([]);
  // every edge references real nodes
  g.edges.forEach(([a, b]) => { expect(g.nodes[a]).toBeTruthy(); expect(g.nodes[b]).toBeTruthy(); });
});

test('empty and hidden data are safe', () => {
  expect(buildGraph({}).nodes).toHaveLength(1);
  expect(buildGraph({ hardSkills: { showOnPage: false, items: ['x'] } }).nodes).toHaveLength(1);
});
