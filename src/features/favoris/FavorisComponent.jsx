import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import firestoreService from '../../services/firestoreService';
import geminiService from '../../services/geminiService';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import { icons } from '../../components/ui/icons';
import { RecipeDisplay } from '../recettes/RecettesComponent';

function FavorisComponent() {
  const { db, userId, appId, addToast, savedRecipes } = useAppContext();
  const [isImporting, setIsImporting] = useState(false);
  const [importText, setImportText] = useState('');
  const [isFormatting, setIsFormatting] = useState(false);
  const [viewRecipe, setViewRecipe] = useState(null);

  const handleImport = async (event) => {
    event.preventDefault();
    if (!importText.trim()) return;
    setIsFormatting(true);

    try {
      const formattedRecipe = await geminiService.formatImportedRecipe(importText);
      const path = `artifacts/${appId}/users/${userId}/saved_recipes`;
      await firestoreService.addItem(db, path, formattedRecipe);

      addToast('Recette importée !');
      setIsImporting(false);
      setImportText('');
    } catch (error) {
      addToast("Erreur d'importation", 'error');
    } finally {
      setIsFormatting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const path = `artifacts/${appId}/users/${userId}/saved_recipes/${id}`;
      await firestoreService.deleteItem(db, path);
      addToast('Recette supprimée.', 'success');
    } catch (error) {
      addToast('Erreur de suppression', 'error');
    }
  };

  const handleSave = async (recipeData, silent = false) => {
    try {
      const path = `artifacts/${appId}/users/${userId}/saved_recipes/${recipeData.id}`;
      await firestoreService.updateItem(db, path, recipeData);
      if (!silent) addToast('Recette mise à jour !');
      setViewRecipe(recipeData);
    } catch (error) {
      if (!silent) addToast('Erreur de sauvegarde', 'error');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-[#EAEAEA] animate-fade-in">
      <h2 className="text-4xl font-bold text-gray-800 mb-6 tracking-tight">Mes Favoris</h2>

      <div className="mb-6">
        <Button onClick={() => setIsImporting(!isImporting)} variant="secondary" className="w-full">
          <icons.Import className="w-5 h-5 inline mr-2" />
          {isImporting ? "Annuler l'importation" : 'Importer une recette'}
        </Button>

        {isImporting && (
          <form onSubmit={handleImport} className="mt-4 bg-white p-4 rounded-xl shadow-inner border border-gray-200 space-y-3">
            <textarea
              value={importText}
              onChange={(event) => setImportText(event.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-green-500"
              rows="6"
              placeholder="Collez ici le texte brut de votre recette..."
            />
            <Button type="submit" disabled={isFormatting} variant="primary">
              {isFormatting ? 'Formatage IA...' : 'Formater et Sauvegarder'}
            </Button>
          </form>
        )}
      </div>

      {savedRecipes.length === 0 ? (
        <EmptyState
          icon={icons.Favoris}
          title="Aucun favori"
          message="Sauvegardez vos recettes générées pour les retrouver ici."
        />
      ) : (
        <ul className="space-y-3">
          {savedRecipes.map((recipe) => (
            <li
              key={recipe.id}
              className="bg-white p-4 rounded-xl shadow border border-gray-100 flex justify-between items-center transition hover:shadow-lg"
            >
              <div
                className="flex-grow cursor-pointer"
                onClick={() => {
                  setViewRecipe(recipe);
                }}
              >
                <p className="text-lg font-medium text-gray-800">{recipe.titre}</p>
                <div className="flex items-center text-sm text-gray-500 mt-1">
                  {[...Array(5)].map((_, index) => (
                    <icons.Star
                      key={index}
                      className={`w-4 h-4 ${index < (recipe.note || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                    />
                  ))}
                  <span className="ml-2">({recipe.difficulte || 'N/A'})</span>
                </div>
              </div>
              <Button
                onClick={() => handleDelete(recipe.id)}
                variant="danger"
                className="p-2 ml-4 w-auto h-auto !bg-transparent !text-red-500 hover:!bg-red-100 rounded-full"
                aria-label={`Supprimer ${recipe.titre}`}
              >
                <icons.Trash className="w-5 h-5" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {viewRecipe && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-40 overflow-auto">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-auto no-scrollbar">
            <button
              onClick={() => setViewRecipe(null)}
              className="absolute -top-2 -right-2 text-gray-700 bg-white rounded-full p-2 z-10 shadow"
              aria-label="Fermer la vue"
            >
              <icons.Close className="w-6 h-6" />
            </button>
            <RecipeDisplay recipe={viewRecipe} onSave={handleSave} />
          </div>
        </div>
      )}
    </div>
  );
}

export default FavorisComponent;
