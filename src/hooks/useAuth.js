import { useEffect, useState } from 'react';
import { onAuthStateChanged, signInAnonymously, signInWithCustomToken } from 'firebase/auth';

const resolveGlobal = (key) => {
  if (typeof window !== 'undefined' && typeof window[key] !== 'undefined') {
    return window[key];
  }
  if (typeof globalThis !== 'undefined' && typeof globalThis[key] !== 'undefined') {
    return globalThis[key];
  }
  return undefined;
};

const initialAuthToken =
  resolveGlobal('__initial_auth_token') ||
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_INITIAL_AUTH_TOKEN) ||
  (typeof process !== 'undefined' && process.env?.VITE_INITIAL_AUTH_TOKEN) ||
  null;

export function useAuth(firebaseAuth) {
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    if (!firebaseAuth) {
      setUserId(null);
      setIsAuthReady(false);
      return undefined;
    }

    setIsAuthReady(false);

    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      if (user) {
        setUserId(user.uid);
      } else if (initialAuthToken) {
        try {
          await signInWithCustomToken(firebaseAuth, initialAuthToken);
        } catch (error) {
          console.error('Connexion avec token initial impossible, tentative anonyme.', error);
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
