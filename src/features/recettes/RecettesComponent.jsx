import React, { useCallback, useEffect, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { VIEWS } from '../../constants';
import firestoreService from '../../services/firestoreService';
import geminiService from '../../services/geminiService';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import StarRating from '../../components/ui/StarRating';
import GeneratingLoader from '../../components/ui/GeneratingLoader';
import { icons } from '../../components/ui/icons';

export function RecipeDisplay({ recipe: initialRecipe, onSave, isEditing: startEditing = false }) {
  const { addToast, setActiveView } = useAppContext();
  const [recipe, setRecipe] = useState(initialRecipe);
  const [isEditing, setIsEditing] = useState(startEditing);
  const [rating, setRating] = useState(initialRecipe.note || 0);
  const [personalNote, setPersonalNote] = useState(initialRecipe.note_personnelle || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setRecipe(initialRecipe);
    setRating(initialRecipe.note || 0);
    setPersonalNote(initialRecipe.note_personnelle || '');
  }, [initialRecipe]);

  const handleEditChange = (field, value) => {
    setRecipe((prev) => ({ ...prev, [field]: value }));
  };

  const handleListChange = (field, value) => {
    setRecipe((prev) => ({ ...prev, [field]: value.split('\n') }));
  };

  const handleFinishEditing = async () => {
    await onSave(recipe, true);
    setIsEditing(false);
    addToast('Modifications enregistrées.', 'success');
  };

  const handleSaveToFavorites = async () => {
    setIsSaving(true);
    try {
      await onSave({ ...recipe, note: rating, note_personnelle: personalNote }, false);
      addToast('Recette sauvegardée !');
    } catch (error) {
      addToast('Erreur de sauvegarde', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRate = (newRating) => {
    setRating(newRating);
    if (recipe.id) {
      onSave({ ...recipe, note: newRating }, true);
    }
  };

  const handleAddMissingToShoppingList = async () => {
    addToast('Ingrédients ajoutés aux courses !', 'success');
    setActiveView(VIEWS.COURSES);
  };

  if (isEditing) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-2xl border border-gray-100 mt-4 max-w-lg w-full mx-auto space-y-4">
        <h4 className="text-xl font-semibold text-red-600 mb-2">Mode Édition</h4>
        <div>
          <label className="block text-sm font-medium text-gray-700">Titre</label>
          <Input value={recipe.titre} onChange={(event) => handleEditChange('titre', event.target.value)} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Temps (min)</label>
            <Input
              type="number"
              value={recipe.temps_preparation_minutes}
              onChange={(event) => handleEditChange('temps_preparation_minutes', parseInt(event.target.value, 10))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Difficulté</label>
            <Select value={recipe.difficulte} onChange={(event) => handleEditChange('difficulte', event.target.value)}>
              <option>Facile</option>
              <option>Moyenne</option>
              <option>Difficile</option>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Portions</label>
            <Input
              type="number"
              value={recipe.portions}
              onChange={(event) => handleEditChange('portions', parseInt(event.target.value, 10))}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Ingrédients Disponibles (un par ligne)</label>
          <textarea
            value={(recipe.ingredients_utilises || []).join('\n')}
            onChange={(event) => handleListChange('ingredients_utilises', event.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg h-24"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Ingrédients Manquants (un par ligne)</label>
          <textarea
            value={(recipe.ingredients_manquants || []).join('\n')}
            onChange={(event) => handleListChange('ingredients_manquants', event.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg h-24"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Instructions (une par ligne)</label>
          <textarea
            value={(recipe.instructions || []).join('\n')}
            onChange={(event) => handleListChange('instructions', event.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg h-32"
          />
        </div>
        <Button onClick={handleFinishEditing} variant="primary">
          Valider les modifications
        </Button>
        <Button onClick={() => setIsEditing(false)} variant="secondary">
          Annuler
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-2xl border border-gray-100 mt-4 max-w-lg w-full mx-auto">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-3xl font-bold text-gray-800">{recipe.titre}</h3>
        <div className="text-sm font-semibold text-green-700 p-2 bg-green-100 rounded-lg">{recipe.type_plat}</div>
      </div>
      <p className="text-gray-600 mb-4 italic">{recipe.description}</p>

      <div className="flex justify-between items-center text-sm text-gray-600 mb-6 border-y border-gray-200 py-3">
        <p className="flex items-center">
          <icons.Clock className="w-4 h-4 mr-1.5" /> {recipe.temps_preparation_minutes} min
        </p>
        <p className="flex items-center">
          <icons.Menu className="w-4 h-4 mr-1.5" /> {recipe.difficulte}
        </p>
        <p className="flex items-center">
          <icons.User className="w-4 h-4 mr-1.5" /> {recipe.portions} personnes
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div>
          <h4 className="text-xl font-semibold text-gray-700 mb-3 border-b pb-2">Ingrédients Disponibles</h4>
          <ul className="space-y-2 text-gray-700">
            {recipe.ingredients_utilises?.map((item, index) => (
              <li key={index} className="flex items-center">
                <icons.Check className="w-4 h-4 mr-2 text-green-500" /> {item}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-xl font-semibold text-gray-700 mb-3 border-b pb-2">Ingrédients Manquants</h4>
          {recipe.ingredients_manquants && recipe.ingredients_manquants.length > 0 ? (
            <ul className="space-y-2 text-gray-700">
              {recipe.ingredients_manquants.map((item, index) => (
                <li key={index} className="flex items-center">
                  <icons.Plus className="w-4 h-4 mr-2 text-red-500" /> {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 italic">Tout est dans le garde-manger !</p>
          )}
        </div>
      </div>

      <h4 className="text-xl font-semibold text-gray-700 mb-3 border-b pb-2">Instructions</h4>
      <ol className="space-y-3 list-decimal list-inside text-gray-700">
        {recipe.instructions?.map((step, index) => (
          <li key={index} className="pl-1">
            {step}
          </li>
        ))}
      </ol>

      <h4 className="text-xl font-semibold text-gray-700 mt-8 mb-3 border-b pb-2">Votre Avis</h4>
      <div className="flex items-center space-x-4 mb-4">
        <span className="font-medium text-gray-700">Note :</span>
        <StarRating rating={rating} onRate={handleRate} />
      </div>
      <textarea
        value={personalNote}
        onChange={(event) => setPersonalNote(event.target.value)}
        onBlur={() => recipe.id && onSave({ ...recipe, note: rating, note_personnelle: personalNote }, true)}
        className="w-full p-3 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-green-500"
        placeholder="Ajouter une note personnelle..."
      />

      <div className="flex flex-col md:flex-row gap-3 mt-8">
        {recipe.ingredients_manquants && recipe.ingredients_manquants.length > 0 && (
          <Button onClick={handleAddMissingToShoppingList} variant="danger" className="bg-corail-500 hover:bg-corail-600">
            <icons.Courses className="w-5 h-5 inline mr-2" /> Ajouter à la Liste de Courses
          </Button>
        )}
        <Button onClick={() => setIsEditing(true)} variant="secondary">
          <icons.Edit className="w-5 h-5 inline mr-2" /> Modifier la Recette
        </Button>
      </div>

      {!recipe.id && (
        <Button onClick={handleSaveToFavorites} disabled={isSaving} variant="primary" className="mt-3">
          {isSaving ? 'Sauvegarde...' : 'Sauvegarder dans mes favoris'}
        </Button>
      )}
    </div>
  );
}

function RecettesComponent() {
  const { db, userId, appId, addToast, ingredients, equipments } = useAppContext();
  const [diet, setDiet] = useState('Normal');
  const [servings, setServings] = useState(2);
  const [time, setTime] = useState('30');
  const [difficulty, setDifficulty] = useState('Facile');
  const [customQuery, setCustomQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedRecipe, setGeneratedRecipe] = useState(null);

  const handleSaveRecipe = useCallback(
    async (recipeData, silent = false) => {
      const path = `artifacts/${appId}/users/${userId}/saved_recipes`;
      try {
        if (recipeData.id) {
          const docPath = `${path}/${recipeData.id}`;
          await firestoreService.updateItem(db, docPath, recipeData);
        } else {
          const newDoc = await firestoreService.addItem(db, path, recipeData);
          setGeneratedRecipe((prev) => ({ ...prev, id: newDoc.id }));
        }
        if (!silent) addToast('Recette sauvegardée !');
      } catch (error) {
        if (!silent) addToast('Erreur de sauvegarde', 'error');
        console.error(error);
      }
    },
    [db, userId, appId, addToast],
  );

  const handleGenerate = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setGeneratedRecipe(null);

    const promptData = {
      ingredients,
      equipments,
      servings,
      diet,
      time,
      difficulty,
      customQuery,
    };

    try {
      const recipe = await geminiService.generateRecipe(promptData);
      setGeneratedRecipe(recipe);
    } catch (error) {
      console.error(error);
      addToast('Échec de la génération de recette', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-[#EAEAEA] animate-fade-in">
      <h2 className="text-4xl font-bold text-gray-800 mb-6 tracking-tight">Générer une Recette</h2>

      <form onSubmit={handleGenerate} className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 mb-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Régime</label>
            <Select value={diet} onChange={(event) => setDiet(event.target.value)}>
              <option value="Normal">Normal</option>
              <option value="Végétarien">Végétarien</option>
              <option value="Vegan">Vegan</option>
              <option value="Sans Gluten">Sans Gluten</option>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Personnes</label>
            <Input
              type="number"
              value={servings}
              min="1"
              onChange={(event) => setServings(parseInt(event.target.value, 10) || 1)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Temps Max (min)</label>
            <Select value={time} onChange={(event) => setTime(event.target.value)}>
              <option value="15">15 min</option>
              <option value="30">30 min</option>
              <option value="45">45 min</option>
              <option value="60">60+ min</option>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Difficulté</label>
            <Select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>
              <option value="Facile">Facile</option>
              <option value="Moyenne">Moyenne</option>
              <option value="Difficile">Difficile</option>
            </Select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Envie particulière ?</label>
          <textarea
            rows="2"
            value={customQuery}
            onChange={(event) => setCustomQuery(event.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-transparent"
            placeholder="Ex: 'Plat réconfortant', 'utiliser les courgettes'..."
          />
        </div>

        <Button type="submit" disabled={isLoading} variant="primary">
          {isLoading ? 'Génération...' : 'Trouver une recette'}
        </Button>
      </form>

      {isLoading && <GeneratingLoader />}
      {generatedRecipe && <RecipeDisplay recipe={generatedRecipe} onSave={handleSaveRecipe} />}
    </div>
  );
}

export default RecettesComponent;
