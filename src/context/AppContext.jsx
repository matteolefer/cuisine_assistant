import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { doc, getFirestore, onSnapshot, setLogLevel } from 'firebase/firestore';
import { VIEWS } from '../constants';
import firestoreService from '../services/firestoreService';
import useAuth from '../hooks/useAuth';
import useFirestoreQuery from '../hooks/useFirestoreQuery';
import { useTranslation } from 'react-i18next';

// ------------------------------------------------------------
// 🔧 Utilitaires internes
// ------------------------------------------------------------
const resolveGlobalValue = (key) => {
  if (typeof window !== 'undefined' && typeof window[key] !== 'undefined') {
    return window[key];
  }
  if (typeof globalThis !== 'undefined' && typeof globalThis[key] !== 'undefined') {
    return globalThis[key];
  }
  return undefined;
};

// ------------------------------------------------------------
// ⚙️ Configuration Firebase
// ------------------------------------------------------------
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const validateFirebaseConfig = (config) => {
  if (!config || typeof config !== 'object') {
    throw new Error(
      "Configuration Firebase invalide. Fournissez un objet JSON contenant les clés officielles (apiKey, authDomain, projectId, etc.).",
    );
  }

  const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'appId'];
  const missingKeys = requiredKeys.filter((key) => !config[key]);
  if (missingKeys.length > 0) {
    throw new Error(
      `Configuration Firebase incomplète. Clés manquantes: ${missingKeys.join(', ')}.`,
    );
  }
  return config;
};

const appId =
  resolveGlobalValue('__app_id') ||
  import.meta.env.VITE_APP_ID ||
  'cuisine-assistante';

if (firebaseConfig) {
  setLogLevel('debug');
}

// ------------------------------------------------------------
// 🧠 Contexte principal
// ------------------------------------------------------------
const AppContext = createContext(null);
export const useAppContext = () => useContext(AppContext);

// ------------------------------------------------------------
// 🧩 Provider principal
// ------------------------------------------------------------
export function AppProvider({ children }) {
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [initializationError, setInitializationError] = useState(null);
  const { t, i18n } = useTranslation();

  const [language, setLanguageState] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem('culina_lang') || i18n.language || 'fr';
    }
    return i18n.language || 'fr';
  });

  useEffect(() => {
    if (language && language !== i18n.language) {
      i18n.changeLanguage(language);
    }
    if (typeof window !== 'undefined' && window.localStorage && language) {
      window.localStorage.setItem('culina_lang', language);
    }
  }, [language, i18n]);

  const setLanguage = useCallback((nextLanguage) => {
    setLanguageState(nextLanguage);
  }, []);

  // --- Initialisation Firebase ---
  useEffect(() => {
    if (db || auth) return;

    if (!firebaseConfig) {
      setInitializationError(
        "Configuration Firebase manquante. Merci de fournir '__firebase_config' ou VITE_FIREBASE_CONFIG.",
      );
      return;
    }

    try {
      const sanitizedConfig = validateFirebaseConfig(firebaseConfig);
      const app = initializeApp(sanitizedConfig);
      setDb(getFirestore(app));
      setAuth(getAuth(app));
    } catch (error) {
      console.error("Erreur d'initialisation Firebase:", error);
      setInitializationError(
        error.message ||
          "Impossible d'initialiser Firebase. Vérifiez la configuration fournie.",
      );
    }
  }, [auth, db]);

  // --- Authentification ---
  const { userId, isAuthReady } = useAuth(auth);

  // --- Toasts ---
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success') => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3000);
  }, []);

  // --- Connexion Google ---
  const handleGoogleLogin = useCallback(async () => {
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      addToast(t('toast.login_success', { name: user.displayName }), 'success');
    } catch (error) {
      console.error('Erreur de connexion Google:', error);
      addToast(t('toast.login_error'), 'error');
    }
  }, [auth, addToast, t]);

  // --- Déconnexion ---
  const handleLogout = useCallback(async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      addToast(t('toast.logout_success'), 'success');
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
      addToast(t('toast.logout_error'), 'error');
    }
  }, [auth, addToast, t]);

  // --- Données Firestore ---
  const { data: ingredients } = useFirestoreQuery(db, appId, userId, 'ingredients_stock');
  const { data: equipments } = useFirestoreQuery(db, appId, userId, 'equipments_stock');
  const { data: savedRecipes } = useFirestoreQuery(db, appId, userId, 'saved_recipes');
  const { data: shoppingList } = useFirestoreQuery(db, appId, userId, 'shopping_list');

  // --- Plan hebdomadaire ---
  const planPath = appId && userId ? `artifacts/${appId}/users/${userId}/planning/weekly_plan` : null;

  const [plan, setPlan] = useState({});

  useEffect(() => {
    if (!db || !planPath) return undefined;
    const unsubscribe = onSnapshot(doc(db, planPath), (docSnap) => {
      setPlan(docSnap.exists() ? docSnap.data() : {});
    });
    return () => unsubscribe();
  }, [db, planPath]);

  const updatePlan = useCallback(
    (updater) => {
      if (!planPath || !db) {
        throw new Error('Impossible de mettre à jour le planning sans Firestore initialisé.');
      }
      setPlan((previousPlan) => {
        const nextPlan =
          typeof updater === 'function' ? updater(previousPlan) : updater;
        firestoreService
          .setItem(db, planPath, nextPlan)
          .catch((error) =>
            console.error('Erreur de sauvegarde du planning:', error),
          );
        return nextPlan;
      });
    },
    [db, planPath],
  );

  // --- Autres états ---
  const [activeView, setActiveView] = useState(VIEWS.STOCK);


  // --- Valeur exposée ---
  const value = {
    db,
    auth,
    userId,
    appId,
    isAuthReady,
    activeView,
    setActiveView,
    addToast,
    toasts,
    ingredients,
    equipments,
    savedRecipes,
    shoppingList,
    plan,
    updatePlan,
    initializationError,
    handleGoogleLogin,
    handleLogout,
    language,
    setLanguage,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export default AppContext;
