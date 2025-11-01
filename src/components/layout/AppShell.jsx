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
