import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { doc, getFirestore, onSnapshot, setLogLevel } from 'firebase/firestore';
import { VIEWS } from '../constants';
import firestoreService from '../services/firestoreService';
import useAuth from '../hooks/useAuth';
import useFirestoreQuery from '../hooks/useFirestoreQuery';

<<<<<<< HEAD
const resolveGlobalValue = (key) => {
  if (typeof window !== 'undefined' && typeof window[key] !== 'undefined') {
    return window[key];
  }
  if (typeof globalThis !== 'undefined' && typeof globalThis[key] !== 'undefined') {
    return globalThis[key];
  }
  return undefined;
};

const parseMaybeJson = (value) => {
  if (!value) return null;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch (error) {
    console.warn('Impossible de parser la configuration Firebase fournie.', error);
    return null;
  }
};

const firebaseConfig = parseMaybeJson(
  resolveGlobalValue('__firebase_config') || import.meta.env.VITE_FIREBASE_CONFIG,
);

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
const appId = resolveGlobalValue('__app_id') || import.meta.env.VITE_APP_ID || 'cuisine-assistante';

if (firebaseConfig) {
  setLogLevel('debug');
}
=======
setLogLevel('debug');

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig =
  typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;
>>>>>>> main

const AppContext = createContext(null);

export const useAppContext = () => useContext(AppContext);

export function AppProvider({ children }) {
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
<<<<<<< HEAD
  const [initializationError, setInitializationError] = useState(null);

  useEffect(() => {
    if (db || auth) {
      return;
    }

    if (!firebaseConfig) {
      setInitializationError(
        "Configuration Firebase manquante. Merci de fournir '__firebase_config' ou VITE_FIREBASE_CONFIG.",
      );
      return;
    }

    if (initializationError) {
      setInitializationError(null);
    }

    try {
      const sanitizedConfig = validateFirebaseConfig(firebaseConfig);
      const app = initializeApp(sanitizedConfig);
=======

  useEffect(() => {
    if (!firebaseConfig || db) return;
    try {
      const app = initializeApp(firebaseConfig);
>>>>>>> main
      setDb(getFirestore(app));
      setAuth(getAuth(app));
    } catch (error) {
      console.error("Erreur d'initialisation Firebase:", error);
<<<<<<< HEAD
      setInitializationError(error.message || "Impossible d'initialiser Firebase. Vérifiez la configuration fournie.");
    }
  }, [auth, db, firebaseConfig, initializationError]);
=======
    }
  }, [db]);

  if (!firebaseConfig) {
    console.error('Erreur critique: Configuration Firebase manquante.');
  }
>>>>>>> main

  const { userId, isAuthReady } = useAuth(auth);

  const { data: ingredients } = useFirestoreQuery(db, appId, userId, 'ingredients_stock');
  const { data: equipments } = useFirestoreQuery(db, appId, userId, 'equipments_stock');
  const { data: savedRecipes } = useFirestoreQuery(db, appId, userId, 'saved_recipes');
  const { data: shoppingList } = useFirestoreQuery(db, appId, userId, 'shopping_list');

<<<<<<< HEAD
=======
  const [plan, setPlan] = useState({});
>>>>>>> main
  const planPath = useMemo(() => {
    if (!appId || !userId) return null;
    return `artifacts/${appId}/users/${userId}/planning/weekly_plan`;
  }, [appId, userId]);

<<<<<<< HEAD
  const [plan, setPlan] = useState({});

=======
>>>>>>> main
  useEffect(() => {
    if (!db || !planPath) return undefined;

    const unsubscribe = onSnapshot(doc(db, planPath), (docSnap) => {
      setPlan(docSnap.exists() ? docSnap.data() : {});
    });

    return () => unsubscribe();
  }, [db, planPath]);

  const updatePlan = useCallback(
<<<<<<< HEAD
    (updater) => {
      if (!planPath || !db) {
        throw new Error('Impossible de mettre à jour le planning sans Firestore initialisé.');
      }

      setPlan((previousPlan) => {
        const nextPlan = typeof updater === 'function' ? updater(previousPlan) : updater;
        firestoreService
          .setItem(db, planPath, nextPlan)
          .catch((error) => console.error('Erreur de sauvegarde du planning:', error));
        return nextPlan;
      });
=======
    (newPlan) => {
      if (!db || !planPath) return;
      setPlan(newPlan);
      firestoreService.setItem(db, planPath, newPlan);
>>>>>>> main
    },
    [db, planPath],
  );

  const [activeView, setActiveView] = useState(VIEWS.STOCK);
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3000);
  }, []);

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
<<<<<<< HEAD
    initializationError,
=======
>>>>>>> main
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export default AppContext;
