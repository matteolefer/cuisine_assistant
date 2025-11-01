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
const appId = resolveGlobalValue('__app_id') || import.meta.env.VITE_APP_ID || 'cuisine-assistante';

if (firebaseConfig) {
  setLogLevel('debug');
}

const AppContext = createContext(null);

export const useAppContext = () => useContext(AppContext);

export function AppProvider({ children }) {
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
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
      const app = initializeApp(firebaseConfig);
      setDb(getFirestore(app));
      setAuth(getAuth(app));
    } catch (error) {
      console.error("Erreur d'initialisation Firebase:", error);
      setInitializationError("Impossible d'initialiser Firebase. Vérifiez la configuration fournie.");
    }
  }, [auth, db, firebaseConfig, initializationError]);

  const { userId, isAuthReady } = useAuth(auth);

  const { data: ingredients } = useFirestoreQuery(db, appId, userId, 'ingredients_stock');
  const { data: equipments } = useFirestoreQuery(db, appId, userId, 'equipments_stock');
  const { data: savedRecipes } = useFirestoreQuery(db, appId, userId, 'saved_recipes');
  const { data: shoppingList } = useFirestoreQuery(db, appId, userId, 'shopping_list');

  const planPath = useMemo(() => {
    if (!appId || !userId) return null;
    return `artifacts/${appId}/users/${userId}/planning/weekly_plan`;
  }, [appId, userId]);

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
        const nextPlan = typeof updater === 'function' ? updater(previousPlan) : updater;
        firestoreService
          .setItem(db, planPath, nextPlan)
          .catch((error) => console.error('Erreur de sauvegarde du planning:', error));
        return nextPlan;
      });
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
    initializationError,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export default AppContext;
