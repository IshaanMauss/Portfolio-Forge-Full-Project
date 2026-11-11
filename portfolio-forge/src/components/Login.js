import React, { Suspense, lazy } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { auth, googleProvider } from '../firebase/config';
import { signInWithPopup } from 'firebase/auth';
import { toast } from 'react-toastify';
import Footer from './Footer';

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
      <Footer />
    </main>
  );
}

export default Login;
