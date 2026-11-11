import { normalizeData } from './normalize';

const base = () => ({
  meta: { versions: [{ id: 'default', name: 'Main' }, { id: 'v_1', name: 'FOR GAME' }], activeVersion: 'v_1' },
  portfolios: { default: { userName: 'A' }, v_1: { userName: 'B' } },
});

test('keeps consistent data untouched', () => {
  const out = normalizeData(base());
  expect(out.meta.activeVersion).toBe('v_1');
  expect(out.meta.versions.map((v) => v.id)).toEqual(['default', 'v_1']);
});

test('falls back to default when the active version has no data', () => {
  const data = base();
  delete data.portfolios.v_1;
  const out = normalizeData(data);
  expect(out.meta.activeVersion).toBe('default');
  expect(out.meta.versions.map((v) => v.id)).toEqual(['default']);
});

test('re-adds a missing default version entry', () => {
  const data = base();
  data.meta.versions = [{ id: 'v_1', name: 'FOR GAME' }];
  const out = normalizeData(data);
  expect(out.meta.versions[0].id).toBe('default');
  expect(out.meta.activeVersion).toBe('v_1');
});

test('never drops portfolio content that exists', () => {
  const data = base();
  data.meta.versions = [{ id: 'default', name: 'Main' }];
  expect(normalizeData(data).portfolios.v_1).toBeDefined();
});

test('migrates only the untouched old default theme', () => {
  const data = base();
  data.portfolios.default.theme = { backgroundColor: '#0a192f', textColor: '#ccd6f6', accentColor: '#64ffda', layout: 'compact' };
  data.portfolios.v_1.theme = { backgroundColor: '#123456', textColor: '#ccd6f6', accentColor: '#64ffda' };
  const out = normalizeData(data);
  expect(out.portfolios.default.theme.backgroundColor).toBe('#2b1338');
  expect(out.portfolios.default.theme.layout).toBe('compact');
  expect(out.portfolios.v_1.theme.backgroundColor).toBe('#123456');
});
