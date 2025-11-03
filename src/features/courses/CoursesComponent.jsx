import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../../context/AppContext';
import firestoreService from '../../services/firestoreService';
import EmptyState from '../../components/ui/EmptyState';
import { icons } from '../../components/ui/icons';
import {
  CATEGORY_EMOJIS,
  DEFAULT_CATEGORY_KEY,
  canonicalizeCategory,
} from '../../constants/categories';

function CoursesComponent() {
  const { t } = useTranslation();
  const { db, userId, appId, shoppingList, addToast } = useAppContext();
  const [newItemName, setNewItemName] = useState('');

  const fallbackCategoryLabel = t('categories.other', 'Autre');

  const handleAdd = async (event) => {
    event.preventDefault();
    if (!newItemName.trim()) return;
    try {
      const path = `artifacts/${appId}/users/${userId}/shopping_list`;
      await firestoreService.addItem(db, path, {
        name: newItemName.trim(),
        purchased: false,
        category: DEFAULT_CATEGORY_KEY,
      });
      setNewItemName('');
      addToast(t('shopping.toast.add_success', 'Article ajouté !'));
    } catch (error) {
      addToast(t('shopping.toast.add_error', "Erreur d'ajout"), 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      const path = `artifacts/${appId}/users/${userId}/shopping_list/${id}`;
      await firestoreService.deleteItem(db, path);
      addToast(t('shopping.toast.delete_success', 'Article supprimé.'), 'success');
    } catch (error) {
      addToast(t('shopping.toast.delete_error', 'Erreur de suppression'), 'error');
    }
  };

  const handleToggle = async (id, currentState) => {
    try {
      const path = `artifacts/${appId}/users/${userId}/shopping_list/${id}`;
      await firestoreService.updateItem(db, path, { purchased: !currentState });
    } catch (error) {
      addToast(t('shopping.toast.toggle_error', 'Erreur de mise à jour'), 'error');
    }
  };

  const sortedList = useMemo(() => {
    return [...shoppingList].sort((a, b) => {
      if (a.purchased === b.purchased) return 0;
      return a.purchased ? 1 : -1;
    });
  }, [shoppingList]);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-[#EAEAEA] animate-fade-in">
      <h2 className="text-4xl font-bold text-gray-800 mb-6 tracking-tight">
        {t('shopping.title', 'Liste de Courses')}
      </h2>

      <form onSubmit={handleAdd} className="w-full mb-6">
        <div className="flex shadow-md rounded-xl overflow-hidden bg-white border border-gray-200">
          <input
            type="text"
            className="flex-grow p-4 text-gray-700 focus:ring-green-500 focus:border-green-500 border-none transition"
            placeholder={t('shopping.form.placeholder', 'Ex: Lait, Pain, Tomates...')}
            value={newItemName}
            onChange={(event) => setNewItemName(event.target.value)}
            aria-label={t('shopping.form.aria.input', 'Nouvel article')}
          />
          <button
            type="submit"
            className="bg-green-600 text-white p-4 hover:bg-green-700 transition flex items-center justify-center"
            aria-label={t('shopping.form.aria.submit', 'Ajouter à la liste')}
          >
            <icons.Plus className="w-6 h-6" />
          </button>
        </div>
      </form>

      {sortedList.length === 0 ? (
        <EmptyState
          icon={icons.Courses}
          title={t('shopping.empty.title', 'Liste de courses vide')}
          message={t('shopping.empty.message', "Les ingrédients manquants des recettes s'ajouteront ici.")}
        />
      ) : (
        Object.entries(
          sortedList.reduce((acc, item) => {
            const category = canonicalizeCategory(item.category);
            if (!acc[category]) acc[category] = [];
            acc[category].push(item);
            return acc;
          }, {})
        )
          .sort((a, b) => {
            const labelA = t(`categories.${a[0]}`, fallbackCategoryLabel);
            const labelB = t(`categories.${b[0]}`, fallbackCategoryLabel);
            return labelA.localeCompare(labelB);
          })
          .map(([category, items]) => {
            const emoji = CATEGORY_EMOJIS[category] || CATEGORY_EMOJIS[DEFAULT_CATEGORY_KEY];
            const label = t(`categories.${category}`, fallbackCategoryLabel);

            return (
              <div key={category} className="mb-6">
                <h3 className="text-2xl font-semibold text-green-700 flex items-center mb-3">
                  <span className="text-2xl mr-2">{emoji}</span>
                  {label}
                </h3>

                <ul className="space-y-3">
                  {items.map((item) => (
                    <li
                      key={item.id}
                      className="bg-white p-4 rounded-xl shadow border border-gray-100 flex items-center justify-between transition hover:shadow-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={item.purchased}
                          onChange={() => handleToggle(item.id, item.purchased)}
                          className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                        />
                        <span
                          className={`text-lg font-medium ${
                            item.purchased ? 'line-through text-gray-400' : 'text-gray-800'
                          }`}
                        >
                          {item.name}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-red-500 hover:bg-red-100 rounded-full transition"
                        aria-label={t('shopping.list.aria.delete', {
                          name: item.name,
                          defaultValue: `Supprimer ${item.name}`,
                        })}
                      >
                        <icons.Trash className="w-5 h-5" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })
      )}
    </div>
  );
}

export default CoursesComponent;
