import { useEffect, useState } from 'react';
import firestoreService from '../services/firestoreService.js';

/**
 * Hook personnalisé pour écouter une collection Firestore en temps réel.
 * @param {object} db - Instance Firestore initialisée.
 * @param {string} appId - Identifiant global de l'application (ex: "cuisine-assistante").
 * @param {string} userId - Identifiant de l'utilisateur authentifié (UID Firebase).
 * @param {string} collectionName - Nom de la collection Firestore à écouter (ex: "ingredients_stock").
 * @returns {object} { data, loading, error }
 */
export function createUseFirestoreQuery({ useStateHook, useEffectHook }) {
  return function useFirestoreQuery(db, appId, userId, collectionName) {
    const [data, setData] = useStateHook([]);
    const [loading, setLoading] = useStateHook(true);
    const [error, setError] = useStateHook(null);

    useEffectHook(() => {
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
  };
}

const useFirestoreQuery = createUseFirestoreQuery({
  useStateHook: useState,
  useEffectHook: useEffect,
});

export default useFirestoreQuery;
