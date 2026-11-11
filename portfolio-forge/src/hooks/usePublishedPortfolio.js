import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

// Loads the public, sanitized copy of a portfolio version.
export function usePublishedPortfolio(userId, versionId) {
  const [state, setState] = useState({ data: null, loading: true, error: null });

  useEffect(() => {
    let cancelled = false;
    setState({ data: null, loading: true, error: null });

    (async () => {
      try {
        if (!userId) throw new Error('Missing user id');
        const metaSnap = await getDoc(doc(db, 'published', userId));
        const version = versionId || (metaSnap.exists() && metaSnap.data().activeVersion) || 'default';
        const snap = await getDoc(doc(db, 'published', userId, 'versions', version));
        if (!cancelled) {
          setState({ data: snap.exists() ? snap.data() : null, loading: false, error: null });
        }
      } catch (error) {
        console.error('Failed to load published portfolio', error);
        if (!cancelled) setState({ data: null, loading: false, error });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, versionId]);

  return state;
}
