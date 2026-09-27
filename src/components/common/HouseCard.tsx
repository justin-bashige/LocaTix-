import React, { useState } from 'react';
import { Heart, MapPin, Bed, Bath, Home } from 'lucide-react';
import { House } from '../../types/database';

interface HouseCardProps {
  house: House;
  isFavorited?: boolean;
  onToggleFavorite?: (houseId: string) => void;
  onSelect: (house: House) => void;
  showFavoriteButton?: boolean;
}

export const HouseCard: React.FC<HouseCardProps> = ({
  house,
  isFavorited = false,
  onToggleFavorite,
  onSelect,
  showFavoriteButton = true,
}) => {
  const [imgError, setImgError] = useState(false);
  const primaryImage = house.images && house.images.length > 0 ? house.images[0].image_url : null;

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(house.id);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price);
  };

  const getPropertyTypeLabel = (type: string) => {
    switch (type) {
      case 'appartement': return 'Appartement';
      case 'maison': return 'Maison';
      case 'studio': return 'Studio';
      case 'villa': return 'Villa';
      case 'chambre': return 'Chambre';
      default: return type;
    }
  };

  return (
    <div
      onClick={() => onSelect(house)}
      className="group bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-slate-300 transition-all cursor-pointer flex flex-col"
    >
      {/* Photo Container */}
      <div className="relative aspect-4/3 w-full bg-slate-100 overflow-hidden">
        {primaryImage && !imgError ? (
          <img
            src={primaryImage}
            alt={house.title}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-100">
            <Home className="w-8 h-8 stroke-[1.5] text-slate-300" />
            <span className="text-[11px] text-slate-400 mt-1">Aucune photo</span>
          </div>
        )}

        {/* Top Badges / Actions */}
        <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between pointer-events-none">
          {/* Availability notice */}
          {!house.is_available ? (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-900/80 text-white backdrop-blur-xs">
              Indisponible
            </span>
          ) : (
            <span />
          )}

          {/* Favorite heart */}
          {showFavoriteButton && (
            <button
              onClick={handleFavoriteClick}
              aria-label="Ajouter aux favoris"
              className="pointer-events-auto w-8 h-8 rounded-full bg-white/90 hover:bg-white shadow-xs flex items-center justify-center text-slate-700 transition-transform active:scale-90 cursor-pointer"
            >
              <Heart
                className={`w-4 h-4 transition-colors ${
                  isFavorited
                    ? 'fill-rose-500 text-rose-500'
                    : 'text-slate-600 hover:text-rose-500'
                }`}
              />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-3.5 flex-1 flex flex-col justify-between">
        <div>
          {/* Location & Type */}
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <div className="flex items-center gap-1 truncate max-w-[70%]">
              <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
              <span className="truncate">{house.location}</span>
            </div>
            <span className="text-[11px] text-slate-600 font-medium">
              {getPropertyTypeLabel(house.property_type)}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-semibold text-sm text-slate-900 leading-snug line-clamp-1 group-hover:text-blue-600 transition-colors">
            {house.title}
          </h3>

          {/* Specs: Unboxed typographic metadata with dots */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1.5">
            <span className="inline-flex items-center gap-1">
              <Bed className="w-3.5 h-3.5 text-slate-400" />
              {house.bedrooms} ch.
            </span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className="inline-flex items-center gap-1">
              <Bath className="w-3.5 h-3.5 text-slate-400" />
              {house.bathrooms} sdb
            </span>
            {house.surface && (
              <>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <span>{house.surface} m²</span>
              </>
            )}
          </div>
        </div>

        {/* Price */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-baseline justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-base font-bold text-slate-900">
              {formatPrice(house.price)} $
            </span>
            <span className="text-xs text-slate-500 font-normal">/ mois</span>
          </div>
          <span className="text-xs font-semibold text-blue-600 group-hover:translate-x-0.5 transition-transform">
            Détails &rarr;
          </span>
        </div>
      </div>
    </div>
  );
};
