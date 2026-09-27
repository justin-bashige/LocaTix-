import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, CheckCircle2, XCircle, RefreshCw, MapPin, Bed, Bath, Home } from 'lucide-react';
import { House, Profile } from '../../types/database';
import { getOwnerHouses, toggleHouseAvailability, deleteHouse } from '../../services/houseService';
import { EmptyState } from '../common/EmptyState';
import { ErrorAlert } from '../common/ErrorAlert';
import { HouseFormModal } from './HouseFormModal';

interface OwnerHousesProps {
  currentUser: Profile;
  onSelectHouse: (house: House) => void;
}

export const OwnerHouses: React.FC<OwnerHousesProps> = ({
  currentUser,
  onSelectHouse,
}) => {
  const [houses, setHouses] = useState<House[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [houseToEdit, setHouseToEdit] = useState<House | null>(null);
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);

  const loadHouses = async () => {
    setIsLoading(true);
    setError(null);
    const { houses: data, error: err } = await getOwnerHouses(currentUser.id);
    setIsLoading(false);

    if (err) {
      setError(err);
    } else {
      setHouses(data);
    }
  };

  useEffect(() => {
    loadHouses();
  }, []);

  const handleToggle = async (e: React.MouseEvent, house: House) => {
    e.stopPropagation();
    setActionInProgressId(house.id);
    const { success, error: err } = await toggleHouseAvailability(house.id, !house.is_available);
    setActionInProgressId(null);

    if (err) {
      alert(`Erreur: ${err}`);
    } else if (success) {
      loadHouses();
    }
  };

  const handleDelete = async (e: React.MouseEvent, houseId: string) => {
    e.stopPropagation();
    if (!confirm('Êtes-vous sûr de vouloir supprimer définitivement cette annonce ? Toutes les photos et demandes associées seront effacées.')) {
      return;
    }

    setActionInProgressId(houseId);
    const { success, error: err } = await deleteHouse(houseId);
    setActionInProgressId(null);

    if (err) {
      alert(`Erreur: ${err}`);
    } else if (success) {
      loadHouses();
    }
  };

  const handleEditClick = (e: React.MouseEvent, house: House) => {
    e.stopPropagation();
    setHouseToEdit(house);
  };

  return (
    <div className="space-y-4 pb-20">
      <div className="flex items-center justify-between px-1">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Mes Logements</h1>
          <p className="text-xs text-slate-500">
            Gérez vos annonces, photos et disponibilités
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadHouses}
            disabled={isLoading}
            className="p-1.5 border border-slate-300 hover:bg-slate-50 rounded-lg text-slate-600 transition-colors cursor-pointer"
            title="Actualiser"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Nouveau logement
          </button>
        </div>
      </div>

      {error && <ErrorAlert message={error} onRetry={loadHouses} />}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((n) => (
            <div key={n} className="bg-white rounded-xl border border-slate-200 p-4 h-32 animate-pulse" />
          ))}
        </div>
      ) : houses.length === 0 ? (
        <EmptyState
          icon={Home}
          title="Vous n'avez encore publié aucun logement."
          description="Publiez votre premier appartement ou maison pour qu'il apparaisse instantanément auprès de tous les locataires connectés."
          actionLabel="Publier une annonce"
          onAction={() => setIsAddModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {houses.map((house) => {
            const primaryImg = house.images && house.images.length > 0 ? house.images[0].image_url : null;
            const isWorking = actionInProgressId === house.id;

            return (
              <div
                key={house.id}
                onClick={() => onSelectHouse(house)}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  {/* Photo container */}
                  <div className="relative aspect-16/9 w-full bg-slate-100 overflow-hidden">
                    {primaryImg ? (
                      <img
                        src={primaryImg}
                        alt={house.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                        <Home className="w-6 h-6 stroke-[1.5]" />
                        <span className="text-[11px] mt-1">Aucune photo</span>
                      </div>
                    )}

                    <div className="absolute top-2 left-2">
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded shadow-xs ${
                          house.is_available
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-900/80 text-white backdrop-blur-xs'
                        }`}
                      >
                        {house.is_available ? 'Disponible' : 'Indisponible / Loué'}
                      </span>
                    </div>

                    <div className="absolute top-2 right-2 flex items-center gap-1.5">
                      <button
                        onClick={(e) => handleEditClick(e, house)}
                        className="p-1.5 rounded-full bg-white/90 hover:bg-white text-slate-700 shadow-sm transition-colors cursor-pointer"
                        title="Modifier l'annonce"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, house.id)}
                        disabled={isWorking}
                        className="p-1.5 rounded-full bg-white/90 hover:bg-white text-rose-600 shadow-sm transition-colors cursor-pointer"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-3.5">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                      <span className="flex items-center gap-1 truncate max-w-[70%]">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{house.location}</span>
                      </span>
                      <span className="font-semibold text-slate-900">
                        {house.price} $ / mois
                      </span>
                    </div>

                    <h3 className="font-semibold text-sm text-slate-900 line-clamp-1">
                      {house.title}
                    </h3>

                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
                      <span className="inline-flex items-center gap-1">
                        <Bed className="w-3 h-3 text-slate-400" />
                        {house.bedrooms} ch.
                      </span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1">
                        <Bath className="w-3 h-3 text-slate-400" />
                        {house.bathrooms} sdb
                      </span>
                      {house.surface && (
                        <>
                          <span>·</span>
                          <span>{house.surface} m²</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Toggle Availability */}
                <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                  <span className="text-xs text-slate-600">
                    Statut actuel : <strong>{house.is_available ? 'Disponible' : 'Occupé'}</strong>
                  </span>
                  <button
                    onClick={(e) => handleToggle(e, house)}
                    disabled={isWorking}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      house.is_available
                        ? 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    {isWorking
                      ? 'Patientez...'
                      : house.is_available
                      ? 'Marquer comme loué'
                      : 'Rendre disponible'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add & Edit Modals */}
      <HouseFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        ownerId={currentUser.id}
        onSaved={loadHouses}
      />

      <HouseFormModal
        isOpen={!!houseToEdit}
        onClose={() => setHouseToEdit(null)}
        ownerId={currentUser.id}
        houseToEdit={houseToEdit}
        onSaved={loadHouses}
      />
    </div>
  );
};
