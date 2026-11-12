const fs = require('fs');
const path = require('path');
const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');
const { doc, getDoc, getDocs, setDoc, deleteDoc, updateDoc, collection, serverTimestamp } = require('firebase/firestore');
const { ref, uploadBytes, getBytes, deleteObject } = require('firebase/storage');

const root = path.join(__dirname, '..');
let env;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-portfolio-forge',
    firestore: { rules: fs.readFileSync(path.join(root, 'firestore.rules'), 'utf8'), host: '127.0.0.1', port: 8080 },
    storage: { rules: fs.readFileSync(path.join(root, 'storage.rules'), 'utf8'), host: '127.0.0.1', port: 9199 },
  });
});
afterAll(async () => { await env.cleanup(); });
beforeEach(async () => { await env.clearFirestore(); await env.clearStorage(); });

const alice = () => env.authenticatedContext('alice').firestore();
const bob = () => env.authenticatedContext('bob').firestore();
const admin = () => env.authenticatedContext('maint', { admin: true }).firestore();
const anon = () => env.unauthenticatedContext().firestore();
const seed = (fn) => env.withSecurityRulesDisabled(async (ctx) => fn(ctx.firestore()));

describe('private draft: portfolios/{uid}', () => {
  test('owner can read and write', async () => {
    await assertSucceeds(setDoc(doc(alice(), 'portfolios/alice'), { portfolios: {} }));
    await assertSucceeds(getDoc(doc(alice(), 'portfolios/alice')));
  });
  test('other users and anonymous visitors cannot read or write', async () => {
    await seed((db) => setDoc(doc(db, 'portfolios/alice'), { portfolios: {}, address: 'secret' }));
    await assertFails(getDoc(doc(bob(), 'portfolios/alice')));
    await assertFails(getDoc(doc(anon(), 'portfolios/alice')));
    await assertFails(setDoc(doc(bob(), 'portfolios/alice'), { portfolios: {} }));
    await assertFails(setDoc(doc(anon(), 'portfolios/alice'), { portfolios: {} }));
  });
  test('documents with more than 40 top-level keys are rejected', async () => {
    const big = Object.fromEntries(Array.from({ length: 41 }, (_, i) => [`k${i}`, i]));
    await assertFails(setDoc(doc(alice(), 'portfolios/alice'), big));
  });
});

describe('job tracker: tracker/{uid}', () => {
  test('owner can store a list of jobs', async () => {
    await assertSucceeds(setDoc(doc(alice(), 'tracker/alice'), { jobs: [{ company: 'x' }] }));
  });
  test('not readable by others', async () => {
    await seed((db) => setDoc(doc(db, 'tracker/alice'), { jobs: [] }));
    await assertFails(getDoc(doc(bob(), 'tracker/alice')));
    await assertFails(getDoc(doc(anon(), 'tracker/alice')));
  });
  test('rejects extra keys, non-lists and more than 200 jobs', async () => {
    await assertFails(setDoc(doc(alice(), 'tracker/alice'), { jobs: [], extra: 1 }));
    await assertFails(setDoc(doc(alice(), 'tracker/alice'), { jobs: 'nope' }));
    await assertFails(setDoc(doc(alice(), 'tracker/alice'), { jobs: Array.from({ length: 201 }, () => ({})) }));
  });
});

describe('public copies: published/{uid}', () => {
  test('anyone can get a published pointer and version by exact id', async () => {
    await seed(async (db) => { await setDoc(doc(db, 'published/alice'), { activeVersion: 'v1' }); await setDoc(doc(db, 'published/alice/versions/v1'), { userName: 'A' }); });
    await assertSucceeds(getDoc(doc(anon(), 'published/alice')));
    await assertSucceeds(getDoc(doc(anon(), 'published/alice/versions/v1')));
  });
  test('nobody can list published portfolios (no enumeration of user ids)', async () => {
    await assertFails(getDocs(collection(anon(), 'published')));
    await assertFails(getDocs(collection(alice(), 'published')));
  });
  test('only the owner can list versions', async () => {
    await assertSucceeds(getDocs(collection(alice(), 'published/alice/versions')));
    await assertFails(getDocs(collection(bob(), 'published/alice/versions')));
    await assertFails(getDocs(collection(anon(), 'published/alice/versions')));
  });
  test('only the owner can write, and the pointer only holds activeVersion and updatedAt', async () => {
    await assertSucceeds(setDoc(doc(alice(), 'published/alice'), { activeVersion: 'v1', updatedAt: 1 }));
    await assertFails(setDoc(doc(alice(), 'published/alice'), { activeVersion: 'v1', email: 'a@b.c' }));
    await assertFails(setDoc(doc(bob(), 'published/alice'), { activeVersion: 'v1' }));
    await assertFails(setDoc(doc(anon(), 'published/alice/versions/v1'), { x: 1 }));
    await assertSucceeds(setDoc(doc(alice(), 'published/alice/versions/v1'), { userName: 'A' }));
  });
});

describe('feedback', () => {
  const good = (uid = 'alice') => ({ portfolioContextId: 'p1', submitterId: uid, submitterEmail: 'a@b.c', rating: 5, comment: 'Nice', timestamp: serverTimestamp() });
  test('signed-in user can create a valid entry for themselves', async () => {
    await assertSucceeds(setDoc(doc(alice(), 'feedback/f1'), good()));
  });
  test('anonymous users and spoofed submitters are rejected', async () => {
    await assertFails(setDoc(doc(anon(), 'feedback/f1'), good()));
    await assertFails(setDoc(doc(bob(), 'feedback/f1'), good('alice')));
  });
  test('shape and size limits are enforced', async () => {
    await assertFails(setDoc(doc(alice(), 'feedback/a'), { ...good(), rating: 6 }));
    await assertFails(setDoc(doc(alice(), 'feedback/b'), { ...good(), rating: 4.5 }));
    await assertFails(setDoc(doc(alice(), 'feedback/c'), { ...good(), comment: '' }));
    await assertFails(setDoc(doc(alice(), 'feedback/d'), { ...good(), comment: 'x'.repeat(1001) }));
    await assertFails(setDoc(doc(alice(), 'feedback/e'), { ...good(), extra: 'x' }));
    await assertFails(setDoc(doc(alice(), 'feedback/f'), { ...good(), timestamp: new Date('2020-01-01') }));
  });
  test('read: owner and admin only; delete: owner only; update: never', async () => {
    await seed((db) => setDoc(doc(db, 'feedback/f1'), { portfolioContextId: 'p', submitterId: 'alice', submitterEmail: 'a@b.c', rating: 5, comment: 'x', timestamp: 1 }));
    await assertSucceeds(getDoc(doc(alice(), 'feedback/f1')));
    await assertSucceeds(getDoc(doc(admin(), 'feedback/f1')));
    await assertFails(getDoc(doc(bob(), 'feedback/f1')));
    await assertFails(getDoc(doc(anon(), 'feedback/f1')));
    await assertFails(updateDoc(doc(alice(), 'feedback/f1'), { rating: 1 }));
    await assertFails(deleteDoc(doc(admin(), 'feedback/f1')));
    await assertFails(deleteDoc(doc(bob(), 'feedback/f1')));
    await assertSucceeds(deleteDoc(doc(alice(), 'feedback/f1')));
  });
});

describe('aiUsage is server-only', () => {
  test('clients can neither read nor write', async () => {
    await assertFails(getDoc(doc(alice(), 'aiUsage/x')));
    await assertFails(setDoc(doc(alice(), 'aiUsage/x'), { n: 1 }));
  });
});

describe('storage: profile pictures', () => {
  const png = new Uint8Array([137, 80, 78, 71]);
  const st = (ctx) => ctx.storage();
  test('owner can upload a small image; anyone can read it', async () => {
    await assertSucceeds(uploadBytes(ref(st(env.authenticatedContext('alice')), 'profilePictures/alice/a.png'), png, { contentType: 'image/png' }));
    await assertSucceeds(getBytes(ref(st(env.unauthenticatedContext()), 'profilePictures/alice/a.png')));
  });
  test('other users and anonymous visitors cannot upload or delete', async () => {
    await assertFails(uploadBytes(ref(st(env.authenticatedContext('bob')), 'profilePictures/alice/a.png'), png, { contentType: 'image/png' }));
    await assertFails(uploadBytes(ref(st(env.unauthenticatedContext()), 'profilePictures/alice/a.png'), png, { contentType: 'image/png' }));
    await env.withSecurityRulesDisabled(async (ctx) => uploadBytes(ref(ctx.storage(), 'profilePictures/alice/b.png'), png, { contentType: 'image/png' }));
    await assertFails(deleteObject(ref(st(env.authenticatedContext('bob')), 'profilePictures/alice/b.png')));
  });
  test('rejects non-images and files of 2 MB or more', async () => {
    const a = st(env.authenticatedContext('alice'));
    await assertFails(uploadBytes(ref(a, 'profilePictures/alice/x.html'), new Uint8Array([60, 104]), { contentType: 'text/html' }));
    await assertFails(uploadBytes(ref(a, 'profilePictures/alice/big.png'), new Uint8Array(2 * 1024 * 1024), { contentType: 'image/png' }));
  });
  test('other paths are closed', async () => {
    await assertFails(uploadBytes(ref(st(env.authenticatedContext('alice')), 'other/alice.png'), png, { contentType: 'image/png' }));
  });
});
