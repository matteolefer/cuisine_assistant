import React, { useMemo, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import firestoreService from '../../services/firestoreService';
import geminiService from '../../services/geminiService';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import EmptyState from '../../components/ui/EmptyState';
import { icons } from '../../components/ui/icons';

function StockComponent() {
  const { db, userId, appId, ingredients, addToast } = useAppContext();
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('pièce(s)');

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
      addToast('Ingrédient ajouté !');
    } catch (error) {
      console.error('Erreur ajout (Stock):', error);
      addToast("Erreur d'ajout", 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      const path = `artifacts/${appId}/users/${userId}/ingredients_stock/${id}`;
      await firestoreService.deleteItem(db, path);
      addToast('Ingrédient supprimé.', 'success');
    } catch (error) {
      console.error('Erreur suppression (Stock):', error);
      addToast('Erreur de suppression', 'error');
    }
  };

  const groupedIngredients = useMemo(() => {
    const groups = ingredients.reduce((acc, item) => {
      const category = item.category || 'Autre';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {});

    return Object.keys(groups)
      .sort()
      .reduce((acc, key) => {
        acc[key] = groups[key];
        return acc;
      }, {});
  }, [ingredients]);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-[#EAEAEA] animate-fade-in">
      <h2 className="text-4xl font-bold text-gray-800 mb-6 tracking-tight">Mon Garde-Manger</h2>

      <form onSubmit={handleAdd} className="w-full mb-6 bg-white p-4 rounded-xl shadow-lg border border-gray-100 space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ingrédient</label>
          <Input
            type="text"
            placeholder="Ex: Farine, Tomates..."
            value={newItemName}
            onChange={(event) => setNewItemName(event.target.value)}
            aria-label="Nouvel ingrédient"
            required
          />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantité</label>
            <Input
              type="number"
              placeholder="Ex: 500"
              value={newItemQty}
              onChange={(event) => setNewItemQty(event.target.value)}
              aria-label="Quantité"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unité</label>
            <Select value={newItemUnit} onChange={(event) => setNewItemUnit(event.target.value)}>
              <option value="pièce(s)">pièce(s)</option>
              <option value="g">g</option>
              <option value="kg">kg</option>
              <option value="ml">ml</option>
              <option value="L">L</option>
              <option value="c. à café">c. à café</option>
              <option value="c. à soupe">c. à soupe</option>
            </Select>
          </div>
        </div>
        <Button
          type="submit"
          className="bg-green-600 text-white p-3 hover:bg-green-700 transition flex items-center justify-center w-full"
          aria-label="Ajouter l'ingrédient"
        >
          <icons.Plus className="w-5 h-5 mr-2" /> Ajouter au stock
        </Button>
      </form>

      {ingredients.length === 0 ? (
        <EmptyState
          icon={icons.Stock}
          title="Votre garde-manger est vide"
          message="Ajoutez vos ingrédients pour générer des recettes."
        />
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedIngredients).map(([category, items]) => (
            <div key={category}>
              <h3 className="text-xl font-semibold text-gray-700 mb-3 border-b border-gray-200 pb-2 capitalize">
                {category}
              </h3>
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
                      aria-label={`Supprimer ${item.name}`}
                    >
                      <icons.Trash className="w-5 h-5" />
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
