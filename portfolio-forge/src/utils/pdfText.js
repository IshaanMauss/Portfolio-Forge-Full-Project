// Extract text + a few layout signals from a PDF, entirely in the browser (nothing is uploaded).
export const MAX_PDF_BYTES = 10 * 1024 * 1024;

// A file is a PDF if it starts with "%PDF-", whatever its name or MIME type says. Real-world files are
// often saved without an extension (e.g. "Resume_") or reported as application/octet-stream.
export async function looksLikePdf(file) {
  if (!file) return false;
  try {
    const head = new Uint8Array(await file.slice(0, 1024).arrayBuffer());
    const text = String.fromCharCode(...head);
    return text.includes('%PDF-');
  } catch (e) {
    return false;
  }
}

export async function loadPdfJs() {
  const pdfjs = await import('pdfjs-dist/build/pdf');
  // The worker is served untouched from /public. Letting webpack bundle it injects `require()` calls
  // that no browser can run, which made every PDF fail to open.
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = `${process.env.PUBLIC_URL || ''}/pdf.worker.3.11.174.min.js`;
  }
  return pdfjs;
}

export async function extractPdf(file) {
  if (file.size > MAX_PDF_BYTES) throw new Error('That PDF is larger than 10 MB.');
  const pdfjs = await loadPdfJs();
  const data = new Uint8Array(await file.arrayBuffer());
  // isEvalSupported:false blocks the font-eval code path used by known pdf.js exploits.
  const pdf = await pdfjs.getDocument({ data, isEvalSupported: false, disableFontFace: false }).promise;
  const lines = [];
  let multi = 0;
  let total = 0;
  for (let p = 1; p <= Math.min(pdf.numPages, 6); p += 1) {
    const page = await pdf.getPage(p);
    const { width } = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();
    const rows = new Map();
    content.items.forEach((it) => {
      if (!it.str || !it.str.trim()) return;
      const y = Math.round(it.transform[5] / 3);
      if (!rows.has(y)) rows.set(y, []);
      rows.get(y).push({ x: it.transform[4], w: it.width, s: it.str });
    });
    for (const [, items] of [...rows.entries()].sort((a, b) => b[0] - a[0])) {
      items.sort((a, b) => a.x - b.x);
      let gap = false;
      for (let i = 1; i < items.length; i += 1) {
        if (items[i].x - (items[i - 1].x + items[i - 1].w) > width * 0.18) gap = true;
      }
      total += 1;
      if (gap) multi += 1;
      lines.push(items.map((i) => i.s).join(' ').replace(/\s+/g, ' ').trim());
    }
  }
  const pageCount = pdf.numPages;
  await pdf.destroy();
  return { text: lines.join('\n'), lines, pageCount, multiColumnRatio: total ? multi / total : 0 };
}
