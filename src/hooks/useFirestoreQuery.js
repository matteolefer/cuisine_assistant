import { useEffect, useMemo, useState } from 'react';
import firestoreService from '../services/firestoreService';

export function useFirestoreQuery(db, appId, userId, collectionName) {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const path = useMemo(() => {
    if (!appId || !userId) return null;
    return `artifacts/${appId}/users/${userId}/${collectionName}`;
  }, [appId, userId, collectionName]);

  useEffect(() => {
    if (!db || !path) return undefined;

    setIsLoading(true);
    const unsubscribe = firestoreService.listenToCollection(db, path, (fetchedData) => {
      setData(fetchedData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [db, path]);

  return { data, isLoading };
}

export default useFirestoreQuery;
