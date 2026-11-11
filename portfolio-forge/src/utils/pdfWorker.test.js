const fs = require('fs');
const path = require('path');

// Regression guard: webpack once rewrote the PDF worker and injected require() calls, which broke
// every PDF upload in the browser. The worker must be shipped untouched from /public.
test('the PDF worker in /public is the untouched pdf.js build', () => {
  const file = path.join(__dirname, '..', '..', 'public', 'pdf.worker.3.11.174.min.js');
  const code = fs.readFileSync(file, 'utf8');
  expect(code).toMatch(/pdf\.js|pdfjs|PDF\.js/i);
  expect(code).not.toMatch(/require\(["'][A-Za-z]:[\\/]/);
  expect(code.startsWith('var _defineProperty=require')).toBe(false);
});
