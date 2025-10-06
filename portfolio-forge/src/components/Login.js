import React from 'react';
import { auth, googleProvider } from '../firebase/config';
import { signInWithPopup } from 'firebase/auth';
import { toast } from 'react-toastify';
import Footer from './Footer'; // <-- 1. Import the Footer

function Login() {
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success("Login successful! Welcome.");
    } catch (error) {
      console.error("Error during login:", error);
      toast.error("There was an error during sign-in. Please try again.");
    }
  };

  return (
    <div className="login-container">
      <h1>Welcome to Portfolio Forge</h1>
      <p>Your professional portfolio, simplified.</p>
      <button onClick={handleLogin} className="login-button">
        Sign In with Google
      </button>
      <Footer /> {/* <-- 2. Add the Footer component here */}
    </div>
  );
}

export default Login;