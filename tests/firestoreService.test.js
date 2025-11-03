import { test } from 'node:test';
import assert from 'node:assert/strict';

const mockDeps = {
  collection: (db, path) => ({ db, path }),
  getDocs: async () => ({
    docs: [
      { id: '1', data: () => ({ name: 'Item 1' }) },
      { id: '2', data: () => ({ name: 'Item 2' }) },
    ],
  }),
  addDoc: () => Promise.resolve(),
  onSnapshot: () => () => {},
  deleteDoc: () => Promise.resolve(),
  doc: (db, path) => ({ db, path }),
  serverTimestamp: () => new Date(),
  query: (value) => value,
  updateDoc: () => Promise.resolve(),
  setDoc: () => Promise.resolve(),
};

const { createFirestoreService } = await import('../src/services/firestoreService.js');
const firestoreService = createFirestoreService(mockDeps);

test('getItems retourne les documents avec leurs identifiants', async () => {
  const items = await firestoreService.getItems({}, 'path/test');
  assert.deepEqual(items, [
    { id: '1', name: 'Item 1' },
    { id: '2', name: 'Item 2' },
  ]);
});

test('getItems renvoie un tableau vide sans chemin', async () => {
  const items = await firestoreService.getItems({}, '');
  assert.deepEqual(items, []);
});

test('getItems lève une erreur sans instance Firestore', async () => {
  await assert.rejects(
    () => firestoreService.getItems(null, 'path/test'),
    /Firestore non initialisé/,
  );
});
