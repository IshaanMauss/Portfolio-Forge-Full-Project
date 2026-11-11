import { collection, doc, getDoc, getDocs, query, where, writeBatch } from 'firebase/firestore';
import { ref, listAll, deleteObject } from 'firebase/storage';
import { deleteUser, reauthenticateWithPopup } from 'firebase/auth';
import { auth, db, storage, googleProvider } from '../firebase/config';

// Download everything we hold about the signed-in user (data portability).
export async function exportMyData() {
  const user = auth.currentUser;
  const draft = await getDoc(doc(db, 'portfolios', user.uid));
  const tracker = await getDoc(doc(db, 'tracker', user.uid));
  const fb = await getDocs(query(collection(db, 'feedback'), where('submitterId', '==', user.uid)));
  return {
    exportedAt: new Date().toISOString(),
    account: { uid: user.uid, name: user.displayName, email: user.email },
    portfolioDraft: draft.exists() ? draft.data() : null,
    jobTracker: tracker.exists() ? tracker.data() : null,
    feedbackSubmitted: fb.docs.map((d) => ({ rating: d.data().rating, comment: d.data().comment })),
  };
}

// Permanently delete the user's data, then their sign-in record.
// Re-authentication comes first, so a failure can never leave a half-deleted account.
export async function deleteMyAccount() {
  const user = auth.currentUser;
  const { uid } = user;
  await reauthenticateWithPopup(user, googleProvider);

  const versions = await getDocs(collection(db, 'published', uid, 'versions'));
  const batch = writeBatch(db);
  versions.forEach((d) => batch.delete(d.ref));
  batch.delete(doc(db, 'published', uid));
  batch.delete(doc(db, 'portfolios', uid));
  batch.delete(doc(db, 'tracker', uid));
  const fb = await getDocs(query(collection(db, 'feedback'), where('submitterId', '==', uid)));
  fb.forEach((d) => batch.delete(d.ref));
  await batch.commit();

  const files = await listAll(ref(storage, `profilePictures/${uid}`));
  await Promise.all(files.items.map((f) => deleteObject(f)));

  await deleteUser(user);
}
