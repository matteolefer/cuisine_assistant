import { useEffect, useState } from 'react';
import { onAuthStateChanged, signInAnonymously, signInWithCustomToken } from 'firebase/auth';

const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

export function useAuth(firebaseAuth) {
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    if (!firebaseAuth) return undefined;

    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      if (user) {
        setUserId(user.uid);
      } else if (initialAuthToken) {
        try {
          await signInWithCustomToken(firebaseAuth, initialAuthToken);
        } catch (error) {
          await signInAnonymously(firebaseAuth);
        }
      } else {
        await signInAnonymously(firebaseAuth);
      }
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, [firebaseAuth]);

  return { userId, isAuthReady };
}

export default useAuth;
