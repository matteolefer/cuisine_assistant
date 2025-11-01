import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import firestoreService from '../../services/firestoreService';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import Input from '../../components/ui/Input';
import { icons } from '../../components/ui/icons';

function EquipementComponent() {
  const { db, userId, appId, equipments, addToast } = useAppContext();
  const [newItemName, setNewItemName] = useState('');

  const handleAdd = async (event) => {
    event.preventDefault();
    if (!newItemName.trim()) return;
    try {
      const path = `artifacts/${appId}/users/${userId}/equipments_stock`;
      await firestoreService.addItem(db, path, { name: newItemName });
      setNewItemName('');
      addToast('Équipement ajouté !');
    } catch (error) {
      addToast("Erreur d'ajout", 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      const path = `artifacts/${appId}/users/${userId}/equipments_stock/${id}`;
      await firestoreService.deleteItem(db, path);
      addToast('Équipement supprimé.', 'success');
    } catch (error) {
      addToast('Erreur de suppression', 'error');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-[#EAEAEA] animate-fade-in">
      <h2 className="text-4xl font-bold text-gray-800 mb-6 tracking-tight">Mes Équipements</h2>

      <form onSubmit={handleAdd} className="w-full mb-6">
        <div className="flex shadow-md rounded-xl overflow-hidden bg-white border border-gray-200">
          <Input
            type="text"
            className="flex-grow p-4 text-gray-700 focus:ring-green-500 focus:border-green-500 border-none"
            placeholder="Ex: Four, Thermomix, Wok..."
            value={newItemName}
            onChange={(event) => setNewItemName(event.target.value)}
            aria-label="Nouvel équipement"
          />
          <Button
            type="submit"
            className="bg-green-600 text-white p-4 hover:bg-green-700 transition flex items-center justify-center w-auto"
            aria-label="Ajouter l'équipement"
          >
            <icons.Plus className="w-6 h-6" />
          </Button>
        </div>
      </form>

      {equipments.length === 0 ? (
        <EmptyState
          icon={icons.Equipement}
          title="Aucun équipement"
          message="Ajoutez vos outils pour des recettes adaptées."
        />
      ) : (
        <ul className="space-y-3">
          {equipments.map((item) => (
            <li
              key={item.id}
              className="bg-white p-4 rounded-xl shadow border border-gray-100 flex justify-between items-center transition hover:shadow-lg"
            >
              <p className="text-lg font-medium text-gray-800 flex-grow">{item.name}</p>
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
      )}
    </div>
  );
}

export default EquipementComponent;
