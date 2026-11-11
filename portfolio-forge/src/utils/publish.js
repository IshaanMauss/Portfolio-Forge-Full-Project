import { doc, getDoc, getDocs, collection, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { sanitizeForPublic } from './sanitize';

// Writes a sanitized copy of every version to the public `published` area and
// removes published copies of versions that no longer exist.
// NOTE: version names and goals are intentionally NOT published.
export async function publishAll(uid, data) {
  const versions = data.meta?.versions || [{ id: 'default', name: 'Main Portfolio' }];
  const activeVersion = data.meta?.activeVersion || 'default';

  const existing = await getDocs(collection(db, 'published', uid, 'versions'));
  const batch = writeBatch(db);
  const keep = new Set();

  versions.forEach((v) => {
    const portfolio = data.portfolios?.[v.id];
    if (!portfolio) return;
    keep.add(v.id);
    batch.set(doc(db, 'published', uid, 'versions', v.id), {
      ...sanitizeForPublic(portfolio),
      publishedAt: serverTimestamp(),
    });
  });

  existing.forEach((d) => {
    if (!keep.has(d.id)) batch.delete(d.ref);
  });

  batch.set(doc(db, 'published', uid), {
    activeVersion: keep.has(activeVersion) ? activeVersion : 'default',
    updatedAt: serverTimestamp(),
  });

  await batch.commit();
}

export async function hasPublished(uid) {
  const snap = await getDoc(doc(db, 'published', uid));
  return snap.exists();
}
