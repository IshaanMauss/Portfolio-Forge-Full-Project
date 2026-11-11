// PDF export for the editor. Marks are stored in the *displayed* frame (what the user sees,
// after rotation) as fractions of the page; this maps them back into the PDF's own coordinates.
import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';

export const toOriginal = (fx, fy, rot) => {
  switch (((rot % 360) + 360) % 360) {
    case 90: return { ox: fy, oy: 1 - fx };
    case 180: return { ox: 1 - fx, oy: 1 - fy };
    case 270: return { ox: 1 - fy, oy: fx };
    default: return { ox: fx, oy: fy };
  }
};

const hexToRgb = (hex) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
  const n = m ? parseInt(m[1], 16) : 0;
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
};

/**
 * @param {Map<string, Uint8Array>} sources  source id -> original bytes
 * @param {Array} pages  [{srcId, srcPage, rotation, marks:[{type,fx,fy,text,size,color,wFrac,aspect,dataUrl}]}]
 */
export async function buildPdf(sources, pages) {
  const out = await PDFDocument.create();
  const font = await out.embedFont(StandardFonts.Helvetica);
  const loaded = new Map();
  for (const p of pages) {
    if (!loaded.has(p.srcId)) loaded.set(p.srcId, await PDFDocument.load(sources.get(p.srcId), { ignoreEncryption: false }));
    const [page] = await out.copyPages(loaded.get(p.srcId), [p.srcPage]);
    const R = (((page.getRotation().angle + p.rotation) % 360) + 360) % 360;
    page.setRotation(degrees(R));
    out.addPage(page);
    const { width: W, height: H } = page.getSize();
    const dispW = R % 180 === 0 ? W : H;
    const dispH = R % 180 === 0 ? H : W;
    for (const m of p.marks || []) {
      if (m.type === 'text') {
        const { ox, oy } = toOriginal(m.fx, m.fy, R);
        page.drawText(m.text, { x: ox * W, y: (1 - oy) * H, size: m.size, font, color: hexToRgb(m.color), rotate: degrees(R) });
      } else if (m.type === 'sig') {
        const bytes = Uint8Array.from(atob(m.dataUrl.split(',')[1]), (c) => c.charCodeAt(0));
        const img = await out.embedPng(bytes);
        const wPt = m.wFrac * dispW;
        const hPt = wPt * m.aspect;
        // Anchor = bottom-left corner of the image in the displayed frame.
        const { ox, oy } = toOriginal(m.fx, m.fy + hPt / dispH, R);
        page.drawImage(img, { x: ox * W, y: (1 - oy) * H, width: wPt, height: hPt, rotate: degrees(R) });
      }
    }
  }
  out.setProducer('Portfolio Forge');
  return out.save();
}
