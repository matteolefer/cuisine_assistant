import { useEffect, useState, useCallback } from 'react';
import {
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from 'firebase/auth';

export function useAuth(firebaseAuth) {
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // --- ✅ Connexion Google ---
  const handleGoogleLogin = useCallback(async () => {
    if (!firebaseAuth) return;
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(firebaseAuth, provider);
    } catch (error) {
      console.error('Erreur de connexion Google:', error);
    }
  }, [firebaseAuth]);

  // --- ✅ Déconnexion ---
  const handleLogout = useCallback(async () => {
    if (!firebaseAuth) return;
    try {
      await signOut(firebaseAuth);
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
    }
  }, [firebaseAuth]);

  // --- 🔄 Suivi de l’état d’authentification ---
  useEffect(() => {
    if (!firebaseAuth) {
      setUserId(null);
      setIsAuthReady(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      setUserId(user ? user.uid : null);
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, [firebaseAuth]);

  return { userId, isAuthReady, handleGoogleLogin, handleLogout };
}

export default useAuth;
