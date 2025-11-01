import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { VIEWS } from '../../constants';
import { featureComponents } from '../../features';
import GeneratingLoader from '../ui/GeneratingLoader';
import Toaster from '../ui/Toaster';

function getFeatureComponent(view) {
  return featureComponents[view] || featureComponents[VIEWS.STOCK];
}

function formatViewLabel(view) {
  if (!view) return '';
  return view.charAt(0).toUpperCase() + view.slice(1);
}

function AppShell() {
  const { activeView, setActiveView, toasts, isAuthReady, userId } = useAppContext();

  if (!isAuthReady || !userId) {
    return (
      <div className="flex h-screen bg-[#FFF9F2] text-[#2F2F2F] font-inter items-center justify-center">
        <GeneratingLoader />
      </div>
    );
  }

  const ActiveFeature = getFeatureComponent(activeView);

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF9F2] text-[#2F2F2F]">
      <header className="bg-[#3BA16D] text-white py-5 shadow-md">
        <h1 className="text-center text-3xl font-semibold tracking-wide">🍳 Cuisine Assistante</h1>
        <p className="text-center text-white/80 text-sm">Planifie, organise, savoure.</p>
      </header>

      <nav className="flex justify-center flex-wrap gap-3 bg-[#FCEED0] py-3 border-b border-[#FFDAB9]">
        {Object.values(VIEWS).map((viewKey) => (
          <button
            key={viewKey}
            onClick={() => setActiveView(viewKey)}
            className={`px-4 py-2 rounded-full font-medium transition-all duration-300 ${
              activeView === viewKey
                ? 'bg-[#3BA16D] text-white shadow-md'
                : 'bg-white text-[#3BA16D] hover:bg-[#DFF6E3]'
            }`}
          >
            {formatViewLabel(viewKey)}
          </button>
        ))}
      </nav>

      <main className="flex-1 flex justify-center items-start p-6">
        <div className="w-full max-w-4xl">
          <ActiveFeature />
        </div>
      </main>

      <footer className="bg-[#FCEED0] text-center py-3 text-sm text-[#555]">
        © 2025 Cuisine Assistante · Fait avec ❤️ et React
      </footer>

      <Toaster toasts={toasts} />
    </div>
  );
}

export default AppShell;

import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { VIEWS } from '../../constants';
import { featureComponents } from '../../features';
import GeneratingLoader from '../ui/GeneratingLoader';
import Toaster from '../ui/Toaster';

function getFeatureComponent(view) {
  return featureComponents[view] || featureComponents[VIEWS.STOCK];
}

function formatViewLabel(view) {
  if (!view) return '';
  return view.charAt(0).toUpperCase() + view.slice(1);
}

function AppShell() {
  const { activeView, setActiveView, toasts, isAuthReady, userId, initializationError } = useAppContext();

  if (initializationError) {
    return (
      <div className="flex h-screen bg-[#FFF9F2] text-[#2F2F2F] font-inter items-center justify-center p-6">
        <div className="w-full max-w-xl bg-white border border-red-200 text-red-700 rounded-2xl shadow-xl p-8 space-y-5">
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-semibold">Configuration Firebase requise</h2>
            <p className="text-sm leading-relaxed">{initializationError}</p>
          </div>
          <ol className="text-left text-sm leading-relaxed space-y-2 text-red-600/90">
            <li className="flex items-start gap-3">
              <span className="mt-1 h-5 w-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-semibold">
                1
              </span>
              Activez Firestore et Authentication dans la console Firebase.
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 h-5 w-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-semibold">
                2
              </span>
              Ajoutez la configuration web dans <code className="px-1 py-0.5 bg-red-50 rounded">window.__firebase_config</code> ou <code className="px-1 py-0.5 bg-red-50 rounded">VITE_FIREBASE_CONFIG</code>.
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 h-5 w-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-semibold">
                3
              </span>
              Rechargez la page, puis vérifiez la console du navigateur en cas d'erreur persistante.
            </li>
          </ol>
          <p className="text-xs text-red-500 text-center">
            Besoin d'aide ? Consultez le README pour un exemple de configuration complète.
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthReady || !userId) {
    return (
      <div className="flex h-screen bg-[#FFF9F2] text-[#2F2F2F] font-inter items-center justify-center">
        <GeneratingLoader />
      </div>
    );
  }

  const ActiveFeature = getFeatureComponent(activeView);

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF9F2] text-[#2F2F2F]">
      <header className="bg-[#3BA16D] text-white py-5 shadow-md relative">
        <h1 className="text-center text-3xl font-semibold tracking-wide">🍳 Cuisine Assistante</h1>
        <p className="text-center text-white/80 text-sm">Planifie, organise, savoure.</p>
      </header>

      <nav className="flex justify-center flex-wrap gap-3 bg-[#FCEED0] py-3 border-b border-[#FFDAB9]">
        {Object.values(VIEWS).map((viewKey) => (
          <button
            key={viewKey}
            onClick={() => setActiveView(viewKey)}
            className={`px-4 py-2 rounded-full font-medium transition-all duration-300 ${
              activeView === viewKey
                ? 'bg-[#3BA16D] text-white shadow-md'
                : 'bg-white text-[#3BA16D] hover:bg-[#DFF6E3]'
            }`}
          >
            {formatViewLabel(viewKey)}
          </button>
        ))}
      </nav>

      <main className="flex-1 flex justify-center items-start p-6">
        <div className="w-full max-w-4xl">
          <ActiveFeature />
        </div>
      </main>

      <footer className="bg-[#FCEED0] text-center py-3 text-sm text-[#555]">
        © 2025 Cuisine Assistante · Fait avec ❤️ et React
      </footer>

      <Toaster toasts={toasts} />
    </div>
  );
}

export default AppShell;
