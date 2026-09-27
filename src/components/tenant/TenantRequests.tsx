import React, { useState, useEffect } from 'react';
import { Send, Clock, CheckCircle2, XCircle, Ban, RefreshCw, MapPin } from 'lucide-react';
import { Profile, RentalRequest, RequestStatus } from '../../types/database';
import { getTenantRequests, updateRequestStatus } from '../../services/rentalService';
import { EmptyState } from '../common/EmptyState';
import { ErrorAlert } from '../common/ErrorAlert';

interface TenantRequestsProps {
  currentUser: Profile;
  onExplore: () => void;
}

export const TenantRequests: React.FC<TenantRequestsProps> = ({
  currentUser,
  onExplore,
}) => {
  const [requests, setRequests] = useState<RentalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const loadRequests = async () => {
    setIsLoading(true);
    setError(null);
    const { requests: data, error: err } = await getTenantRequests(currentUser.id);
    setIsLoading(false);

    if (err) {
      setError(err);
    } else {
      setRequests(data);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleCancelRequest = async (requestId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette demande de location ?')) return;

    setCancellingId(requestId);
    const { success, error: cancelErr } = await updateRequestStatus({
      requestId,
      status: 'cancelled',
    });
    setCancellingId(null);

    if (cancelErr) {
      alert(`Erreur: ${cancelErr}`);
    } else if (success) {
      loadRequests();
    }
  };

  const getStatusBadge = (status: RequestStatus) => {
    switch (status) {
      case 'accepted':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Acceptée
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" />
            Refusée
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
            <Ban className="w-3 h-3 text-slate-400" />
            Annulée
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            En attente
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 pb-20">
      <div className="flex items-center justify-between px-1">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Mes Demandes</h1>
          <p className="text-xs text-slate-500">
            Suivi en direct de vos demandes de location auprès des propriétaires
          </p>
        </div>
        <button
          onClick={loadRequests}
          disabled={isLoading}
          className="flex items-center gap-1 text-xs text-slate-600 hover:text-blue-600 p-1.5 rounded transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Actualiser</span>
        </button>
      </div>

      {error && <ErrorAlert message={error} onRetry={loadRequests} />}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((n) => (
            <div key={n} className="bg-white rounded-xl border border-slate-200 p-4 h-32 animate-pulse" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <EmptyState
          icon={Send}
          title="Vous n'avez aucune demande pour le moment."
          description="Lorsque vous consultez un logement disponible, cliquez sur « Demander cette location » pour entrer directement en contact avec le propriétaire."
          actionLabel="Découvrir des logements"
          onAction={onExplore}
        />
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const house = req.house;
            const primaryImg = house?.images && house.images.length > 0 ? house.images[0].image_url : null;
            const formattedDate = new Date(req.created_at).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            });

            return (
              <div
                key={req.id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row gap-4"
              >
                {/* Photo */}
                <div className="w-full sm:w-28 h-24 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                  {primaryImg ? (
                    <img
                      src={primaryImg}
                      alt={house?.title || 'Logement'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                      Aucune photo
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-sm text-slate-900 leading-snug">
                          {house?.title || 'Logement'}
                        </h3>
                        {house && (
                          <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{house.location}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-bold text-slate-800">
                              {new Intl.NumberFormat('fr-FR').format(house.price)} $ / mois
                            </span>
                          </div>
                        )}
                      </div>
                      <div>{getStatusBadge(req.status)}</div>
                    </div>

                    {req.message && (
                      <div className="mt-2 p-2 bg-slate-50 rounded text-xs text-slate-600 border border-slate-100">
                        <span className="font-medium text-slate-700">Votre note : </span>
                        {req.message}
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                    <span>Demandé le {formattedDate}</span>

                    {req.status === 'pending' && (
                      <button
                        onClick={() => handleCancelRequest(req.id)}
                        disabled={cancellingId === req.id}
                        className="text-xs font-medium text-rose-600 hover:text-rose-800 disabled:opacity-50 cursor-pointer"
                      >
                        {cancellingId === req.id ? 'Annulation...' : 'Annuler la demande'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
