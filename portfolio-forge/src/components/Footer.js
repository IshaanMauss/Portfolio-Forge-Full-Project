import React from 'react';
import './Footer.css'; // We'll create this CSS file next

function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        {/* Simple, custom SVG logo for ITV */}
        <svg width="24" height="24" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 80V20H35V50H65V20H80V80H65V50H35V80H20Z" fill="#64ffda"/>
        </svg>
        <span>Forged by ITV</span>
      </div>
    </footer>
  );
}

export default Footer;