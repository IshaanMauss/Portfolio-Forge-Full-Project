// App chrome themes (separate from the colours users pick for their own portfolio).
export const APP_THEMES = [
  { id: 'orchid', name: 'Orchid', swatch: ['#e9b6da', '#2b1638'] },
  { id: 'sage', name: 'Sage & Cream', swatch: ['#6d1f2e', '#f4ede0'] },
  { id: 'forest', name: 'Forest', swatch: ['#3fa877', '#151718'] },
];

const KEY = 'pf-theme';

export function getInitialTheme() {
  try {
    const saved = localStorage.getItem(KEY);
    if (APP_THEMES.some((t) => t.id === saved)) return saved;
  } catch {
    /* storage unavailable */
  }
  return 'orchid';
}

export function applyTheme(id, persist = false) {
  document.documentElement.dataset.theme = id;
  if (persist) {
    try {
      localStorage.setItem(KEY, id);
    } catch {
      /* storage unavailable */
    }
  }
}
