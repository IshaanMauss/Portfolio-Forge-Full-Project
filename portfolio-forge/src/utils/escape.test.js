import { escapeHtml, safeUrl, safeColor } from './escape';

test('escapeHtml neutralizes markup', () => {
  expect(escapeHtml('<img src=x onerror="alert(1)">')).toBe('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
  expect(escapeHtml(null)).toBe('');
});

test('safeUrl only allows http(s)', () => {
  expect(safeUrl('javascript:alert(1)')).toBe('');
  expect(safeUrl('data:text/html,<script>')).toBe('');
  expect(safeUrl('example.com')).toBe('https://example.com/');
  expect(safeUrl('http://example.com/a')).toBe('http://example.com/a');
  expect(safeUrl('example.com:8080/x')).toBe('https://example.com:8080/x');
  expect(safeUrl('')).toBe('');
});

test('safeColor falls back for non-hex values', () => {
  expect(safeColor('#64ffda', '#000')).toBe('#64ffda');
  expect(safeColor('red;} body{display:none', '#000')).toBe('#000');
});
