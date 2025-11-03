import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../../context/AppContext';
import firestoreService from '../../services/firestoreService';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import Icons from '../../components/ui/icons';
import Input from '../../components/ui/Input';
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
      console.error('Erreur ajout courses:', error);
      addToast(t('shopping.toast.add_error', "Erreur d'ajout"), 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      const path = `artifacts/${appId}/users/${userId}/shopping_list/${id}`;
      await firestoreService.deleteItem(db, path);
      addToast(t('shopping.toast.delete_success', 'Article supprimé.'), 'success');
    } catch (error) {
      console.error('Erreur suppression courses:', error);
      addToast(t('shopping.toast.delete_error', 'Erreur de suppression'), 'error');
    }
  };

  const handleToggle = async (id, currentState) => {
    try {
      const path = `artifacts/${appId}/users/${userId}/shopping_list/${id}`;
      await firestoreService.updateItem(db, path, { purchased: !currentState });
    } catch (error) {
      console.error('Erreur bascule achat courses:', error);
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
          <Input
            type="text"
            className="flex-grow border-none p-4 text-gray-700"
            placeholder={t('shopping.form.placeholder', 'Ex: Lait, Pain, Tomates...')}
            value={newItemName}
            onChange={(event) => setNewItemName(event.target.value)}
            aria-label={t('shopping.form.aria.input', 'Nouvel article')}
          />
          <Button
            type="submit"
            variant="primary"
            className="w-auto rounded-none rounded-r-xl p-4 flex items-center justify-center"
            aria-label={t('shopping.form.aria.submit', 'Ajouter à la liste')}
          >
            <Icons.Plus className="w-6 h-6" />
          </button>

            <icons.Plus className="w-6 h-6" />
          </Button>
        </div>
      </form>

      {sortedList.length === 0 ? (
        <EmptyState
          icon={Icons.Courses}
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
                      aria-label={t('shopping.list.aria.toggle', {
                        name: item.name,
                        defaultValue: `Marquer ${item.name} comme acheté`,
                      })}
                    />
                    <span className={`text-lg font-medium ${item.purchased ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                      {item.name}
                    </span>
                  </div>
                  <Button
                    onClick={() => handleDelete(item.id)}
                    variant="ghost-danger"
                    type="button"
                    className="p-2 text-red-500 hover:text-red-600 rounded-full w-auto h-auto focus-visible:ring-red-500"
                    aria-label={t('shopping.list.aria.delete', {
                      name: item.name,
                      defaultValue: `Supprimer ${item.name}`,
                    })}
                  >
                    <Icons.Trash className="w-5 h-5" />
                  </button>

                    <icons.Trash className="w-5 h-5" />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
}

export default CoursesComponent;
