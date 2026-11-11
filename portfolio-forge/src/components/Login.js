import React from 'react';
import { FcGoogle } from 'react-icons/fc';
import { auth, googleProvider } from '../firebase/config';
import { signInWithPopup } from 'firebase/auth';
import { toast } from 'react-toastify';
import Footer from './Footer';

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
      <span className="login-badge">Free · Open source</span>
      <h1>Build a portfolio for every goal.</h1>
      <p>Create, tailor and share your portfolio and resume in minutes.</p>
      <button type="button" onClick={handleLogin} className="login-button google-btn">
        <FcGoogle size={22} aria-hidden="true" />
        Continue with Google
      </button>
      <div className="feature-grid">
        {FEATURES.map((f) => (
          <div className="feature-card" key={f.title}>
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
