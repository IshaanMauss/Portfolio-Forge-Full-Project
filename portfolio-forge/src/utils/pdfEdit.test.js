import { toOriginal } from './pdfEdit';

test('maps displayed fractions back to the unrotated page', () => {
  expect(toOriginal(0.2, 0.3, 0)).toEqual({ ox: 0.2, oy: 0.3 });
  expect(toOriginal(1, 0, 90)).toEqual({ ox: 0, oy: 0 });   // displayed top-right = original top-left
  expect(toOriginal(1, 1, 90)).toEqual({ ox: 1, oy: 0 });
  expect(toOriginal(0, 0, 180)).toEqual({ ox: 1, oy: 1 });
  expect(toOriginal(0, 0, 270)).toEqual({ ox: 1, oy: 0 });
});

import { PDFDocument } from 'pdf-lib';
import { buildPdf } from './pdfEdit';

const makePdf = async (n) => { const d = await PDFDocument.create(); for (let i = 0; i < n; i += 1) d.addPage([300, 400]); return d.save(); };

test('merges, reorders, rotates and annotates pages', async () => {
  const a = await makePdf(2); const b = await makePdf(1);
  const sources = new Map([['a', a], ['b', b]]);
  const out = await buildPdf(sources, [
    { srcId: 'b', srcPage: 0, rotation: 0, marks: [] },
    { srcId: 'a', srcPage: 1, rotation: 90, marks: [{ type: 'text', fx: 0.5, fy: 0.5, text: 'Hello', size: 12, color: '#ff0000' }] },
  ]);
  const doc = await PDFDocument.load(out);
  expect(doc.getPageCount()).toBe(2);
  expect(doc.getPage(1).getRotation().angle).toBe(90);
});
