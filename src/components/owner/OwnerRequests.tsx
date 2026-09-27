import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Clock, Ban, RefreshCw, User, Phone, Mail, MapPin } from 'lucide-react';
import { Profile, RentalRequest, RequestStatus } from '../../types/database';
import { getOwnerRequests, updateRequestStatus } from '../../services/rentalService';
import { EmptyState } from '../common/EmptyState';
import { ErrorAlert } from '../common/ErrorAlert';

interface OwnerRequestsProps {
  currentUser: Profile;
}

export const OwnerRequests: React.FC<OwnerRequestsProps> = ({ currentUser }) => {
  const [requests, setRequests] = useState<RentalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<RequestStatus | 'all'>('all');

  const loadRequests = async () => {
    setIsLoading(true);
    setError(null);
    const { requests: data, error: err } = await getOwnerRequests(currentUser.id);
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

  const handleAction = async (requestId: string, status: 'accepted' | 'rejected', houseId?: string) => {
    const confirmMsg =
      status === 'accepted'
        ? 'Accepter cette demande ? Le logement sera automatiquement marqué comme loué et les autres demandes en attente seront clôturées.'
        : 'Refuser cette demande de location ?';

    if (!confirm(confirmMsg)) return;

    setActionInProgressId(requestId);
    const { success, error: err } = await updateRequestStatus({
      requestId,
      status,
      houseId,
    });
    setActionInProgressId(null);

    if (err) {
      alert(`Erreur: ${err}`);
    } else if (success) {
      loadRequests();
    }
  };

  const filteredRequests =
    statusFilter === 'all'
      ? requests
      : requests.filter((r) => r.status === statusFilter);

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
            Annulée par le locataire
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
          <h1 className="text-lg font-bold text-slate-900">Demandes reçues</h1>
          <p className="text-xs text-slate-500">
            Demandes formulées par les locataires pour vos logements
          </p>
        </div>
        <button
          onClick={loadRequests}
          disabled={isLoading}
          className="p-1.5 border border-slate-300 hover:bg-slate-50 rounded-lg text-slate-600 transition-colors cursor-pointer"
          title="Actualiser"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
        {[
          { id: 'all', label: `Toutes (${requests.length})` },
          { id: 'pending', label: `En attente (${requests.filter((r) => r.status === 'pending').length})` },
          { id: 'accepted', label: `Acceptées (${requests.filter((r) => r.status === 'accepted').length})` },
          { id: 'rejected', label: `Refusées (${requests.filter((r) => r.status === 'rejected').length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id as any)}
            className={`px-3 py-1.5 rounded-lg shrink-0 font-medium transition-colors cursor-pointer ${
              statusFilter === tab.id
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && <ErrorAlert message={error} onRetry={loadRequests} />}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((n) => (
            <div key={n} className="bg-white rounded-xl border border-slate-200 p-4 h-32 animate-pulse" />
          ))}
        </div>
      ) : filteredRequests.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="Aucune demande pour le moment."
          description="Les demandes de location envoyées par des personnes intéressées apparaîtront directement ici."
          actionLabel="Actualiser"
          onAction={loadRequests}
        />
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((req) => {
            const tenant = req.tenant;
            const house = req.house;
            const isWorking = actionInProgressId === req.id;
            const dateStr = new Date(req.created_at).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            });

            return (
              <div
                key={req.id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3"
              >
                {/* Header: House + Status */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider block">
                      Demande de location
                    </span>
                    <h3 className="font-bold text-sm text-slate-900 mt-0.5">
                      {house?.title || 'Logement'}
                    </h3>
                    {house && (
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{house.location}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-semibold text-slate-800">{house.price} $ / mois</span>
                      </p>
                    )}
                  </div>
                  <div>{getStatusBadge(req.status)}</div>
                </div>

                {/* Tenant Info */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-semibold">
                      {tenant?.name ? tenant.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{tenant?.name || 'Locataire'}</p>
                      <div className="flex flex-wrap items-center gap-2.5 text-slate-500 mt-0.5">
                        {tenant?.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {tenant.phone}
                          </span>
                        )}
                        {tenant?.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            {tenant.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <span className="text-[11px] text-slate-400 sm:text-right">
                    Reçue le {dateStr}
                  </span>
                </div>

                {/* Message */}
                {req.message && (
                  <div className="text-xs text-slate-700 bg-white p-2.5 rounded border border-slate-200/80">
                    <span className="font-medium text-slate-900">Message : </span>
                    {req.message}
                  </div>
                )}

                {/* Action Buttons for Pending */}
                {req.status === 'pending' && (
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleAction(req.id, 'rejected')}
                      disabled={isWorking}
                      className="px-3 py-1.5 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                    >
                      Refuser la demande
                    </button>
                    <button
                      onClick={() => handleAction(req.id, 'accepted', req.house_id)}
                      disabled={isWorking}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Accepter et louer
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
