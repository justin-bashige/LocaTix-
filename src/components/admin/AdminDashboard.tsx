import React, { useState, useEffect } from 'react';
import { Shield, Users, Home, Send, RefreshCw, Trash2, CheckCircle2 } from 'lucide-react';
import { House, Profile, RentalRequest, UserRole } from '../../types/database';
import { getAllProfiles, getAllHousesAdmin, getAllRequestsAdmin, updateUserRoleAdmin, deleteHouseAdmin } from '../../services/adminService';
import { ErrorAlert } from '../common/ErrorAlert';
import { EmptyState } from '../common/EmptyState';

interface AdminDashboardProps {
  currentUser: Profile;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'houses' | 'requests'>('overview');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [houses, setHouses] = useState<House[]>([]);
  const [requests, setRequests] = useState<RentalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAllData = async () => {
    setIsLoading(true);
    setError(null);

    const [profilesRes, housesRes, requestsRes] = await Promise.all([
      getAllProfiles(),
      getAllHousesAdmin(),
      getAllRequestsAdmin(),
    ]);

    setIsLoading(false);

    if (profilesRes.error) {
      setError(profilesRes.error);
    } else if (housesRes.error) {
      setError(housesRes.error);
    } else if (requestsRes.error) {
      setError(requestsRes.error);
    } else {
      setProfiles(profilesRes.profiles);
      setHouses(housesRes.houses);
      setRequests(requestsRes.requests);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (!confirm(`Modifier le rôle de cet utilisateur vers "${newRole}" ?`)) return;

    const { success, error: err } = await updateUserRoleAdmin(userId, newRole);
    if (err) {
      alert(`Erreur: ${err}`);
    } else if (success) {
      loadAllData();
    }
  };

  const handleDeleteHouse = async (houseId: string) => {
    if (!confirm('Supprimer ce logement de la plateforme ?')) return;

    const { success, error: err } = await deleteHouseAdmin(houseId);
    if (err) {
      alert(`Erreur: ${err}`);
    } else if (success) {
      loadAllData();
    }
  };

  return (
    <div className="space-y-5 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between bg-slate-900 text-white p-5 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Administration Plateforme LocaTix</h1>
            <p className="text-xs text-slate-400">
              Contrôle global, comptes utilisateurs et intégrité des annonces
            </p>
          </div>
        </div>
        <button
          onClick={loadAllData}
          disabled={isLoading}
          className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors cursor-pointer"
          title="Actualiser"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && <ErrorAlert message={error} onRetry={loadAllData} />}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-4 text-xs font-medium">
        {[
          { id: 'overview', label: 'Vue globale' },
          { id: 'users', label: `Comptes (${profiles.length})` },
          { id: 'houses', label: `Logements (${houses.length})` },
          { id: 'requests', label: `Demandes (${requests.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-2.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-700 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium text-slate-600">Utilisateurs inscrits</span>
              <Users className="w-4 h-4 text-slate-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{profiles.length}</p>
            <p className="text-[11px] text-slate-500 mt-1">
              {profiles.filter((p) => p.role === 'owner').length} propriétaires · {profiles.filter((p) => p.role === 'tenant').length} locataires
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium text-slate-600">Total Logements</span>
              <Home className="w-4 h-4 text-slate-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{houses.length}</p>
            <p className="text-[11px] text-slate-500 mt-1">
              {houses.filter((h) => h.is_available).length} disponibles · {houses.filter((h) => !h.is_available).length} occupés
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium text-slate-600">Demandes de location</span>
              <Send className="w-4 h-4 text-slate-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{requests.length}</p>
            <p className="text-[11px] text-slate-500 mt-1">
              {requests.filter((r) => r.status === 'accepted').length} acceptées · {requests.filter((r) => r.status === 'pending').length} en attente
            </p>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden text-xs">
          <div className="p-4 border-b border-slate-200 font-semibold text-slate-900">
            Comptes réels enregistrés dans la table "profiles"
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                <tr>
                  <th className="p-3">Nom</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Téléphone</th>
                  <th className="p-3">Rôle actuel</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {profiles.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70">
                    <td className="p-3 font-semibold text-slate-900">{p.name}</td>
                    <td className="p-3 text-slate-600">{p.email}</td>
                    <td className="p-3 text-slate-500">{p.phone || '-'}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded font-medium text-[11px] ${
                          p.role === 'admin'
                            ? 'bg-purple-100 text-purple-800'
                            : p.role === 'owner'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {p.role}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <select
                        value={p.role}
                        onChange={(e) => handleRoleChange(p.id, e.target.value as UserRole)}
                        className="text-xs p-1 border border-slate-200 rounded bg-white text-slate-700"
                      >
                        <option value="tenant">Locataire</option>
                        <option value="owner">Propriétaire</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Houses Tab */}
      {activeTab === 'houses' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden text-xs">
          <div className="p-4 border-b border-slate-200 font-semibold text-slate-900">
            Tous les logements publiés sur la plateforme ({houses.length})
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                <tr>
                  <th className="p-3">Titre</th>
                  <th className="p-3">Lieu</th>
                  <th className="p-3">Prix</th>
                  <th className="p-3">Disponibilité</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {houses.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50/70">
                    <td className="p-3 font-semibold text-slate-900">{h.title}</td>
                    <td className="p-3 text-slate-600">{h.location}</td>
                    <td className="p-3 font-bold text-slate-800">{h.price} $</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                          h.is_available
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {h.is_available ? 'Disponible' : 'Occupé'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleDeleteHouse(h.id)}
                        className="text-rose-600 hover:text-rose-800 p-1"
                        title="Supprimer définitivement"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Requests Tab */}
      {activeTab === 'requests' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden text-xs">
          <div className="p-4 border-b border-slate-200 font-semibold text-slate-900">
            Toutes les demandes de location ({requests.length})
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                <tr>
                  <th className="p-3">Logement</th>
                  <th className="p-3">Locataire</th>
                  <th className="p-3">Statut</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70">
                    <td className="p-3 font-semibold text-slate-900">{r.house?.title || 'Logement'}</td>
                    <td className="p-3 text-slate-600">{r.tenant?.name || 'Locataire'}</td>
                    <td className="p-3">
                      <span className="font-semibold">{r.status}</span>
                    </td>
                    <td className="p-3 text-slate-500">{new Date(r.created_at).toLocaleDateString('fr-FR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
