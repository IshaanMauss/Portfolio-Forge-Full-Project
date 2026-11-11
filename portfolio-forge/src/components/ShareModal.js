import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

function ShareModal({ url, title, unpublished, onClose }) {
  const [copied, setCopied] = useState(false);
  const inputRef = useRef(null);
  const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share;
  const text = `${title || 'My portfolio'} - check out my portfolio`;

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      inputRef.current?.select();
      document.execCommand('copy');
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const nativeShare = async () => {
    try {
      await navigator.share({ title: title || 'My portfolio', text, url });
    } catch {
      /* user cancelled */
    }
  };

  const enc = encodeURIComponent;
  const links = [
    { label: 'WhatsApp', href: `https://wa.me/?text=${enc(`${text} ${url}`)}` },
    { label: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}` },
    { label: 'X', href: `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}` },
    { label: 'Email', href: `mailto:?subject=${enc(title || 'My portfolio')}&body=${enc(`${text}\n${url}`)}` },
  ];

  return (
    <div className="share-backdrop" onClick={onClose}>
      <div
        className="share-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="share-title">Share your portfolio</h3>
        {unpublished && (
          <p className="share-warning">
            You have unpublished changes. Click <strong>Save &amp; Publish</strong> first so people see the latest version.
          </p>
        )}
        <div className="share-link-row">
          <input id="share-url" ref={inputRef} readOnly value={url} onFocus={(e) => e.target.select()} aria-label="Public link" />
          <button type="button" className="btn-primary" onClick={copy}>{copied ? 'Copied!' : 'Copy'}</button>
        </div>
        {canNativeShare && (
          <button type="button" className="btn-primary share-native" onClick={nativeShare}>Share…</button>
        )}
        <div className="share-targets">
          {links.map((l) => (
            <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer">{l.label}</a>
          ))}
          <Link to={new URL(url).pathname} onClick={onClose}>Open</Link>
        </div>
        <button type="button" className="btn-secondary share-close" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

export default ShareModal;
