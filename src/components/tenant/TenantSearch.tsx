import React, { useState, useEffect } from 'react';
import { Search, Filter, SlidersHorizontal, RotateCcw, Bed, Bath, ArrowUpDown } from 'lucide-react';
import { House, PropertyType, SearchFilters } from '../../types/database';
import { getHouses } from '../../services/houseService';
import { HouseCard } from '../common/HouseCard';
import { EmptyState } from '../common/EmptyState';
import { ErrorAlert } from '../common/ErrorAlert';

interface TenantSearchProps {
  initialKeyword?: string;
  favoriteIds: Set<string>;
  onToggleFavorite: (houseId: string) => void;
  onSelectHouse: (house: House) => void;
}

export const TenantSearch: React.FC<TenantSearchProps> = ({
  initialKeyword = '',
  favoriteIds,
  onToggleFavorite,
  onSelectHouse,
}) => {
  const [keyword, setKeyword] = useState(initialKeyword);
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [bedrooms, setBedrooms] = useState<number | undefined>(undefined);
  const [bathrooms, setBathrooms] = useState<number | undefined>(undefined);
  const [propertyType, setPropertyType] = useState<PropertyType | ''>('');
  const [minSurface, setMinSurface] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc' | 'bedrooms_desc'>('newest');
  const [onlyAvailable, setOnlyAvailable] = useState(true);

  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [results, setResults] = useState<House[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performSearch = async () => {
    setIsLoading(true);
    setError(null);

    const filters: SearchFilters = {
      keyword: keyword.trim() || undefined,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      bedrooms: bedrooms,
      bathrooms: bathrooms,
      propertyType: propertyType || undefined,
      minSurface: minSurface ? parseFloat(minSurface) : undefined,
      onlyAvailable: onlyAvailable,
      sortBy: sortBy,
    };

    const { houses, error: err } = await getHouses(filters);
    setIsLoading(false);

    if (err) {
      setError(err);
    } else {
      setResults(houses);
    }
  };

  useEffect(() => {
    performSearch();
  }, [bedrooms, bathrooms, propertyType, sortBy, onlyAvailable]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch();
    setShowFiltersModal(false);
  };

  const handleResetFilters = () => {
    setKeyword('');
    setMinPrice('');
    setMaxPrice('');
    setBedrooms(undefined);
    setBathrooms(undefined);
    setPropertyType('');
    setMinSurface('');
    setSortBy('newest');
    setOnlyAvailable(true);
  };

  const activeFiltersCount = [
    minPrice,
    maxPrice,
    bedrooms !== undefined,
    bathrooms !== undefined,
    propertyType,
    minSurface,
    !onlyAvailable,
  ].filter(Boolean).length;

  return (
    <div className="space-y-4 pb-20">
      {/* Header & Main Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Rechercher un quartier, une ville, une adresse..."
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Filtrer
          </button>
          <button
            type="button"
            onClick={() => setShowFiltersModal(!showFiltersModal)}
            className={`px-3 py-2 border rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeFiltersCount > 0
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-slate-300 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Filtres</span>
            {activeFiltersCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </form>

        {/* Quick Property Type Selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
          {[
            { id: '', label: 'Tous' },
            { id: 'appartement', label: 'Appartements' },
            { id: 'maison', label: 'Maisons' },
            { id: 'studio', label: 'Studios' },
            { id: 'villa', label: 'Villas' },
            { id: 'chambre', label: 'Chambres' },
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setPropertyType(type.id as any)}
              className={`px-3 py-1.5 rounded-lg shrink-0 font-medium transition-colors cursor-pointer ${
                propertyType === type.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* Sorting & Result Count Bar */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
          <span>
            {results.length} résultat{results.length > 1 ? 's' : ''} trouvé{results.length > 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="w-3 h-3 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent border-0 text-slate-700 font-medium focus:ring-0 py-0 pr-6 text-xs cursor-pointer"
            >
              <option value="newest">Plus récent</option>
              <option value="price_asc">Prix croissant</option>
              <option value="price_desc">Prix décroissant</option>
              <option value="bedrooms_desc">Nombre de chambres</option>
            </select>
          </div>
        </div>
      </div>

      {/* Expanded Filters Drawer / Panel */}
      {showFiltersModal && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-blue-600" />
              Filtres avancés
            </span>
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1 text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Réinitialiser
            </button>
          </div>

          {/* Price Range */}
          <div>
            <label className="block font-semibold text-slate-800 mb-1.5">
              Budget mensuel ($)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="Prix min (ex: 200)"
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
              />
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="Prix max (ex: 500)"
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Bedrooms */}
          <div>
            <label className="block font-semibold text-slate-800 mb-1.5 flex items-center gap-1">
              <Bed className="w-3.5 h-3.5 text-slate-500" />
              Nombre de chambres minimum
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {[
                { val: undefined, label: 'Tous' },
                { val: 1, label: '1+' },
                { val: 2, label: '2+' },
                { val: 3, label: '3+' },
                { val: 4, label: '4+' },
              ].map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => setBedrooms(opt.val)}
                  className={`py-1.5 text-center font-medium rounded-lg border transition-colors cursor-pointer ${
                    bedrooms === opt.val
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bathrooms */}
          <div>
            <label className="block font-semibold text-slate-800 mb-1.5 flex items-center gap-1">
              <Bath className="w-3.5 h-3.5 text-slate-500" />
              Salles de bain
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { val: undefined, label: 'Tous' },
                { val: 1, label: '1+' },
                { val: 2, label: '2+' },
                { val: 3, label: '3+' },
              ].map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => setBathrooms(opt.val)}
                  className={`py-1.5 text-center font-medium rounded-lg border transition-colors cursor-pointer ${
                    bathrooms === opt.val
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Surface */}
          <div>
            <label className="block font-semibold text-slate-800 mb-1.5">
              Surface minimale (m²)
            </label>
            <input
              type="number"
              value={minSurface}
              onChange={(e) => setMinSurface(e.target.value)}
              placeholder="ex: 50"
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          {/* Availability */}
          <div className="flex items-center justify-between pt-2">
            <span className="font-semibold text-slate-800">
              Uniquement les logements disponibles
            </span>
            <input
              type="checkbox"
              checked={onlyAvailable}
              onChange={(e) => setOnlyAvailable(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowFiltersModal(false)}
              className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              Fermer
            </button>
            <button
              type="button"
              onClick={() => {
                performSearch();
                setShowFiltersModal(false);
              }}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium cursor-pointer"
            >
              Appliquer les filtres
            </button>
          </div>
        </div>
      )}

      {/* Error Feedback */}
      {error && <ErrorAlert message={error} onRetry={performSearch} />}

      {/* Results Feed */}
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
      ) : results.length === 0 ? (
        <EmptyState
          title="Aucun appartement disponible pour le moment."
          description="Aucun logement ne correspond aux critères de recherche actuels. Essayez d'élargir votre localisation ou d'ajuster votre budget."
          actionLabel="Réinitialiser les filtres"
          onAction={handleResetFilters}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((house) => (
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
  );
};
