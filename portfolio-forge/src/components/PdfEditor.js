import React, { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { loadPdfJs, looksLikePdf, MAX_PDF_BYTES } from '../utils/pdfText';
import { useFileDrop } from '../utils/useFileDrop';
import { buildPdf } from '../utils/pdfEdit';
import './Tools.css';
import { Link } from 'react-router-dom';
import Seo from '../seo/Seo';
import SiteFooter from './SiteFooter';

const MAX_PAGES = 100;
let uid = 0;
const nextKey = () => `p${(uid += 1)}`;
const norm = (r) => ((r % 360) + 360) % 360;

function PageCanvas({ doc, pageNo, rotation, width, className }) {
  const ref = useRef(null);
  useEffect(() => {
    let cancelled = false; let task;
    (async () => {
      const page = await doc.getPage(pageNo);
      const R = norm(page.rotate + rotation);
      const base = page.getViewport({ scale: 1, rotation: R });
      const scale = width / base.width;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const vp = page.getViewport({ scale: scale * dpr, rotation: R });
      const c = ref.current; if (!c || cancelled) return;
      c.width = vp.width; c.height = vp.height;
      c.style.width = `${vp.width / dpr}px`;
      task = page.render({ canvasContext: c.getContext('2d'), viewport: vp });
      try { await task.promise; } catch (e) { /* cancelled */ }
    })();
    return () => { cancelled = true; if (task) task.cancel(); };
  }, [doc, pageNo, rotation, width]);
  return <canvas ref={ref} className={className} />;
}

function SignaturePad({ onSave }) {
  const ref = useRef(null);
  const drawing = useRef(false);
  const pos = (e) => { const r = ref.current.getBoundingClientRect(); return { x: (e.clientX - r.left) * (ref.current.width / r.width), y: (e.clientY - r.top) * (ref.current.height / r.height) }; };
  const down = (e) => { drawing.current = true; ref.current.setPointerCapture(e.pointerId); const c = ref.current.getContext('2d'); const p = pos(e); c.beginPath(); c.moveTo(p.x, p.y); };
  const move = (e) => { if (!drawing.current) return; const c = ref.current.getContext('2d'); c.lineWidth = 4; c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = '#1b2a6b'; const p = pos(e); c.lineTo(p.x, p.y); c.stroke(); };
  const up = () => { drawing.current = false; };
  const clear = () => ref.current.getContext('2d').clearRect(0, 0, ref.current.width, ref.current.height);
  const save = () => {
    const c = ref.current; const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    let minX = c.width, minY = c.height, maxX = 0, maxY = 0;
    for (let y = 0; y < c.height; y += 1) for (let x = 0; x < c.width; x += 1) if (d[(y * c.width + x) * 4 + 3] > 0) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
    if (maxX <= minX) { toast.info('Draw your signature first.'); return; }
    const w = maxX - minX + 8; const h = maxY - minY + 8;
    const t = document.createElement('canvas'); t.width = w; t.height = h;
    t.getContext('2d').drawImage(c, minX - 4, minY - 4, w, h, 0, 0, w, h);
    onSave({ dataUrl: t.toDataURL('image/png'), aspect: h / w });
  };
  return (
    <div className="tool-card">
      <strong>Draw your signature</strong>
      <canvas ref={ref} width={840} height={300} className="sig-pad" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} aria-label="Signature drawing area" />
      <div className="pe-row"><button type="button" className="pe-btn" onClick={clear}>Clear</button><button type="button" className="pe-btn primary" onClick={save}>Use this signature</button></div>
    </div>
  );
}

function PdfEditor() {
  const sourcesRef = useRef(new Map());   // id -> original bytes (for export)
  const docsRef = useRef(new Map());      // id -> pdf.js document (for display)
  const [pages, setPages] = useState([]);
  const [sel, setSel] = useState(null);
  const [tool, setTool] = useState('none'); // none | text | sig
  const [text, setText] = useState('');
  const [size, setSize] = useState(14);
  const [color, setColor] = useState('#111111');
  const [sig, setSig] = useState(null);
  const [busy, setBusy] = useState(false);
  const [, force] = useState(0);

  useEffect(() => () => { docsRef.current.forEach((d) => d.destroy()); }, []);

  const addFiles = useCallback(async (fileList) => {
    const all = [...fileList];
    const checks = await Promise.all(all.map((f) => looksLikePdf(f)));
    const files = all.filter((_, i) => checks[i]);
    if (files.length < all.length) toast.warn('Only PDF files can be added.');
    if (!files.length) return;
    setBusy(true);
    try {
      const pdfjs = await loadPdfJs();
      const added = [];
      for (const f of files) {
        if (f.size > MAX_PDF_BYTES) { toast.error(`${f.name} is larger than 10 MB.`); continue; }
        const bytes = new Uint8Array(await f.arrayBuffer());
        try {
          const doc = await pdfjs.getDocument({ data: bytes.slice(), isEvalSupported: false }).promise;
          const id = `s${(uid += 1)}`;
          sourcesRef.current.set(id, bytes); docsRef.current.set(id, doc);
          for (let i = 0; i < doc.numPages; i += 1) added.push({ key: nextKey(), srcId: id, srcPage: i, rotation: 0, marks: [] });
        } catch (e) { toast.error(`${f.name} could not be opened (damaged or password-protected).`); }
      }
      setPages((prev) => {
        const all = [...prev, ...added].slice(0, MAX_PAGES);
        if (prev.length + added.length > MAX_PAGES) toast.warn(`Limited to ${MAX_PAGES} pages.`);
        return all;
      });
      if (added.length) setSel((s) => s || added[0].key);
    } finally { setBusy(false); force((n) => n + 1); }
  }, []);

  const idx = pages.findIndex((p) => p.key === sel);
  const cur = pages[idx];
  const patch = (key, fn) => setPages((ps) => ps.map((p) => (p.key === key ? fn(p) : p)));
  const move = (d) => setPages((ps) => { const i = ps.findIndex((p) => p.key === sel); const j = i + d; if (i < 0 || j < 0 || j >= ps.length) return ps; const c = [...ps]; [c[i], c[j]] = [c[j], c[i]]; return c; });
  const { dragging, dropProps } = useFileDrop((fs) => addFiles(fs), { multiple: true });

  const remove = () => { if (!cur) return; setPages((ps) => ps.filter((p) => p.key !== sel)); setSel(pages[idx + 1]?.key || pages[idx - 1]?.key || null); };

  const place = (e) => {
    if (!cur || tool === 'none') return;
    const r = e.currentTarget.getBoundingClientRect();
    const fx = (e.clientX - r.left) / r.width; const fy = (e.clientY - r.top) / r.height;
    if (tool === 'text') {
      if (!text.trim()) { toast.info('Type the text first.'); return; }
      if (/[^ -ÿ]/.test(text)) { toast.error('Only Latin letters, digits and common symbols are supported for now.'); return; }
      patch(cur.key, (p) => ({ ...p, marks: [...p.marks, { type: 'text', fx, fy, text: text.trim(), size: Number(size) || 14, color }] }));
    } else if (tool === 'sig' && sig) {
      patch(cur.key, (p) => ({ ...p, marks: [...p.marks, { type: 'sig', fx: Math.min(fx, 0.75), fy, wFrac: 0.25, aspect: sig.aspect, dataUrl: sig.dataUrl }] }));
    }
  };

  const download = async () => {
    setBusy(true);
    try {
      const bytes = await buildPdf(sourcesRef.current, pages);
      const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
      const a = document.createElement('a'); a.href = url; a.download = 'edited.pdf'; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      toast.success('Your PDF is ready.');
    } catch (e) {
      console.error(e);
      toast.error('Could not build the PDF. If a file is encrypted, remove its password first.');
    } finally { setBusy(false); }
  };

  // Display width (pt) of the current page in its rotated frame, used to size text marks.
  const [dispW, setDispW] = useState(600);
  useEffect(() => {
    (async () => {
      if (!cur) return;
      const page = await docsRef.current.get(cur.srcId).getPage(cur.srcPage + 1);
      setDispW(page.getViewport({ scale: 1, rotation: norm(page.rotate + cur.rotation) }).width);
    })();
  }, [cur?.key, cur?.rotation]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <main className="tool-page">
      <Seo page="pdf" />
      <header className="tool-head rise">
        <span className="login-badge">Free · No login · Private</span>
        <h1>PDF editor</h1>
        <p>Merge files, reorder or rotate pages, add text and sign. It all happens in your browser, so your PDF is never uploaded.</p>
      </header>

      <section className={`tool-card rise pe-drop${dragging ? ' is-dragging' : ''}`} style={{ '--d': '80ms' }} {...dropProps}>
        {dragging && <div className="pe-drop-hint" aria-hidden="true">Drop PDF files to add them</div>}
        {!pages.length && <p className="muted pe-empty">Drag &amp; drop PDF files anywhere in this box, or use &ldquo;Open PDF(s)&rdquo;.</p>}
        <div className="pe-toolbar">
          <label className="pe-btn primary" style={{ cursor: 'pointer' }}>
            {pages.length ? 'Add more PDFs' : 'Open PDF(s)'}
            <input type="file" accept="application/pdf,.pdf" multiple hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
          </label>
          <button type="button" className="pe-btn" disabled={!cur} onClick={() => move(-1)} aria-label="Move page earlier">← Move</button>
          <button type="button" className="pe-btn" disabled={!cur} onClick={() => move(1)} aria-label="Move page later">Move →</button>
          <button type="button" className="pe-btn" disabled={!cur} onClick={() => patch(cur.key, (p) => ({ ...p, rotation: norm(p.rotation + 90), marks: [] }))} title="Rotating clears marks on this page">⟳ Rotate</button>
          <button type="button" className="pe-btn" disabled={!cur} onClick={remove}>Delete page</button>
          <button type="button" className="pe-btn primary" disabled={!pages.length || busy} onClick={download}>{busy ? 'Working…' : 'Download PDF'}</button>
        </div>
        {!pages.length && <p className="muted">Open one PDF to edit it, or several to merge them. Up to 10 MB each, {MAX_PAGES} pages total.</p>}
      </section>

      {cur && (
        <>
          <section className="tool-card">
            <div className="pe-row">
              <button type="button" className={`pe-btn${tool === 'text' ? ' active' : ''}`} onClick={() => setTool(tool === 'text' ? 'none' : 'text')}>Add text</button>
              <button type="button" className={`pe-btn${tool === 'sig' ? ' active' : ''}`} onClick={() => setTool(tool === 'sig' ? 'none' : 'sig')}>Sign</button>
              <button type="button" className="pe-btn" disabled={!cur.marks.length} onClick={() => patch(cur.key, (p) => ({ ...p, marks: p.marks.slice(0, -1) }))}>Undo last</button>
            </div>
            {tool === 'text' && (
              <div className="pe-row">
                <input type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder="Text to place" aria-label="Text to place" style={{ flex: 1, minWidth: 160 }} />
                <input type="number" min="6" max="96" value={size} onChange={(e) => setSize(e.target.value)} aria-label="Font size" style={{ width: 80 }} />
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} aria-label="Text colour" />
              </div>
            )}
            {tool === 'sig' && (sig
              ? <p className="muted">Signature ready. Click the page where it should go. <button type="button" className="pe-btn" onClick={() => setSig(null)}>Redraw</button></p>
              : <SignaturePad onSave={setSig} />)}
            {tool !== 'none' && (tool === 'text' ? text.trim() : sig) && <p className="muted">Click on the page below to place it.</p>}
          </section>

          <div className="pe-stage">
            <div className={`pe-page${tool !== 'none' ? ' placing' : ''}`} style={{ containerType: 'inline-size', width: 'min(100%, 780px)' }} onClick={place}>
              <PageCanvas doc={docsRef.current.get(cur.srcId)} pageNo={cur.srcPage + 1} rotation={cur.rotation} width={780} />
              {cur.marks.map((m, i) => (m.type === 'text'
                ? <span key={i} className="pe-mark" style={{ left: `${m.fx * 100}%`, top: `${m.fy * 100}%`, color: m.color, fontSize: `${(m.size / dispW) * 100}cqw` }}>{m.text}</span>
                : <img key={i} className="pe-mark sig" alt="" src={m.dataUrl} style={{ left: `${m.fx * 100}%`, top: `${m.fy * 100}%`, width: `${m.wFrac * 100}%` }} />))}
            </div>
          </div>
        </>
      )}

      {pages.length > 0 && (
        <section>
          <div className="pe-grid" role="listbox" aria-label="Pages">
            {pages.map((p, i) => (
              <div key={p.key} role="option" aria-selected={p.key === sel} tabIndex={0} className={`pe-thumb${p.key === sel ? ' sel' : ''}`} onClick={() => setSel(p.key)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSel(p.key); } }}>
                <PageCanvas doc={docsRef.current.get(p.srcId)} pageNo={p.srcPage + 1} rotation={p.rotation} width={140} />
                <small>Page {i + 1}{p.marks.length ? ` · ${p.marks.length} edit${p.marks.length > 1 ? 's' : ''}` : ''}</small>
              </div>
            ))}
          </div>
        </section>
      )}
      <section className="tool-info">
        <h2>What this PDF editor can do</h2>
        <ul>
          <li>Merge several PDFs into one file.</li>
          <li>Reorder, rotate and remove pages.</li>
          <li>Add text and place a signature on any page.</li>
          <li>Download the result as a new PDF.</li>
        </ul>
        <h2>Why it is private</h2>
        <p>Your files are opened and edited inside your browser using your own device. They are not uploaded to our servers, so documents such as contracts, forms and ID copies stay with you. Closing the tab discards the working copy.</p>
        <h2>Tips</h2>
        <ol>
          <li>Keep a copy of your original file before you edit and download a new version.</li>
          <li>Add all the files you want to combine first, then reorder the pages by dragging.</li>
          <li>Zoom into the page thumbnail to check that added text and signatures are placed where you want them.</li>
        </ol>
        <h2>Frequently asked questions</h2>
        <p><strong>Is there a file size limit?</strong> Very large files may be slow because everything runs on your device. If a file is slow, try splitting it first.</p>
        <p><strong>Does it work on a phone?</strong> Yes, though large documents are easier on a laptop.</p>
        <p><strong>Can it edit existing text in a PDF?</strong> No. It can add new text on top of pages. For a resume, build it in our editor and export a text-based PDF instead.</p>
        <p>Related: <Link to="/tools/ats">free ATS resume checker</Link> and our <Link to="/guides">resume and portfolio guides</Link>.</p>
      </section>
      <SiteFooter />
    </main>
  );
}

export default PdfEditor;
