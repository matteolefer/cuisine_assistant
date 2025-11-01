import {
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  updateDoc,
  setDoc,
} from 'firebase/firestore';

export const firestoreService = {
  listenToCollection: (db, path, callback) => {
    if (!db) {
      throw new Error('Firestore non initialisé : impossible de lire la collection.');
    }

    if (!path) {
      callback([]);
      return () => {};
    }

    const q = query(collection(db, path));
    return onSnapshot(
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

  addItem: async (db, path, data) => {
    if (!db) {
      throw new Error('Firestore non initialisé : impossible de créer le document.');
    }

    if (!path) {
      throw new Error('Chemin Firestore manquant pour la création de document.');
    }

    return addDoc(collection(db, path), {
      ...data,
      createdAt: serverTimestamp(),
    });
  },

  deleteItem: async (db, path) => {
    if (!db) {
      throw new Error('Firestore non initialisé : impossible de supprimer le document.');
    }

    if (!path) {
      throw new Error('Chemin Firestore manquant pour la suppression.');
    }

    return deleteDoc(doc(db, path));
  },

  updateItem: async (db, path, data) => {
    if (!db) {
      throw new Error('Firestore non initialisé : impossible de mettre à jour le document.');
    }

    if (!path) {
      throw new Error('Chemin Firestore manquant pour la mise à jour.');
    }

    return updateDoc(doc(db, path), data);
  },

  setItem: async (db, path, data) => {
    if (!db) {
      throw new Error('Firestore non initialisé : impossible de définir le document.');
    }

    if (!path) {
      throw new Error('Chemin Firestore manquant pour la sauvegarde.');
    }

    return setDoc(doc(db, path), data, { merge: true });
  },
};

export default firestoreService;
