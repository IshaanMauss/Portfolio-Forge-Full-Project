import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FEATURES } from '../utils/features';
import { getConsent, setConsent } from '../utils/consent';
import './Legal.css';

// Shown only when ads are enabled. "Reject" is as easy as "Accept" (no dark patterns).
function ConsentBanner() {
  const [decided, setDecided] = useState(() => getConsent() !== null);
  useEffect(() => {
    const on = () => setDecided(getConsent() !== null);
    window.addEventListener('pf-consent', on);
    return () => window.removeEventListener('pf-consent', on);
  }, []);
  if (!FEATURES.ads || decided) return null;
  return (
    <div className="consent" role="dialog" aria-label="Privacy choices">
      <p>We show ads to keep this free. Allow cookies for personalised ads? Essential storage (login, theme) is always on. <Link to="/privacy">Details</Link></p>
      <div className="consent-actions">
        <button type="button" className="pe-btn" onClick={() => setConsent(false)}>Reject</button>
        <button type="button" className="pe-btn primary" onClick={() => setConsent(true)}>Accept</button>
      </div>
    </div>
  );
}

export default ConsentBanner;
