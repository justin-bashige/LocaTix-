import React, { useState } from 'react';
import { User, Mail, Phone, Shield, Save, LogOut, CheckCircle2, AlertCircle } from 'lucide-react';
import { Profile } from '../../types/database';
import { updateProfileInfo } from '../../services/authService';
import { designImages } from '../../assets/designImages';

interface ProfileScreenProps {
  currentUser: Profile;
  onProfileUpdated: (updated: Profile) => void;
  onSignOut: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  currentUser,
  onProfileUpdated,
  onSignOut,
}) => {
  const [name, setName] = useState(currentUser.name);
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatar_url || '');

  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(false);

    const { profile, error: err } = await updateProfileInfo({
      id: currentUser.id,
      name,
      phone,
      avatar_url: avatarUrl || null,
    });

    setIsSaving(false);

    if (err) {
      setError(err);
    } else if (profile) {
      setSuccess(true);
      onProfileUpdated(profile);
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner':
        return { label: 'Propriétaire', color: 'bg-blue-100 text-blue-800' };
      case 'admin':
        return { label: 'Administrateur', color: 'bg-purple-100 text-purple-800' };
      case 'tenant':
      default:
        return { label: 'Locataire', color: 'bg-slate-100 text-slate-800' };
    }
  };

  const roleInfo = getRoleBadge(currentUser.role);

  return (
    <div className="max-w-xl mx-auto space-y-5 pb-20">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* User Card with aesthetic background banner */}
        <div className="relative h-28 sm:h-32 bg-slate-900 overflow-hidden">
          <img
            src={designImages.modelHouse}
            alt=""
            aria-hidden="true"
            className="w-full h-full object-cover object-center opacity-65"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
        </div>

        <div className="px-6 pb-6 pt-0 space-y-6">
          <div className="relative -mt-12 flex items-end justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-end gap-3.5">
              <div className="w-20 h-20 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-2xl shadow-md border-4 border-white shrink-0">
                {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : <User className="w-8 h-8" />}
              </div>
              <div className="mb-1">
                <h1 className="text-lg font-bold text-slate-900 leading-tight">{currentUser.name}</h1>
                <p className="text-xs text-slate-500">{currentUser.email}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${roleInfo.color}`}>
                    {roleInfo.label}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Depuis le {new Date(currentUser.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>
            </div>
          </div>

        {/* Feedback */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Profil mis à jour avec succès !</span>
          </div>
        )}

        {/* Edit Form */}
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Nom complet
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Adresse email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                disabled
                value={currentUser.email}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 bg-slate-50 text-slate-500 rounded-lg cursor-not-allowed"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">L'email sert d'identifiant de connexion unique.</p>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Numéro de téléphone (visible sur vos annonces / demandes)
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+243 999 000 000"
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Rôle sur la plateforme
            </label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                disabled
                value={roleInfo.label}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 bg-slate-50 text-slate-500 rounded-lg cursor-not-allowed capitalize font-medium"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Rôle officiel sur la plateforme LocaTix.
            </p>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
          </div>
        </form>

        {/* Sign out */}
        <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-800">Session en cours</p>
            <p className="text-[11px] text-slate-500">Session authentifiée et sécurisée</p>
          </div>
          <button
            onClick={onSignOut}
            className="px-4 py-2 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Déconnexion
          </button>
        </div>
      </div>
    </div>
  </div>
  );
};
