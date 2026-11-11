import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import '@fontsource-variable/plus-jakarta-sans';
import '@fontsource-variable/fraunces';
import './styles/tokens.css';
import './index.css';
import App from './App';
import { applyTheme, getInitialTheme } from './utils/appTheme';

applyTheme(getInitialTheme());

// The build writes real SEO tags and content into each public page for crawlers. React renders its own
// copies once it starts, so drop the static ones first to avoid duplicate titles or stale canonicals.
document.querySelectorAll('title, meta[name="description"], meta[name="robots"], meta[property^="og:"], meta[name^="twitter:"], link[rel="canonical"], script[data-prerender]').forEach((el) => el.remove());


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
