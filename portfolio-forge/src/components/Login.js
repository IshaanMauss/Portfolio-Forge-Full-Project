import React, { Suspense, lazy } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { auth, googleProvider } from '../firebase/config';
import { signInWithPopup } from 'firebase/auth';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import SiteFooter from './SiteFooter';
import Seo from '../seo/Seo';
import './Legal.css';

// The 3D scene is code-split so it never slows down the editor.
const Hero3D = lazy(() => import('./Hero3D'));

const FEATURES = [
  { title: 'Many versions, one place', text: 'Keep a separate portfolio for each goal: jobs, freelance, college, a side project.' },
  { title: 'Share in one tap', text: 'Every version gets its own public link, plus a text-based PDF resume.' },
  { title: 'Free and open source', text: 'No paywall for the editor. Read the code, fork it, improve it.' },
  { title: 'Made for every screen', text: 'Edit and preview on your phone as comfortably as on a laptop.' },
];

function Login() {
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success('Login successful! Welcome.');
    } catch (error) {
      console.error('Error during login:', error);
      toast.error('There was an error during sign-in. Please try again.');
    }
  };

  return (
    <main className="login-container">
      <Seo page="home" />
      <div className="aurora" aria-hidden="true" />
      <section className="hero-landing">
        <div className="hero-copy">
          <span className="login-badge rise" style={{ '--d': '0ms' }}>Free · Open source</span>
          <h1 className="rise" style={{ '--d': '80ms' }}>Build a portfolio for <em>every</em> goal.</h1>
          <p className="rise" style={{ '--d': '160ms' }}>Create, tailor and share your portfolio and resume in minutes. One account, many versions, made for every screen.</p>
          <button type="button" onClick={handleLogin} className="login-button google-btn rise" style={{ '--d': '240ms' }}>
            <FcGoogle size={22} aria-hidden="true" />
            Continue with Google
          </button>
          <p className="hero-note rise" style={{ '--d': '300ms' }}>No card. No paywall. Your data stays yours.</p>
        </div>
        <div className="hero-visual rise" style={{ '--d': '200ms' }}>
          <Suspense fallback={null}><Hero3D /></Suspense>
        </div>
      </section>
      <div className="feature-grid">
        {FEATURES.map((f, i) => (
          <div className="feature-card tilt rise" style={{ '--d': `${360 + i * 80}ms` }} key={f.title}>
            <h3>{f.title}</h3>
            <p>{f.text}</p>
          </div>
        ))}
      </div>
      <section className="tools-strip rise" style={{ '--d': '700ms' }}>
        <h2>Free tools. No login.</h2>
        <div className="tools-strip-grid">
          <Link to="/tools/ats" className="tool-link tilt"><strong>ATS resume checker</strong><span>Score your PDF and fix what parsers can't read.</span></Link>
          <Link to="/tools/pdf" className="tool-link tilt"><strong>PDF editor</strong><span>Merge, reorder, rotate, add text and sign. Private by design.</span></Link>
        </div>
      </section>
      <section className="home-info">
        <h2>How Portfolio Forge works</h2>
        <ol>
          <li><strong>Sign in with Google.</strong> No card and no paywall.</li>
          <li><strong>Fill in your details once.</strong> Import projects from your public GitHub repositories or an existing resume PDF, and polish wording with optional AI suggestions.</li>
          <li><strong>Create a version for each goal.</strong> Choose which sections show on your portfolio and on your resume.</li>
          <li><strong>Publish and share.</strong> Get a public link and download a text-based PDF resume that applicant tracking systems can read.</li>
        </ol>
        <h2>Frequently asked questions</h2>
        <p><strong>Is it really free?</strong> Yes. The editor and tools are free and open source. To cover hosting, the free tools and guide pages may show ads in future, never inside the editor.</p>
        <p><strong>Who can see my portfolio?</strong> Only you can see your draft. Only the version you click Save &amp; Publish on becomes public, and sections you hide are removed first.</p>
        <p><strong>Can I delete my data?</strong> Yes. Export or permanently delete everything from your account page at any time.</p>
        <p><strong>Will the resume pass an ATS?</strong> The PDF is real text in a single column, which parsers read well. Use the <Link to="/tools/ats">ATS checker</Link> to test any resume, and read our <Link to="/guides">guides</Link> for advice on resumes and portfolios.</p>
      </section>
      <SiteFooter />
    </main>
  );
}

export default Login;
