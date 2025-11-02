import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { VIEWS } from '../../constants';
import { featureComponents } from '../../features';
import GeneratingLoader from '../ui/GeneratingLoader';
import Toaster from '../ui/Toaster';
import { icons } from '../ui/icons'; // 👈 pour icônes Google / Logout

function getFeatureComponent(view) {
  return featureComponents[view] || featureComponents[VIEWS.STOCK];
}

function formatViewLabel(view) {
  if (!view) return '';
  return view.charAt(0).toUpperCase() + view.slice(1);
}

function AppShell() {
  const {
    activeView,
    setActiveView,
    toasts,
    isAuthReady,
    userId,
    handleGoogleLogin,
    handleLogout,
    initializationError,
  } = useAppContext();

  // --- 🔴 Erreur Firebase ---
  if (initializationError) {
    return (
      <div className="flex h-screen bg-[#FFF5E8] text-[#4B4B4B] font-inter items-center justify-center p-6">
        <div className="w-full max-w-xl bg-white border border-red-200 text-red-700 rounded-2xl shadow-xl p-8 space-y-5">
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-semibold">Firebase Configuration Required</h2>
            <p className="text-sm leading-relaxed">{initializationError}</p>
          </div>
          <ol className="text-left text-sm leading-relaxed space-y-2 text-red-600/90">
            <li className="flex items-start gap-3">
              <span className="mt-1 h-5 w-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-semibold">
                1
              </span>
              Enable Firestore and Authentication in Firebase console.
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 h-5 w-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-semibold">
                2
              </span>
              Add your web config under{' '}
              <code className="px-1 py-0.5 bg-red-50 rounded">window.__firebase_config</code> or{' '}
              <code className="px-1 py-0.5 bg-red-50 rounded">VITE_FIREBASE_CONFIG</code>.
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 h-5 w-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-semibold">
                3
              </span>
              Reload the page and check console if error persists.
            </li>
          </ol>
        </div>
      </div>
    );
  }

  // --- 🟠 Loader Auth Firebase ---
  if (!isAuthReady) {
    return (
      <div className="flex h-screen bg-[#FFF5E8] text-[#4B4B4B] font-inter items-center justify-center">
        <GeneratingLoader />
      </div>
    );
  }

  // --- 🔐 Écran de connexion Google ---
  if (!userId) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#FFF5E8] text-[#4B4B4B] font-[Poppins] px-6 text-center">
        <img
          src="/assets/logo/logo_culina.png"
          alt="Culina"
          className="h-32 w-auto mb-8"
        />
        <h1 className="text-5xl font-serif text-sage font-bold tracking-wide mb-2">
          Culina
        </h1>
        <p className="italic text-lg text-sage mb-10">
          Cook simply, feel inspired
        </p>
        <button
          onClick={handleGoogleLogin}
          className="flex items-center bg-white text-[#444] border border-gray-300 rounded-lg shadow-md px-6 py-3 hover:bg-gray-50 transition-all"
        >
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google"
            className="w-6 h-6 mr-3"
          />
          <span className="text-lg font-medium">Se connecter avec Google</span>
        </button>
        <p className="mt-6 text-sm text-gray-500">
          Votre compte Google est utilisé uniquement pour l’accès et la
          synchronisation sécurisée de vos recettes.
        </p>
        <Toaster toasts={toasts} />
      </div>
    );
  }

  // --- 🟢 Affichage principal ---
  const ActiveFeature = getFeatureComponent(activeView);

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF5E8] text-[#4B4B4B] font-[Poppins]">
      {/* ===== HEADER ===== */}
      <header className="bg-linen flex flex-col sm:flex-row items-center justify-between py-8 px-8 shadow-sm">
        <div className="flex items-center space-x-6">
          <img
            src="/assets/logo/logo_culina.png"
            alt="Culina"
            className="h-20 sm:h-24 md:h-28 w-auto"
          />
          <div>
            <h1 className="text-5xl sm:text-6xl font-serif text-sage font-bold tracking-wide">
              Culina
            </h1>
            <p className="italic text-lg text-sage mt-1">
              Cook simply, feel inspired
            </p>
          </div>
        </div>

        {/* --- Bouton Logout --- */}
        <button
          onClick={handleLogout}
          className="flex items-center bg-[#627E63] text-white font-medium px-5 py-2 rounded-full shadow-md hover:bg-[#506C52] transition-all mt-6 sm:mt-0"
        >
          <icons.Logout className="w-5 h-5 mr-2" />
          Déconnexion
        </button>
      </header>

      {/* ===== NAVIGATION ===== */}
      <nav className="flex justify-center flex-wrap gap-3 bg-[#F9F6F2] py-3 border-b border-[#EDE6DD] shadow-sm">
        {Object.values(VIEWS).map((viewKey) => (
          <button
            key={viewKey}
            onClick={() => setActiveView(viewKey)}
            className={`px-4 py-2 rounded-full font-medium transition-all duration-300 ${
              activeView === viewKey
                ? 'bg-[#627E63] text-white shadow-md'
                : 'bg-white text-[#627E63] hover:bg-[#DFF6E3]'
            }`}
          >
            {formatViewLabel(viewKey)}
          </button>
        ))}
      </nav>

      {/* ===== MAIN CONTENT ===== */}
      <main className="flex-1 flex justify-center items-start p-6">
        <div className="w-full max-w-4xl">
          <ActiveFeature />
        </div>
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="bg-[#D58B63] text-white text-center py-3 text-sm shadow-inner">
        © 2025 Culina · Made with ❤️ and React
      </footer>

      <Toaster toasts={toasts} />
    </div>
  );
}

export default AppShell;
