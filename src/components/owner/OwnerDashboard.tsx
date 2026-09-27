import React, { useState, useEffect } from 'react';
import { Home, CheckCircle2, Clock, Ban, Plus, RefreshCw, Send, ArrowRight, Building } from 'lucide-react';
import { House, Profile, RentalRequest } from '../../types/database';
import { getOwnerHouses } from '../../services/houseService';
import { getOwnerRequests, updateRequestStatus } from '../../services/rentalService';
import { EmptyState } from '../common/EmptyState';
import { ErrorAlert } from '../common/ErrorAlert';
import { HouseFormModal } from './HouseFormModal';
import { designImages } from '../../assets/designImages';

interface OwnerDashboardProps {
  currentUser: Profile;
  onNavigateToHouses: () => void;
  onNavigateToRequests: () => void;
  onNavigateToHome?: () => void;
}

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({
  currentUser,
  onNavigateToHouses,
  onNavigateToRequests,
  onNavigateToHome,
}) => {
  const [houses, setHouses] = useState<House[]>([]);
  const [requests, setRequests] = useState<RentalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const loadOwnerData = async () => {
    setIsLoading(true);
    setError(null);

    const [housesRes, requestsRes] = await Promise.all([
      getOwnerHouses(currentUser.id),
      getOwnerRequests(currentUser.id),
    ]);

    setIsLoading(false);

    if (housesRes.error) {
      setError(housesRes.error);
    } else if (requestsRes.error) {
      setError(requestsRes.error);
    } else {
      setHouses(housesRes.houses);
      setRequests(requestsRes.requests);
    }
  };

  useEffect(() => {
    loadOwnerData();
  }, []);

  // Compute metrics strictly from real Supabase data
  const totalHouses = houses.length;
  const availableHouses = houses.filter((h) => h.is_available).length;
  const rentedHouses = houses.filter((h) => !h.is_available).length;
  const totalRequests = requests.length;
  const pendingRequests = requests.filter((r) => r.status === 'pending').length;

  const handleQuickStatus = async (requestId: string, status: 'accepted' | 'rejected', houseId?: string) => {
    const { success, error: err } = await updateRequestStatus({
      requestId,
      status,
      houseId,
    });
    if (err) {
      alert(`Erreur: ${err}`);
    } else if (success) {
      loadOwnerData();
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Welcome Banner with aesthetic architectural background image */}
      <div className="relative overflow-hidden rounded-2xl p-6 sm:p-7 shadow-sm text-white">
        {/* Background Image */}
        <img
          src={designImages.keysHandover}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        {/* Subtle Dark Gradient Overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/75 to-slate-900/60 backdrop-blur-[1px]" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider mb-1 block">
              Espace Propriétaire · Gestion Immobilière
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Bonjour, {currentUser.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-md">
              Pilotez vos annonces, recevez vos demandes et suivez les disponibilités en direct.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onNavigateToHome && (
              <button
                onClick={onNavigateToHome}
                className="px-3.5 py-2.5 bg-white/15 hover:bg-white/25 border border-white/25 backdrop-blur-xs text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                title="Consulter le fil d'accueil des logements"
              >
                <Home className="w-4 h-4" />
                <span>Voir le fil des logements</span>
              </button>
            )}
            <button
              onClick={loadOwnerData}
              disabled={isLoading}
              className="p-2.5 bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-xs rounded-xl text-white transition-colors cursor-pointer"
              title="Rafraîchir les données"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Ajouter un logement
            </button>
          </div>
        </div>
      </div>

      {error && <ErrorAlert message={error} onRetry={loadOwnerData} />}

      {/* Real Statistics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Properties */}
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium text-slate-500">Logements</span>
            <Home className="w-4 h-4 text-slate-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{totalHouses}</p>
          <p className="text-[11px] text-slate-500 mt-1">Total annonces publiées</p>
        </div>

        {/* Available */}
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium text-slate-500">Disponibles</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{availableHouses}</p>
          <p className="text-[11px] text-emerald-700 mt-1">Prêts à être loués</p>
        </div>

        {/* Rented / Unavailable */}
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium text-slate-500">Loués / Occupés</span>
            <Ban className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{rentedHouses}</p>
          <p className="text-[11px] text-slate-500 mt-1">Non disponibles</p>
        </div>

        {/* Pending Requests */}
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium text-slate-500">Demandes en attente</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{pendingRequests}</p>
          <p className="text-[11px] text-amber-800 mt-1">{totalRequests} demande(s) au total</p>
        </div>
      </div>

      {/* Main sections */}
      {totalHouses === 0 && !isLoading ? (
        <EmptyState
          icon={Home}
          title="Vous n'avez encore publié aucun logement."
          description="Créez votre première annonce immobilière pour commencer à recevoir des demandes de location réelles."
          actionLabel="Publier un logement"
          onAction={() => setIsAddModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Properties Overview */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-900 text-sm">Vos logements récents</h2>
                <p className="text-xs text-slate-500">{houses.length} bien(s) enregistré(s)</p>
              </div>
              <button
                onClick={onNavigateToHouses}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
              >
                Gérer tout &rarr;
              </button>
            </div>

            <div className="space-y-2">
              {houses.slice(0, 3).map((house) => {
                const img = house.images && house.images.length > 0 ? house.images[0].image_url : null;
                return (
                  <div
                    key={house.id}
                    className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-slate-200 overflow-hidden shrink-0">
                        {img ? (
                          <img src={img} alt={house.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 text-[10px]">
                            Sans photo
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-xs text-slate-900 line-clamp-1">{house.title}</p>
                        <p className="text-[11px] text-slate-500">{house.location} · {house.price} $/mois</p>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        house.is_available
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {house.is_available ? 'Disponible' : 'Occupé'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pending Requests To Review */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-900 text-sm">Demandes à traiter</h2>
                <p className="text-xs text-slate-500">{pendingRequests} en attente de réponse</p>
              </div>
              <button
                onClick={onNavigateToRequests}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
              >
                Voir tout &rarr;
              </button>
            </div>

            {pendingRequests === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                Aucune demande en attente pour le moment.
              </p>
            ) : (
              <div className="space-y-2">
                {requests
                  .filter((r) => r.status === 'pending')
                  .slice(0, 3)
                  .map((req) => (
                    <div
                      key={req.id}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900">
                          {req.tenant?.name || 'Locataire'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(req.created_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 line-clamp-1">
                        Pour : <span className="font-medium text-slate-800">{req.house?.title}</span>
                      </p>
                      {req.message && (
                        <p className="text-[11px] text-slate-500 italic bg-white p-2 rounded border border-slate-200/60">
                          « {req.message} »
                        </p>
                      )}
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          onClick={() => handleQuickStatus(req.id, 'rejected')}
                          className="px-2.5 py-1 text-[11px] text-rose-700 hover:bg-rose-50 rounded font-medium cursor-pointer"
                        >
                          Refuser
                        </button>
                        <button
                          onClick={() => handleQuickStatus(req.id, 'accepted', req.house_id)}
                          className="px-3 py-1 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium cursor-pointer"
                        >
                          Accepter
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Modal */}
      <HouseFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        ownerId={currentUser.id}
        onSaved={loadOwnerData}
      />
    </div>
  );
};
