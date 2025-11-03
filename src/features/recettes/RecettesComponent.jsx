import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { useTranslation } from 'react-i18next';

const DIET_OPTIONS = ['normal', 'vegetarian', 'vegan', 'gluten_free'];
const DIFFICULTY_OPTIONS = ['easy', 'medium', 'hard'];
const INGREDIENT_MODES = ['use_all', 'use_selected', 'ignore'];
const TIME_OPTIONS = ['15', '30', '45', '60'];

const getServingsLabel = (t, count) =>
  count > 1
    ? t('recipe.display.labels.servings_plural', { count })
    : t('recipe.display.labels.servings', { count });

export function RecipeDisplay({ recipe: initialRecipe, onSave, isEditing: startEditing = false }) {
  const { db, userId, appId, addToast, setActiveView, language } = useAppContext();
  const { t } = useTranslation();
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
    addToast(t('toast.edit_saved'), 'success');
  };

  const handleSaveToFavorites = async () => {
    setIsSaving(true);
    try {
      await onSave({ ...recipe, note: rating, note_personnelle: personalNote }, false);
      addToast(t('toast.recipe_saved'));
    } catch (error) {
      addToast(t('toast.save_error'), 'error');
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
    if (!recipe.ingredients_manquants || recipe.ingredients_manquants.length === 0) {
      addToast(t('toast.no_missing_ingredients'), 'info');
      return;
    }

    try {
      if (!db || !userId || !appId) {
        throw new Error('Firestore non initialisé ou informations utilisateur manquantes.');
      }

      const path = `artifacts/${appId}/users/${userId}/shopping_list`;
      const existingItems = await firestoreService.getItems(db, path);
      const existingNames = existingItems.map((item) => item.name.toLowerCase());

      const newItems = recipe.ingredients_manquants.filter(
        (name) => !existingNames.includes(name.toLowerCase()),
      );

      if (newItems.length === 0) {
        addToast(t('toast.already_in_shopping_list'), 'info');
        return;
      }

      const fallbackNames = [];

      const categorized = await Promise.all(
        newItems.map(async (name) => {
          const category = await geminiService.categorizeIngredient(name, i18n.language);
          const category = await geminiService.categorizeIngredient(name, { language });
          if (!category) fallbackNames.push(name);
          return {
            name,
            category: category || 'Autre',
            purchased: false,
            fromRecipe: recipe.titre || t('recipe.generator.title'),
          };
        }),
      );

      if (fallbackNames.length > 0) {
        addToast(
          t('toast.categorize_fallback', {
            name: fallbackNames.join(', '),
            defaultValue: `Catégorie inconnue pour ${fallbackNames.join(', ')} : utilisation de "Autre".`,
          }),
          'warning',
        );
      }

      await Promise.all(
        categorized.map((item) => firestoreService.addItem(db, path, item)),
      );

      addToast(t('toast.missing_added', { count: categorized.length }), 'success');
      setActiveView(VIEWS.COURSES);
    } catch (error) {
      console.error('Erreur ajout ingrédients manquants :', error);
      addToast(t('toast.shopping_list_error'), 'error');
    }
  };

  const timeLabel = useMemo(
    () => (recipe.temps_preparation_minutes ? t('recipe.display.labels.time', { count: recipe.temps_preparation_minutes }) : null),
    [recipe.temps_preparation_minutes, t],
  );

  const difficultyLabel = useMemo(
    () => (recipe.difficulte ? t('recipe.display.labels.difficulty', { value: recipe.difficulte }) : null),
    [recipe.difficulte, t],
  );

  const servingsLabel = useMemo(
    () => (recipe.portions ? getServingsLabel(t, recipe.portions) : null),
    [recipe.portions, t],
  );

  if (isEditing) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-2xl border border-gray-100 mt-4 max-w-lg w-full mx-auto space-y-4">
        <h4 className="text-xl font-semibold text-red-600 mb-2">{t('recipe.display.edit_mode_title')}</h4>
        <div>
          <label className="block text-sm font-medium text-gray-700">{t('recipe.display.fields.title')}</label>
          <Input value={recipe.titre} onChange={(event) => handleEditChange('titre', event.target.value)} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('recipe.display.fields.time')}</label>
            <Input
              type="number"
              value={recipe.temps_preparation_minutes}
              onChange={(event) => handleEditChange('temps_preparation_minutes', parseInt(event.target.value, 10))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('recipe.display.fields.difficulty')}</label>
            <Select value={recipe.difficulte} onChange={(event) => handleEditChange('difficulte', event.target.value)}>
              {DIFFICULTY_OPTIONS.map((option) => (
                <option key={option} value={t(`recipe.generator.difficulty_options.${option}`)}>
                  {t(`recipe.generator.difficulty_options.${option}`)}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('recipe.display.fields.portions')}</label>
            <Input
              type="number"
              value={recipe.portions}
              onChange={(event) => handleEditChange('portions', parseInt(event.target.value, 10))}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">{t('recipe.display.fields.available_ingredients')}</label>
          <textarea
            value={(recipe.ingredients_utilises || []).join('\n')}
            onChange={(event) => handleListChange('ingredients_utilises', event.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg h-24"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">{t('recipe.display.fields.missing_ingredients')}</label>
          <textarea
            value={(recipe.ingredients_manquants || []).join('\n')}
            onChange={(event) => handleListChange('ingredients_manquants', event.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg h-24"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">{t('recipe.display.fields.instructions')}</label>
          <textarea
            value={(recipe.instructions || []).join('\n')}
            onChange={(event) => handleListChange('instructions', event.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg h-32"
          />
        </div>
        <Button onClick={handleFinishEditing} variant="primary">
          {t('recipe.display.buttons.confirm_edit')}
        </Button>
        <Button onClick={() => setIsEditing(false)} variant="secondary">
          {t('recipe.display.buttons.cancel_edit')}
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
          <icons.Clock className="w-4 h-4 mr-1.5" /> {timeLabel}
        </p>
        <p className="flex items-center">
          <icons.Menu className="w-4 h-4 mr-1.5" /> {difficultyLabel}
        </p>
        <p className="flex items-center">
          <icons.User className="w-4 h-4 mr-1.5" /> {servingsLabel}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div>
          <h4 className="text-xl font-semibold text-gray-700 mb-3 border-b pb-2">
            {t('recipe.display.sections.available_ingredients')}
          </h4>
          <ul className="space-y-2 text-gray-700">
            {recipe.ingredients_utilises?.map((item, index) => (
              <li key={index} className="flex items-center">
                <icons.Check className="w-4 h-4 mr-2 text-green-500" /> {item}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-xl font-semibold text-gray-700 mb-3 border-b pb-2">
            {t('recipe.display.sections.missing_ingredients')}
          </h4>
          {recipe.ingredients_manquants && recipe.ingredients_manquants.length > 0 ? (
            <ul className="space-y-2 text-gray-700">
              {recipe.ingredients_manquants.map((item, index) => (
                <li key={index} className="flex items-center">
                  <icons.Plus className="w-4 h-4 mr-2 text-red-500" /> {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 italic">{t('recipe.display.messages.nothing_missing')}</p>
          )}
        </div>
      </div>

      <h4 className="text-xl font-semibold text-gray-700 mb-3 border-b pb-2">
        {t('recipe.display.sections.instructions')}
      </h4>
      <ol className="space-y-3 list-decimal list-inside text-gray-700">
        {recipe.instructions?.map((step, index) => (
          <li key={index} className="pl-1">
            {step}
          </li>
        ))}
      </ol>

      <h4 className="text-xl font-semibold text-gray-700 mt-8 mb-3 border-b pb-2">
        {t('recipe.display.sections.review')}
      </h4>
      <div className="flex items-center space-x-4 mb-4">
        <span className="font-medium text-gray-700">{t('recipe.display.labels.note')}</span>
        <StarRating rating={rating} onRate={handleRate} />
      </div>
      <textarea
        value={personalNote}
        onChange={(event) => setPersonalNote(event.target.value)}
        onBlur={() => recipe.id && onSave({ ...recipe, note: rating, note_personnelle: personalNote }, true)}
        className="w-full p-3 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-green-500"
        placeholder={t('recipe.display.placeholders.personal_note')}
      />

      <div className="flex flex-col md:flex-row gap-3 mt-8">
        {recipe.ingredients_manquants?.length > 0 ? (
          <Button
            onClick={handleAddMissingToShoppingList}
            variant="danger"
            className="bg-corail-500 hover:bg-corail-600"
          >
            <icons.Courses className="w-5 h-5 inline mr-2" />
            {t('recipe.display.buttons.add_missing', {
              count: recipe.ingredients_manquants.length,
            })}
          </Button>
        ) : (
          <p className="text-sm text-gray-500 italic">{t('recipe.display.messages.all_available')}</p>
        )}

        <Button onClick={() => setIsEditing(true)} variant="secondary">
          <icons.Edit className="w-5 h-5 inline mr-2" />
          {t('recipe.display.buttons.edit')}
        </Button>
      </div>

      {!recipe.id && (
        <Button onClick={handleSaveToFavorites} disabled={isSaving} variant="primary" className="mt-3">
          {isSaving ? t('recipe.display.buttons.saving') : t('recipe.display.buttons.save')}
        </Button>
      )}
    </div>
  );
}

function RecettesComponent() {
  const { db, userId, appId, addToast, ingredients, equipments } = useAppContext();
  const { t, i18n } = useTranslation();
  const [diet, setDiet] = useState('normal');
  const [servings, setServings] = useState(2);
  const [time, setTime] = useState('30');
  const [difficulty, setDifficulty] = useState('easy');
  const [customQuery, setCustomQuery] = useState('');
  const [ingredientMode, setIngredientMode] = useState('use_all');
  const [selectedIngredients, setSelectedIngredients] = useState([]);

  const toggleIngredientSelection = (name) => {
    setSelectedIngredients((prev) =>
      prev.includes(name)
        ? prev.filter((n) => n !== name)
        : [...prev, name],
    );
  };

  const [isLoading, setIsLoading] = useState(false);
  const [generatedRecipe, setGeneratedRecipe] = useState(null);

  const resolvedIngredients = useMemo(() => {
    const source = ingredients || [];
    if (ingredientMode === 'ignore') return [];
    if (ingredientMode === 'use_selected') {
      return source.filter((item) => selectedIngredients.includes(item.name || item));
    }
    return source;
  }, [ingredientMode, ingredients, selectedIngredients]);

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
        if (!silent) addToast(t('toast.recipe_saved'));
      } catch (error) {
        if (!silent) addToast(t('toast.save_error'), 'error');
        console.error(error);
      }
    },
    [db, userId, appId, addToast, t],
  );

  const handleGenerate = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setGeneratedRecipe(null);

    const promptData = {
      ingredients: resolvedIngredients,
      equipments,
      servings,
      diet: t(`recipe.generator.diet_options.${diet}`),
      time,
      difficulty: t(`recipe.generator.difficulty_options.${difficulty}`),
      customQuery,
      ingredientMode,
      language: i18n.language,
    };

    try {
      const recipe = await geminiService.generateRecipe(promptData);
      setGeneratedRecipe(recipe);
    } catch (error) {
      console.error(error);
      addToast(t('toast.generation_error'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-[#EAEAEA] animate-fade-in">
      <h2 className="text-4xl font-bold text-gray-800 mb-6 tracking-tight">{t('recipe.generator.title')}</h2>

      <form onSubmit={handleGenerate} className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 mb-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('recipe.generator.diet_label')}</label>
            <Select value={diet} onChange={(event) => setDiet(event.target.value)}>
              {DIET_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {t(`recipe.generator.diet_options.${option}`)}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('recipe.generator.people_label')}</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('recipe.generator.max_time_label')}</label>
            <Select value={time} onChange={(event) => setTime(event.target.value)}>
              {TIME_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {t(`recipe.generator.time_options.${option}`)}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('recipe.generator.difficulty_label')}</label>
            <Select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>
              {DIFFICULTY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {t(`recipe.generator.difficulty_options.${option}`)}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('recipe.generator.ingredient_usage_label')}</label>
          <Select value={ingredientMode} onChange={(event) => setIngredientMode(event.target.value)}>
            {INGREDIENT_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {t(`recipe.generator.ingredient_modes.${mode}`)}
              </option>
            ))}
          </Select>

          {ingredientMode === 'use_selected' && ingredients?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {ingredients.map((ing, index) => {
                const name = ing.name || ing;
                const isSelected = selectedIngredients.includes(name);
                return (
                  <button
                    type="button"
                    key={index}
                    onClick={() => toggleIngredientSelection(name)}
                    className={`px-3 py-1 rounded-full text-sm ${
                      isSelected ? 'bg-green-600 text-white' : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('recipe.generator.custom_query_label')}</label>
          <textarea
            rows="2"
            value={customQuery}
            onChange={(event) => setCustomQuery(event.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-transparent"
            placeholder={t('recipe.generator.custom_query_placeholder')}
          />
        </div>

        <Button type="submit" disabled={isLoading} variant="primary">
          {isLoading ? t('recipe.generator.generating') : t('recipe.generator.generate_button')}
        </Button>
      </form>

      {isLoading && <GeneratingLoader />}
      {generatedRecipe && <RecipeDisplay recipe={generatedRecipe} onSave={handleSaveRecipe} />}
    </div>
  );
}

export default RecettesComponent;
