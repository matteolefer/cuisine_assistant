import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../../context/AppContext';
import geminiService from '../../services/geminiService';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Icons from '../../components/ui/icons';

function PlanificationComponent() {
  const { t } = useTranslation();
  const { savedRecipes, plan, updatePlan, addToast, language } = useAppContext();
  const [isPlanningIA, setIsPlanningIA] = useState(false);

  const locale = useMemo(() => {
    switch (language) {
      case 'en':
        return 'en-US';
      case 'es':
        return 'es-ES';
      default:
        return 'fr-FR';
    }
  }, [language]);

  const weekDays = useMemo(() => {
    const days = [];
    const today = new Date();
    const options = { weekday: 'long', day: 'numeric', month: 'short' };
    for (let i = 0; i < 7; i += 1) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateString = date.toISOString().split('T')[0];
      days.push({ dateString, display: date.toLocaleDateString(locale, options) });
    }
    return days;
  }, [locale]);

  const mealTypes = ['petit-dejeuner', 'dejeuner', 'diner'];
  const mealLabels = {
    'petit-dejeuner': t('planning.meals.breakfast', 'Petit-déjeuner'),
    dejeuner: t('planning.meals.lunch', 'Déjeuner'),
    diner: t('planning.meals.dinner', 'Dîner'),
  };

  const handleSelectRecipe = (dateString, mealType, recipeId) => {
    const recipe = savedRecipes.find((item) => item.id === recipeId) || null;

    updatePlan((prevPlan) => {
      const newPlan = { ...prevPlan };
      if (!newPlan[dateString]) newPlan[dateString] = {};

      if (recipe) {
        newPlan[dateString][mealType] = { id: recipe.id, titre: recipe.titre };
      } else if (newPlan[dateString]) {
        delete newPlan[dateString][mealType];
      }
      return newPlan;
    });
  };

  const handleAutoPlan = async () => {
    if (savedRecipes.length === 0) {
      addToast(
        t(
          'planning.toast.generate_no_recipes',
          'Ajoutez au moins une recette favorite avant de générer un planning.',
        ),
        'warning',
      );
      return;
    }

    setIsPlanningIA(true);
    try {
      const { plan: generatedPlan, warnings } = await geminiService.generateWeeklyPlan(savedRecipes, { language });

      if (!generatedPlan || Object.keys(generatedPlan).length === 0) {
        const warningKey = warnings?.includes('no_recipes')
          ? 'planning.toast.generate_no_recipes'
          : 'planning.toast.generate_invalid';
        addToast(
          t(warningKey, "L'IA n'a pas renvoyé de planning exploitable."),
          'warning',
        );
        return;
      }

      updatePlan(generatedPlan);
      addToast(t('planning.toast.generated', 'Planning de la semaine généré !'));

      if (warnings && warnings.length > 0 && !warnings.includes('no_recipes')) {
        addToast(
          t('planning.toast.generate_partial', {
            count: warnings.length,
            defaultValue: 'Certaines suggestions ont été ajustées automatiquement.',
          }),
          'info',
        );
      }
    } catch (error) {
      console.error(error);
      addToast(t('planning.toast.generate_error', 'Erreur de la génération IA.'), 'error');
    } finally {
      setIsPlanningIA(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-[#EAEAEA] animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-4xl font-bold text-gray-800 tracking-tight">
          {t('planning.title', 'Plan de la Semaine')}
        </h2>
        <Button onClick={handleAutoPlan} variant="primary" className="w-auto px-4" disabled={isPlanningIA}>
          {isPlanningIA
            ? t('planning.actions.generating', 'Génération IA...')
            : (
              <>
                <Icons.Recettes className="w-5 h-5 inline mr-2" />
                {t('planning.actions.generate_button', 'Générer (IA)')}
              </>
            )}
        </Button>
      </div>

      <div className="space-y-6">
        {weekDays.map((day) => (
          <div key={day.dateString} className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 capitalize border-b border-gray-200 pb-3 mb-4">
              {day.display}
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              {mealTypes.map((meal) => (
                <div key={meal}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{mealLabels[meal]}</label>
                  <Select
                    value={plan[day.dateString]?.[meal]?.id || ''}
                    onChange={(event) => handleSelectRecipe(day.dateString, meal, event.target.value)}
                  >
                    <option value="">{t('planning.select.placeholder', '-- Choisir --')}</option>
                    {savedRecipes.map((recipe) => (
                      <option key={recipe.id} value={recipe.id}>
                        {recipe.titre}
                      </option>
                    ))}
                  </Select>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PlanificationComponent;
