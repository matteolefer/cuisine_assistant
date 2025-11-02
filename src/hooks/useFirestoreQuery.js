import { useEffect, useState } from 'react';
import firestoreService from '../services/firestoreService';

/**
 * Hook personnalisé pour écouter une collection Firestore en temps réel.
 * @param {object} db - Instance Firestore initialisée.
 * @param {string} appId - Identifiant global de l'application (ex: "cuisine-assistante").
 * @param {string} userId - Identifiant de l'utilisateur authentifié (UID Firebase).
 * @param {string} collectionName - Nom de la collection Firestore à écouter (ex: "ingredients_stock").
 * @returns {object} { data, loading, error }
 */
function useFirestoreQuery(db, appId, userId, collectionName) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!db || !appId || !userId || !collectionName) {
      setData([]);
      setLoading(false);
      return undefined;
    }

    const path = `artifacts/${appId}/users/${userId}/${collectionName}`;

    try {
      const unsubscribe = firestoreService.listenToCollection(db, path, (newData) => {
        setData(newData);
        setLoading(false);
      });
      return () => unsubscribe && unsubscribe();
    } catch (err) {
      console.error(`Erreur Firestore (${collectionName}):`, err);
      setError(err);
      setLoading(false);
      return undefined;
    }
  }, [db, appId, userId, collectionName]);

  return { data, loading, error };
}

export default useFirestoreQuery;
