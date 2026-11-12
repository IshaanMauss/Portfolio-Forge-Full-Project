import React from 'react';
import { PAGE_SIZES, FONT_CHOICES, SECTION_LABELS, normalizeResumeSettings } from '../utils/resumePdf';

// Controls for the downloadable resume PDF. Every value is re-validated by normalizeResumeSettings.
export default function ResumeLayoutControls({ value, onChange }) {
  const s = normalizeResumeSettings(value);
  const set = (patch) => onChange(normalizeResumeSettings({ ...s, ...patch }));
  const move = (id, dir) => {
    const order = [...s.order]; const i = order.indexOf(id); const j = i + dir;
    if (j < 0 || j >= order.length) return;
    [order[i], order[j]] = [order[j], order[i]]; set({ order });
  };
  const toggle = (id) => set({ hidden: s.hidden.includes(id) ? s.hidden.filter((x) => x !== id) : [...s.hidden, id] });
  return (
    <div className="rlc">
      <div className="rlc-grid">
        <label>Page size
          <select value={s.pageSize} onChange={(e) => set({ pageSize: e.target.value })}>
            {Object.keys(PAGE_SIZES).map((k) => <option key={k} value={k}>{k === 'a4' ? 'A4' : 'US Letter'}</option>)}
          </select>
        </label>
        <label>Font
          <select value={s.font} onChange={(e) => set({ font: e.target.value })}>
            {Object.entries(FONT_CHOICES).map(([k, v]) => <option key={k} value={k}>{v[0]}</option>)}
          </select>
        </label>
        <label>Text size ({s.baseSize.toFixed(1)} pt)
          <input type="range" min="8.5" max="13" step="0.5" value={s.baseSize} onChange={(e) => set({ baseSize: Number(e.target.value) })} />
        </label>
        <label>Margins ({Math.round(s.margin)} pt)
          <input type="range" min="28" max="72" step="2" value={s.margin} onChange={(e) => set({ margin: Number(e.target.value) })} />
        </label>
        <label>Line spacing ({s.lineHeight.toFixed(2)})
          <input type="range" min="1.15" max="1.7" step="0.05" value={s.lineHeight} onChange={(e) => set({ lineHeight: Number(e.target.value) })} />
        </label>
        <label>Accent colour
          <input type="color" value={s.accent} onChange={(e) => set({ accent: e.target.value })} />
        </label>
      </div>
      <p className="muted rlc-title">Section order and visibility</p>
      <ul className="rlc-order">
        {s.order.map((id, i) => (
          <li key={id} className={s.hidden.includes(id) ? 'off' : ''}>
            <span>{SECTION_LABELS[id]}</span>
            <span className="rlc-btns">
              <button type="button" onClick={() => move(id, -1)} disabled={i === 0} aria-label={`Move ${SECTION_LABELS[id]} up`}>↑</button>
              <button type="button" onClick={() => move(id, 1)} disabled={i === s.order.length - 1} aria-label={`Move ${SECTION_LABELS[id]} down`}>↓</button>
              <button type="button" onClick={() => toggle(id)} aria-pressed={!s.hidden.includes(id)}>{s.hidden.includes(id) ? 'Show' : 'Hide'}</button>
            </span>
          </li>
        ))}
      </ul>
      <button type="button" className="btn-secondary" onClick={() => onChange(normalizeResumeSettings({}))}>Reset to defaults</button>
    </div>
  );
}
