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
    if (!db || !path) return () => {};
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

  addItem: (db, path, data) => {
    return addDoc(collection(db, path), {
      ...data,
      createdAt: serverTimestamp(),
    });
  },

  deleteItem: (db, path) => {
    return deleteDoc(doc(db, path));
  },

  updateItem: (db, path, data) => {
    return updateDoc(doc(db, path), data);
  },

  setItem: (db, path, data) => {
    return setDoc(doc(db, path), data, { merge: true });
  },
};

export default firestoreService;
