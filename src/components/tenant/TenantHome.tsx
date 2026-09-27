import React, { useState, useEffect } from 'react';
import { RefreshCw, Search, Sparkles } from 'lucide-react';
import { House, Profile } from '../../types/database';
import { getHouses } from '../../services/houseService';
import { HouseCard } from '../common/HouseCard';
import { EmptyState } from '../common/EmptyState';
import { ErrorAlert } from '../common/ErrorAlert';
import { designImages } from '../../assets/designImages';

interface TenantHomeProps {
  currentUser: Profile;
  favoriteIds: Set<string>;
  onToggleFavorite: (houseId: string) => void;
  onSelectHouse: (house: House) => void;
  onGoToSearch: (initialKeyword?: string) => void;
}

export const TenantHome: React.FC<TenantHomeProps> = ({
  favoriteIds,
  onToggleFavorite,
  onSelectHouse,
  onGoToSearch,
}) => {
  const [houses, setHouses] = useState<House[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quickKeyword, setQuickKeyword] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    const { houses: data, error: err } = await getHouses({ onlyAvailable: true }, true);
    setIsLoading(false);
    if (err) {
      setError(err);
    } else {
      setHouses(data);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleQuickSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickKeyword.trim()) {
      onGoToSearch(quickKeyword.trim());
    } else {
      onGoToSearch();
    }
  };

  // Derive real sections strictly from actual returned data
  const multiRoomHouses = houses.filter((h) => h.bedrooms >= 3);
  const apartments = houses.filter((h) => h.property_type === 'appartement');
  const individualHouses = houses.filter((h) => h.property_type === 'maison' || h.property_type === 'villa');

  return (
    <div className="space-y-6 pb-20">
      {/* Search Header Banner with beautiful architectural home background */}
      <div className="relative overflow-hidden rounded-2xl p-6 sm:p-7 shadow-sm text-white">
        <img
          src={designImages.housesStreet}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/92 via-slate-950/80 to-slate-900/65 backdrop-blur-[1px]" />

        <div className="relative z-10 max-w-xl">
          <div className="flex items-center gap-1.5 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Découverte LocaTix</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold leading-tight tracking-tight">
            Trouvez votre futur logement
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
            Maisons et appartements vérifiés disponibles à la location.
          </p>

          {/* Quick search input */}
          <form onSubmit={handleQuickSearchSubmit} className="mt-4 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={quickKeyword}
                onChange={(e) => setQuickKeyword(e.target.value)}
                placeholder="Rechercher un quartier, une ville, une adresse..."
                className="w-full pl-9 pr-3 py-2.5 bg-slate-900/80 border border-white/20 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 backdrop-blur-xs"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors shrink-0 cursor-pointer shadow-sm"
            >
              Rechercher
            </button>
          </form>
        </div>
      </div>

      {/* Main Discover Feed */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Logements disponibles
            </h2>
            <p className="text-xs text-slate-500">
              Annonces vérifiées en temps réel
            </p>
          </div>
          <button
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-1 text-xs text-slate-600 hover:text-blue-600 p-1 rounded transition-colors cursor-pointer"
            title="Mélanger et rafraîchir"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Mélanger</span>
          </button>
        </div>

        {error && <ErrorAlert message={error} onRetry={loadData} className="mb-4" />}

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white rounded-xl border border-slate-200 h-64 animate-pulse p-4">
                <div className="bg-slate-200 h-36 rounded-lg mb-3" />
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-slate-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : houses.length === 0 ? (
          <EmptyState
            title="Aucun logement disponible pour le moment."
            description="Aucun bien immobilier n'est actuellement mis en location. Revenez un peu plus tard ou connectez-vous comme propriétaire pour publier votre premier bien."
            actionLabel="Rafraîchir"
            onAction={loadData}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {houses.map((house) => (
              <HouseCard
                key={house.id}
                house={house}
                isFavorited={favoriteIds.has(house.id)}
                onToggleFavorite={onToggleFavorite}
                onSelect={onSelectHouse}
              />
            ))}
          </div>
        )}
      </div>

      {/* Conditional Sub-sections (Strictly calculated from real data) */}
      {apartments.length > 0 && apartments.length < houses.length && (
        <div className="pt-4 border-t border-slate-200">
          <div className="mb-3 px-1">
            <h2 className="text-sm font-bold text-slate-900">
              Appartements disponibles ({apartments.length})
            </h2>
            <p className="text-xs text-slate-500">Filtrés depuis les annonces réelles</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {apartments.slice(0, 3).map((house) => (
              <HouseCard
                key={house.id}
                house={house}
                isFavorited={favoriteIds.has(house.id)}
                onToggleFavorite={onToggleFavorite}
                onSelect={onSelectHouse}
              />
            ))}
          </div>
        </div>
      )}

      {individualHouses.length > 0 && individualHouses.length < houses.length && (
        <div className="pt-4 border-t border-slate-200">
          <div className="mb-3 px-1">
            <h2 className="text-sm font-bold text-slate-900">
              Maisons & Villas ({individualHouses.length})
            </h2>
            <p className="text-xs text-slate-500">Filtrées depuis les annonces réelles</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {individualHouses.slice(0, 3).map((house) => (
              <HouseCard
                key={house.id}
                house={house}
                isFavorited={favoriteIds.has(house.id)}
                onToggleFavorite={onToggleFavorite}
                onSelect={onSelectHouse}
              />
            ))}
          </div>
        </div>
      )}

      {multiRoomHouses.length > 0 && multiRoomHouses.length < houses.length && (
        <div className="pt-4 border-t border-slate-200">
          <div className="mb-3 px-1">
            <h2 className="text-sm font-bold text-slate-900">
              Grands logements (3 chambres et plus)
            </h2>
            <p className="text-xs text-slate-500">Idéal pour les familles</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {multiRoomHouses.slice(0, 3).map((house) => (
              <HouseCard
                key={house.id}
                house={house}
                isFavorited={favoriteIds.has(house.id)}
                onToggleFavorite={onToggleFavorite}
                onSelect={onSelectHouse}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
