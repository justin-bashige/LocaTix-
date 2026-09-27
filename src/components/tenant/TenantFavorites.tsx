import React, { useState, useEffect } from 'react';
import { Heart, RefreshCw } from 'lucide-react';
import { Favorite, House, Profile } from '../../types/database';
import { getFavorites } from '../../services/favoriteService';
import { HouseCard } from '../common/HouseCard';
import { EmptyState } from '../common/EmptyState';
import { ErrorAlert } from '../common/ErrorAlert';

interface TenantFavoritesProps {
  currentUser: Profile;
  favoriteIds: Set<string>;
  onToggleFavorite: (houseId: string) => void;
  onSelectHouse: (house: House) => void;
  onExplore: () => void;
}

export const TenantFavorites: React.FC<TenantFavoritesProps> = ({
  currentUser,
  favoriteIds,
  onToggleFavorite,
  onSelectHouse,
  onExplore,
}) => {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFavorites = async () => {
    setIsLoading(true);
    setError(null);
    const { favorites: data, error: err } = await getFavorites(currentUser.id);
    setIsLoading(false);

    if (err) {
      setError(err);
    } else {
      setFavorites(data);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, [favoriteIds.size]);

  // Extract valid houses from favorites
  const favoriteHouses = favorites
    .map((fav) => fav.house)
    .filter((h): h is House => h !== undefined && h !== null);

  return (
    <div className="space-y-4 pb-20">
      <div className="flex items-center justify-between px-1">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Mes Favoris</h1>
          <p className="text-xs text-slate-500">
            Logements que vous avez enregistrés
          </p>
        </div>
        <button
          onClick={loadFavorites}
          disabled={isLoading}
          className="flex items-center gap-1 text-xs text-slate-600 hover:text-blue-600 p-1.5 rounded transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Actualiser</span>
        </button>
      </div>

      {error && <ErrorAlert message={error} onRetry={loadFavorites} />}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2].map((n) => (
            <div key={n} className="bg-white rounded-xl border border-slate-200 h-64 animate-pulse p-4">
              <div className="bg-slate-200 h-36 rounded-lg mb-3" />
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-slate-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : favoriteHouses.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Vous n'avez encore ajouté aucun favori."
          description="Cliquez sur l'icône de cœur sur n'importe quel logement disponible pour le retrouver facilement ici."
          actionLabel="Découvrir des logements"
          onAction={onExplore}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {favoriteHouses.map((house) => (
            <HouseCard
              key={house.id}
              house={house}
              isFavorited={true}
              onToggleFavorite={onToggleFavorite}
              onSelect={onSelectHouse}
            />
          ))}
        </div>
      )}
    </div>
  );
};
