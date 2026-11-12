import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Vite replaces Create React App. Existing REACT_APP_* names and `process.env.X` reads keep working,
// so .env.local and CI settings do not change. The build still lands in ./build for Firebase Hosting.
const KNOWN = [
  'REACT_APP_FIREBASE_API_KEY', 'REACT_APP_FIREBASE_AUTH_DOMAIN', 'REACT_APP_FIREBASE_PROJECT_ID',
  'REACT_APP_FIREBASE_STORAGE_BUCKET', 'REACT_APP_FIREBASE_MESSAGING_SENDER_ID', 'REACT_APP_FIREBASE_APP_ID',
  'REACT_APP_FIREBASE_MEASUREMENT_ID', 'REACT_APP_CONTACT_EMAIL', 'REACT_APP_AI_URL', 'REACT_APP_SITE_URL',
];

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'REACT_APP_');
  const processEnv = { NODE_ENV: mode === 'production' ? 'production' : mode, PUBLIC_URL: '' };
  KNOWN.forEach((k) => { processEnv[k] = env[k] || ''; });
  Object.keys(env).forEach((k) => { processEnv[k] = env[k]; });
  return {
    plugins: [react({ include: /\.(js|jsx)$/ })],
    // The code base keeps JSX in .js files.
    esbuild: { loader: 'jsx', include: /src\/.*\.jsx?$/, exclude: [] },
    optimizeDeps: { esbuildOptions: { loader: { '.js': 'jsx' } } },
    define: { 'process.env': JSON.stringify(processEnv) },
    server: { port: 3000, open: false },
    build: { outDir: 'build', assetsDir: 'static', sourcemap: false, target: 'es2020', chunkSizeWarningLimit: 900 },
    test: { environment: 'jsdom', globals: true, include: ['src/**/*.test.js'], restoreMocks: true },
  };
});
