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

setLogLevel('debug');

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig =
  typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;

const AppContext = createContext(null);

export const useAppContext = () => useContext(AppContext);

export function AppProvider({ children }) {
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);

  useEffect(() => {
    if (!firebaseConfig || db) return;
    try {
      const app = initializeApp(firebaseConfig);
      setDb(getFirestore(app));
      setAuth(getAuth(app));
    } catch (error) {
      console.error("Erreur d'initialisation Firebase:", error);
    }
  }, [db]);

  if (!firebaseConfig) {
    console.error('Erreur critique: Configuration Firebase manquante.');
  }

  const { userId, isAuthReady } = useAuth(auth);

  const { data: ingredients } = useFirestoreQuery(db, appId, userId, 'ingredients_stock');
  const { data: equipments } = useFirestoreQuery(db, appId, userId, 'equipments_stock');
  const { data: savedRecipes } = useFirestoreQuery(db, appId, userId, 'saved_recipes');
  const { data: shoppingList } = useFirestoreQuery(db, appId, userId, 'shopping_list');

  const [plan, setPlan] = useState({});
  const planPath = useMemo(() => {
    if (!appId || !userId) return null;
    return `artifacts/${appId}/users/${userId}/planning/weekly_plan`;
  }, [appId, userId]);

  useEffect(() => {
    if (!db || !planPath) return undefined;

    const unsubscribe = onSnapshot(doc(db, planPath), (docSnap) => {
      setPlan(docSnap.exists() ? docSnap.data() : {});
    });

    return () => unsubscribe();
  }, [db, planPath]);

  const updatePlan = useCallback(
    (newPlan) => {
      if (!db || !planPath) return;
      setPlan(newPlan);
      firestoreService.setItem(db, planPath, newPlan);
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
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export default AppContext;
