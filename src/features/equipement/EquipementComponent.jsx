import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../../context/AppContext';
import firestoreService from '../../services/firestoreService';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import Input from '../../components/ui/Input';
import Icons from '../../components/ui/icons';

function EquipementComponent() {
  const { t } = useTranslation();
  const { db, userId, appId, equipments, addToast } = useAppContext();
  const [newItemName, setNewItemName] = useState('');

  const handleAdd = async (event) => {
    event.preventDefault();
    if (!newItemName.trim()) return;
    try {
      const path = `artifacts/${appId}/users/${userId}/equipments_stock`;
      await firestoreService.addItem(db, path, { name: newItemName });
      setNewItemName('');
      addToast(t('equipment.toast.add_success', 'Équipement ajouté !'));
    } catch (error) {
      console.error('Erreur ajout équipement:', error);
      addToast(t('equipment.toast.add_error', "Erreur d'ajout"), 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      const path = `artifacts/${appId}/users/${userId}/equipments_stock/${id}`;
      await firestoreService.deleteItem(db, path);
      addToast(t('equipment.toast.delete_success', 'Équipement supprimé.'), 'success');
    } catch (error) {
      console.error('Erreur suppression équipement:', error);
      addToast(t('equipment.toast.delete_error', 'Erreur de suppression'), 'error');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-[#EAEAEA] animate-fade-in">
      <h2 className="text-4xl font-bold text-gray-800 mb-6 tracking-tight">
        {t('equipment.title', 'Mes Équipements')}
      </h2>

      <form onSubmit={handleAdd} className="w-full mb-6">
        <div className="flex shadow-md rounded-xl overflow-hidden bg-white border border-gray-200">
          <Input
            type="text"
            className="flex-grow p-4 text-gray-700 focus:ring-green-500 focus:border-green-500 border-none"
            placeholder={t('equipment.form.placeholder', 'Ex: Four, Thermomix, Wok...')}
            value={newItemName}
            onChange={(event) => setNewItemName(event.target.value)}
            aria-label={t('equipment.form.aria.input', 'Nouvel équipement')}
          />
          <Button
            type="submit"
            className="bg-green-600 text-white p-4 hover:bg-green-700 transition flex items-center justify-center w-auto"
            aria-label={t('equipment.form.aria.submit', "Ajouter l'équipement")}
          >
            <Icons.Plus className="w-6 h-6" />
          </Button>
        </div>
      </form>

      {equipments.length === 0 ? (
        <EmptyState
          icon={Icons.Equipement}
          title={t('equipment.empty.title', 'Aucun équipement')}
          message={t('equipment.empty.message', 'Ajoutez vos outils pour des recettes adaptées.')}
        />
      ) : (
        <ul className="space-y-3">
          {equipments.map((item) => (
            <li
              key={item.id}
              className="bg-white p-4 rounded-xl shadow border border-gray-100 flex justify-between items-center transition hover:shadow-lg"
            >
              <p className="text-lg font-medium text-gray-800 flex-grow">{item.name}</p>
              <Button
                onClick={() => handleDelete(item.id)}
                variant="ghost-danger"
                type="button"
                className="p-2 ml-4 text-red-500 hover:text-red-600 rounded-full w-auto h-auto focus-visible:ring-red-500"
                aria-label={t('equipment.list.aria.delete', {
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
      )}
    </div>
  );
}

export default EquipementComponent;
