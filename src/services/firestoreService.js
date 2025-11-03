import * as firestore from './firebaseFirestore.js';

export const createFirestoreService = (deps = firestore) => ({
  listenToCollection: (db, path, callback) => {
    if (!db) {
      throw new Error('Firestore non initialisé : impossible de lire la collection.');
    }

    if (!path) {
      callback([]);
      return () => {};
    }

    const q = deps.query(deps.collection(db, path));
    return deps.onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
        callback(data);
      },
      (error) => {
        console.error(`Erreur listener (${path}):`, error);
      },
    );
  },

  getItems: async (db, path) => {
    if (!db) {
      throw new Error('Firestore non initialisé : impossible de lire la collection.');
    }

    if (!path) {
      return [];
    }

    const snapshot = await deps.getDocs(deps.collection(db, path));
    return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
  },

  addItem: async (db, path, data) => {
    if (!db) {
      throw new Error('Firestore non initialisé : impossible de créer le document.');
    }

    if (!path) {
      throw new Error('Chemin Firestore manquant pour la création de document.');
    }

    return deps.addDoc(deps.collection(db, path), {
      ...data,
      createdAt: deps.serverTimestamp(),
    });
  },

  deleteItem: async (db, path) => {
    if (!db) {
      throw new Error('Firestore non initialisé : impossible de supprimer le document.');
    }

    if (!path) {
      throw new Error('Chemin Firestore manquant pour la suppression.');
    }

    return deps.deleteDoc(deps.doc(db, path));
  },

  updateItem: async (db, path, data) => {
    if (!db) {
      throw new Error('Firestore non initialisé : impossible de mettre à jour le document.');
    }

    if (!path) {
      throw new Error('Chemin Firestore manquant pour la mise à jour.');
    }

    return deps.updateDoc(deps.doc(db, path), data);
  },

  setItem: async (db, path, data) => {
    if (!db) {
      throw new Error('Firestore non initialisé : impossible de définir le document.');
    }

    if (!path) {
      throw new Error('Chemin Firestore manquant pour la sauvegarde.');
    }

    return deps.setDoc(deps.doc(db, path), data, { merge: true });
  },
});

export const firestoreService = createFirestoreService();

export default firestoreService;
