import React, { useEffect, useRef, useState } from 'react';
import { buildResumePdf } from '../utils/resumePdf';
import { loadPdfJs } from '../utils/pdfText';

function Page({ doc, pageNo, width }) {
  const ref = useRef(null);
  useEffect(() => {
    let cancelled = false; let task;
    (async () => {
      const page = await doc.getPage(pageNo);
      const base = page.getViewport({ scale: 1 });
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const vp = page.getViewport({ scale: (width / base.width) * dpr });
      const c = ref.current; if (!c || cancelled) return;
      c.width = vp.width; c.height = vp.height; c.style.width = `${vp.width / dpr}px`;
      task = page.render({ canvasContext: c.getContext('2d'), viewport: vp });
      try { await task.promise; } catch (e) { /* cancelled */ }
    })();
    return () => { cancelled = true; if (task) task.cancel(); };
  }, [doc, pageNo, width]);
  return <canvas ref={ref} className="rpv-page" />;
}

// Live preview of the exact PDF that will be downloaded: the file is built, then rendered page by page.
export default function ResumePdfPreview({ data, settings, width = 420 }) {
  const [doc, setDoc] = useState(null);
  const [err, setErr] = useState('');
  const key = JSON.stringify([data, settings]);
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const { bytes } = await buildResumePdf(data, settings);
        const pdfjs = await loadPdfJs();
        const pdf = await pdfjs.getDocument({ data: bytes, isEvalSupported: false }).promise;
        if (cancelled) { pdf.destroy(); return; }
        setDoc(pdf); setErr('');
      } catch (e) { if (!cancelled) setErr('Could not render the preview.'); }
    }, 350); // wait for typing to settle
    return () => { cancelled = true; clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  useEffect(() => () => { if (doc) doc.destroy(); }, [doc]);
  if (err) return <p className="muted">{err}</p>;
  if (!doc) return <p className="muted">Building preview…</p>;
  return <div className="rpv">{Array.from({ length: doc.numPages }, (_, i) => <Page key={`${i}-${doc.loadingTask?.docId}`} doc={doc} pageNo={i + 1} width={width} />)}</div>;
}
