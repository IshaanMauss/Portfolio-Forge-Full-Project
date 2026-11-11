import { looksLikePdf } from './pdfText';

// Minimal File stand-in: looksLikePdf only calls slice(...).arrayBuffer().
const fileOf = (content) => ({ slice: () => ({ arrayBuffer: async () => Uint8Array.from(Buffer.from(content)).buffer }) });

test('accepts a PDF whatever its name or MIME type', async () => {
  expect(await looksLikePdf(fileOf('%PDF-1.4\n...'))).toBe(true);
  expect(await looksLikePdf(fileOf('\n%PDF-1.7'))).toBe(true);
});

test('rejects non-PDF content and missing files', async () => {
  expect(await looksLikePdf(fileOf('hello world'))).toBe(false);
  expect(await looksLikePdf(null)).toBe(false);
});
