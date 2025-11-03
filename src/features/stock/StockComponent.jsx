import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../../context/AppContext';
import firestoreService from '../../services/firestoreService';
import geminiService from '../../services/geminiService';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import EmptyState from '../../components/ui/EmptyState';
import Icons from '../../components/ui/icons';

function StockComponent() {
  const { t } = useTranslation();
  const { db, userId, appId, ingredients, addToast } = useAppContext();
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('pièce(s)');

  // 🧩 Ajout du mapping emoji/catégorie (identique à la liste de courses)
  const categoryIcons = {
    'Fruits': '🍎',
    'Légumes': '🥦',
    'Viandes': '🍖',
    'Poissons': '🐟',
    'Produits Laitiers': '🥛',
    'Boulangerie': '🥖',
    'Épicerie': '🛒',
    'Boissons': '🥤',
    'Surgelés': '🧊',
    'Autre': '📦',
  };

  // 🟩 Ajouter un ingrédient au stock
  const handleAdd = async (event) => {
    event.preventDefault();
    if (!newItemName.trim()) return;

    try {
      const path = `artifacts/${appId}/users/${userId}/ingredients_stock`;
      const category = await geminiService.categorizeIngredient(newItemName.trim());

      const newItem = {
        name: newItemName.trim(),
        quantity: parseFloat(newItemQty) || 0,
        unit: newItemUnit,
        category,
      };

      await firestoreService.addItem(db, path, newItem);

      setNewItemName('');
      setNewItemQty('');
      setNewItemUnit('pièce(s)');
      addToast(t('stock.toast.add_success', 'Ingrédient ajouté au garde-manger !'), 'success');
    } catch (error) {
      console.error('Erreur ajout (Stock):', error);
      addToast(t('stock.toast.add_error', "Erreur d'ajout de l'ingrédient"), 'error');
    }
  };

  // 🟥 Supprimer un ingrédient
  const handleDelete = async (id) => {
    try {
      const path = `artifacts/${appId}/users/${userId}/ingredients_stock/${id}`;
      await firestoreService.deleteItem(db, path);
      addToast(t('stock.toast.delete_success', 'Ingrédient supprimé.'), 'success');
    } catch (error) {
      console.error('Erreur suppression (Stock):', error);
      addToast(t('stock.toast.delete_error', 'Erreur de suppression'), 'error');
    }
  };

  // 🧠 Regroupement par catégorie (comme CoursesComponent)
  const groupedIngredients = useMemo(() => {
    const groups = ingredients.reduce((acc, item) => {
      const category = item.category || 'Autre';
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    }, {});

    // Trie les catégories par ordre alphabétique
    return Object.keys(groups)
      .sort()
      .reduce((acc, key) => {
        acc[key] = groups[key];
        return acc;
      }, {});
  }, [ingredients]);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-[#EAEAEA] animate-fade-in">
      <h2 className="text-4xl font-bold text-gray-800 mb-6 tracking-tight">
        {t('stock.title', 'Mon Garde-Manger')}
      </h2>

      {/* 🧾 Formulaire d’ajout */}
      <form
        onSubmit={handleAdd}
        className="w-full mb-6 bg-white p-4 rounded-xl shadow-lg border border-gray-100 space-y-3"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('stock.form.fields.ingredient', 'Ingrédient')}
          </label>
          <Input
            type="text"
            placeholder={t('stock.form.placeholders.ingredient', 'Ex: Farine, Tomates...')}
            value={newItemName}
            onChange={(event) => setNewItemName(event.target.value)}
            aria-label={t('stock.form.aria.ingredient', 'Nouvel ingrédient')}
            required
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('stock.form.fields.quantity', 'Quantité')}
            </label>
            <Input
              type="number"
              placeholder={t('stock.form.placeholders.quantity', 'Ex: 500')}
              value={newItemQty}
              onChange={(event) => setNewItemQty(event.target.value)}
              aria-label={t('stock.form.aria.quantity', 'Quantité')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('stock.form.fields.unit', 'Unité')}
            </label>
            <Select value={newItemUnit} onChange={(event) => setNewItemUnit(event.target.value)}>
              <option value="pièce(s)">{t('stock.form.units.pieces', 'pièce(s)')}</option>
              <option value="g">{t('stock.form.units.grams', 'g')}</option>
              <option value="kg">{t('stock.form.units.kilograms', 'kg')}</option>
              <option value="ml">{t('stock.form.units.milliliters', 'ml')}</option>
              <option value="L">{t('stock.form.units.liters', 'L')}</option>
              <option value="c. à café">{t('stock.form.units.teaspoon', 'c. à café')}</option>
              <option value="c. à soupe">{t('stock.form.units.tablespoon', 'c. à soupe')}</option>
            </Select>
          </div>
        </div>

        <Button
          type="submit"
          className="bg-green-600 text-white p-3 hover:bg-green-700 transition flex items-center justify-center w-full"
          aria-label={t('stock.form.aria.submit', "Ajouter l'ingrédient")}
        >
          <Icons.Plus className="w-5 h-5 mr-2" />
          {t('stock.form.submit', 'Ajouter au stock')}
        </Button>
      </form>

      {/* 🧂 Liste d’ingrédients */}
      {ingredients.length === 0 ? (
        <EmptyState
          icon={Icons.Stock}
          title={t('stock.empty.title', 'Votre garde-manger est vide')}
          message={t('stock.empty.message', 'Ajoutez vos ingrédients pour générer des recettes.')}
        />
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedIngredients).map(([category, items]) => (
            <div key={category} className="mb-6">
              {/* 🏷️ Titre de catégorie avec emoji */}
              <h3 className="text-2xl font-semibold text-green-700 flex items-center mb-3">
                <span className="text-2xl mr-2">{categoryIcons[category] || '📦'}</span>
                {category}
              </h3>

              {/* Liste des ingrédients */}
              <ul className="space-y-3">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="bg-white p-4 rounded-xl shadow border border-gray-100 flex justify-between items-center transition hover:shadow-lg"
                  >
                    <p className="text-lg font-medium text-gray-800 flex-grow">
                      {item.name}
                      {(item.quantity > 0 || (item.unit && item.unit !== 'pièce(s)')) && (
                        <span className="text-sm text-gray-500 font-normal ml-2">
                          ({item.quantity} {item.unit})
                        </span>
                      )}
                    </p>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 ml-4 text-red-500 hover:bg-red-100 rounded-full transition"
                      aria-label={t('stock.list.aria.delete', { name: item.name, defaultValue: `Supprimer ${item.name}` })}
                    >
                      <Icons.Trash className="w-5 h-5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default StockComponent;
