import React from 'react';
import Icons from './icons';

function GeneratingLoader() {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white rounded-xl shadow-lg border border-gray-100">
      <Icons.ChefHat className="w-16 h-16 text-green-500 animate-bounce" />
      <p className="mt-4 text-lg font-semibold text-gray-700">Génération de la recette...</p>
      <p className="text-sm text-gray-500">L'IA préchauffe les fours !</p>
    </div>
  );
}

export default GeneratingLoader;
