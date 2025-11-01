import { useEffect, useMemo, useState } from 'react';
import firestoreService from '../services/firestoreService';

export function useFirestoreQuery(db, appId, userId, collectionName) {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const path = useMemo(() => {
<<<<<<< HEAD
    if (!appId || !userId || !collectionName) return null;
=======
    if (!appId || !userId) return null;
>>>>>>> main
    return `artifacts/${appId}/users/${userId}/${collectionName}`;
  }, [appId, userId, collectionName]);

  useEffect(() => {
<<<<<<< HEAD
    if (!path || !db) {
      setData([]);
      setIsLoading(false);
      return undefined;
    }
=======
    if (!db || !path) return undefined;
>>>>>>> main

    setIsLoading(true);
    const unsubscribe = firestoreService.listenToCollection(db, path, (fetchedData) => {
      setData(fetchedData);
      setIsLoading(false);
    });

<<<<<<< HEAD
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
=======
    return () => unsubscribe();
>>>>>>> main
  }, [db, path]);

  return { data, isLoading };
}

export default useFirestoreQuery;
