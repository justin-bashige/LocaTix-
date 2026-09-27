import React, { useState } from 'react';
import { X, MapPin, Bed, Bath, Maximize, User, Phone, Mail, Heart, Send, CheckCircle2, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { House, Profile } from '../../types/database';
import { createRentalRequest } from '../../services/rentalService';

interface HouseDetailModalProps {
  house: House | null;
  currentUser: Profile | null;
  isFavorited: boolean;
  onToggleFavorite: (houseId: string) => void;
  onClose: () => void;
  onRequestSubmitted?: () => void;
}

export const HouseDetailModal: React.FC<HouseDetailModalProps> = ({
  house,
  currentUser,
  isFavorited,
  onToggleFavorite,
  onClose,
  onRequestSubmitted,
}) => {
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  if (!house) return null;

  const images = house.images && house.images.length > 0 ? house.images : [];
  const currentImage = images[activeImageIdx]?.image_url;

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const { request, error } = await createRentalRequest({
      tenantId: currentUser.id,
      houseId: house.id,
      message: requestMessage,
    });

    setIsSubmitting(false);

    if (error) {
      setSubmitError(error);
    } else if (request) {
      setSubmitSuccess(true);
      onRequestSubmitted?.();
      setTimeout(() => {
        setShowRequestForm(false);
        setSubmitSuccess(false);
      }, 2000);
    }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header / Image Gallery */}
        <div className="relative aspect-16/10 sm:aspect-16/9 w-full bg-slate-900 shrink-0">
          {currentImage ? (
            <img
              src={currentImage}
              alt={house.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500 bg-slate-100">
              <span className="text-xs">Aucune photo pour ce logement</span>
            </div>
          )}

          {/* Carousel Arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={() => setActiveImageIdx((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setActiveImageIdx((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <div className="absolute bottom-2.5 right-3 px-2 py-0.5 rounded bg-black/60 text-white text-[11px] font-mono">
                {activeImageIdx + 1} / {images.length}
              </div>
            </>
          )}

          {/* Action buttons (Close + Heart) */}
          <div className="absolute top-3 inset-x-3 flex items-center justify-between">
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-md flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              onClick={() => onToggleFavorite(house.id)}
              className="w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-md flex items-center justify-center transition-colors cursor-pointer active:scale-95"
            >
              <Heart
                className={`w-4 h-4 ${
                  isFavorited ? 'fill-rose-500 text-rose-500' : 'text-slate-700'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5 text-slate-800">
          {/* Main Info */}
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{house.location}</span>
                {house.address && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-slate-600 truncate">{house.address}</span>
                  </>
                )}
              </div>
              <span className="text-xs font-semibold text-slate-600 px-2 py-0.5 bg-slate-100 rounded">
                {getPropertyTypeLabel(house.property_type)}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1.5 leading-snug">
              {house.title}
            </h1>

            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-slate-900">
                {new Intl.NumberFormat('fr-FR').format(house.price)} $
              </span>
              <span className="text-sm text-slate-500 font-normal">/ mois</span>
            </div>
          </div>

          {/* Quick specs grid */}
          <div className="grid grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
            <div className="flex items-center gap-2">
              <Bed className="w-4 h-4 text-slate-400" />
              <div>
                <p className="font-semibold text-slate-900">{house.bedrooms}</p>
                <p className="text-[11px] text-slate-500">Chambre{house.bedrooms > 1 ? 's' : ''}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Bath className="w-4 h-4 text-slate-400" />
              <div>
                <p className="font-semibold text-slate-900">{house.bathrooms}</p>
                <p className="text-[11px] text-slate-500">Salle{house.bathrooms > 1 ? 's' : ''} de bain</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Maximize className="w-4 h-4 text-slate-400" />
              <div>
                <p className="font-semibold text-slate-900">
                  {house.surface ? `${house.surface} m²` : 'N/C'}
                </p>
                <p className="text-[11px] text-slate-500">Surface</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-1.5">
              Description
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {house.description || 'Aucune description fournie pour ce logement.'}
            </p>
          </div>

          {/* Owner info */}
          {house.owner && (
            <div className="p-4 rounded-xl border border-slate-200 bg-white">
              <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-2.5">
                Propriétaire du logement
              </h2>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-semibold text-sm">
                  {house.owner.name ? house.owner.name.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
                </div>
                <div className="flex-1 text-xs">
                  <p className="font-semibold text-slate-900 text-sm">{house.owner.name}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-slate-600">
                    {house.owner.phone && (
                      <span className="inline-flex items-center gap-1 text-[11px]">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {house.owner.phone}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-[11px]">
                      <Mail className="w-3 h-3 text-slate-400" />
                      {house.owner.email}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Request Form Drawer / Section */}
          {showRequestForm && (
            <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-blue-950">
                  Envoyer une demande de location
                </p>
                <button
                  onClick={() => setShowRequestForm(false)}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  Annuler
                </button>
              </div>
              <p className="text-xs text-blue-800">
                Votre demande sera directement transmise au propriétaire avec vos coordonnées (nom, téléphone, email).
              </p>
              <form onSubmit={handleSendRequest} className="space-y-2.5">
                <textarea
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  placeholder="Écrivez un message au propriétaire (ex: date d'emménagement souhaitée, situation professionnelle...)"
                  rows={3}
                  className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />

                {submitError && (
                  <div className="flex items-center gap-1.5 text-xs text-rose-700 bg-rose-50 p-2 rounded border border-rose-200">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                {submitSuccess && (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 p-2 rounded border border-emerald-200 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Demande envoyée avec succès au propriétaire !</span>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowRequestForm(false)}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200/50 rounded-lg cursor-pointer"
                  >
                    Fermer
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || submitSuccess}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    <Send className="w-3 h-3" />
                    {isSubmitting ? 'Envoi en cours...' : 'Confirmer la demande'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Sticky Bottom Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <div>
            <span className="text-xs text-slate-500 block">Loyer mensuel</span>
            <span className="text-lg font-bold text-slate-900">
              {new Intl.NumberFormat('fr-FR').format(house.price)} $
            </span>
          </div>

          {!house.is_available ? (
            <div className="px-4 py-2 bg-slate-200 text-slate-600 rounded-lg text-xs font-medium">
              Ce logement n'est plus disponible.
            </div>
          ) : currentUser?.role === 'owner' ? (
            <div className="text-xs text-slate-500 font-medium">
              Mode propriétaire actif
            </div>
          ) : (
            <button
              onClick={() => setShowRequestForm(true)}
              disabled={showRequestForm}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              Demander cette location
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
