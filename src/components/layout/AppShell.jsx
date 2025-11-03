import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { VIEWS } from '../../constants';
import { featureComponents } from '../../features';
import GeneratingLoader from '../ui/GeneratingLoader';
import Toaster from '../ui/Toaster';
import { icons } from '../ui/icons';
import { useTranslation } from 'react-i18next';

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

  const { t, i18n } = useTranslation();

  // --- 🔴 Erreur Firebase ---
  if (initializationError) {
    return (
      <div className="flex h-screen bg-[#FFF5E8] text-[#4B4B4B] font-inter items-center justify-center p-6">
        <div className="w-full max-w-xl bg-white border border-red-200 text-red-700 rounded-2xl shadow-xl p-8 space-y-5">
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-semibold">
              {t('error.firebase_title', 'Firebase Configuration Required')}
            </h2>
            <p className="text-sm leading-relaxed">{initializationError}</p>
          </div>
          <ol className="text-left text-sm leading-relaxed space-y-2 text-red-600/90">
            <li className="flex items-start gap-3">
              <span className="mt-1 h-5 w-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-semibold">
                1
              </span>
              {t('error.firebase_step1', 'Enable Firestore and Authentication in Firebase console.')}
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 h-5 w-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-semibold">
                2
              </span>
              {t('error.firebase_step2', 'Add your web config under window.__firebase_config or VITE_FIREBASE_CONFIG.')}
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 h-5 w-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-semibold">
                3
              </span>
              {t('error.firebase_step3', 'Reload the page and check console if error persists.')}
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
        <img src="/assets/logo/logo_culina.png" alt="Culina" className="h-32 w-auto mb-8" />
        <h1 className="text-5xl font-serif text-sage font-bold tracking-wide mb-2">
          {t('app.title', 'Culina')}
        </h1>
        <p className="italic text-lg text-sage mb-10">
          {t('app.subtitle', 'Cook simply, feel inspired')}
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
          <span className="text-lg font-medium">
            {t('auth.login_google', 'Se connecter avec Google')}
          </span>
        </button>
        <p className="mt-6 text-sm text-gray-500">
          {t(
            'auth.notice',
            'Votre compte Google est utilisé uniquement pour l’accès et la synchronisation sécurisée de vos recettes.'
          )}
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
          <img src="/assets/logo/logo_culina.png" alt="Culina" className="h-20 sm:h-24 md:h-28 w-auto" />
          <div>
            <h1 className="text-5xl sm:text-6xl font-serif text-sage font-bold tracking-wide">
              {t('app.title', 'Culina')}
            </h1>
            <p className="italic text-lg text-sage mt-1">
              {t('app.subtitle', 'Cook simply, feel inspired')}
            </p>
          </div>
        </div>

        {/* --- Sélecteur de langue + Logout --- */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mt-6 sm:mt-0">
          {/* Sélecteur de langue */}
          <select
            value={i18n.language}
            onChange={(e) => {
              i18n.changeLanguage(e.target.value);
              localStorage.setItem('culina_lang', e.target.value);
            }}
            className="bg-white border border-gray-300 rounded-md px-2 py-1 text-sm text-gray-700 focus:outline-none"
          >
            <option value="fr">🇫🇷 FR</option>
            <option value="en">🇬🇧 EN</option>
            <option value="es">🇪🇸 ES</option>
          </select>

          {/* Bouton Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center bg-[#627E63] text-white font-medium px-5 py-2 rounded-full shadow-md hover:bg-[#506C52] transition-all"
          >
            <icons.Logout className="w-5 h-5 mr-2" />
            {t('auth.logout', 'Déconnexion')}
          </button>
        </div>
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
        © 2025 Culina · {t('app.made_with', 'Made with ❤️ and React')}
      </footer>

      <Toaster toasts={toasts} />
    </div>
  );
}

export default AppShell;
