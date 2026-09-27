import React, { useState } from 'react';
import { Home, Mail, Lock, User, Phone, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';
import { signInUser, signUpUser } from '../../services/authService';
import { Profile } from '../../types/database';
import { designImages } from '../../assets/designImages';

interface AuthScreenProps {
  onAuthSuccess: (profile: Profile) => void;
  onOpenConfig?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onAuthSuccess,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Sign up fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'tenant' | 'owner'>('tenant');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    setIsLoading(true);

    if (mode === 'signup') {
      if (!name.trim()) {
        setErrorMessage('Veuillez entrer votre nom complet.');
        setIsLoading(false);
        return;
      }

      const { profile, error } = await signUpUser({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        password,
        role,
      });

      setIsLoading(false);

      if (error) {
        setErrorMessage(error);
      } else if (profile) {
        onAuthSuccess(profile);
      }
    } else {
      const { profile, error } = await signInUser(email.trim(), password);
      setIsLoading(false);

      if (error) {
        setErrorMessage(error);
      } else if (profile) {
        onAuthSuccess(profile);
      }
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-3 sm:p-6 overflow-hidden">
      {/* Background image - warm, blurred & tamisée behind the card */}
      <img
        src={designImages.familyHome}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover object-center scale-105 filter blur-[6px]"
      />
      <div className="absolute inset-0 bg-black/40 backdrop-brightness-95" />

      {/* Main Auth Card */}
      <div className="relative z-10 w-full max-w-[390px] bg-white rounded-3xl shadow-2xl p-6 sm:p-7 space-y-4 border border-white/80">
        {/* Brand Icon */}
        <div className="text-center pt-1">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-md shadow-blue-500/25">
            <Home className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-2.5">
            LocaTix
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Location de maisons et appartements vérifiés
          </p>
        </div>

        {/* Tabs: Connexion / Créer un compte */}
        <div className="flex bg-slate-100/90 p-1 rounded-2xl text-xs font-semibold text-slate-600 mt-2">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2.5 rounded-xl transition-all cursor-pointer ${
              mode === 'signin'
                ? 'bg-white text-slate-900 shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-900 font-medium'
            }`}
          >
            Connexion
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2.5 rounded-xl transition-all cursor-pointer ${
              mode === 'signup'
                ? 'bg-white text-slate-900 shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-900 font-medium'
            }`}
          >
            Créer un compte
          </button>
        </div>

        {/* Model house photo banner inside card */}
        <div className="w-full h-28 rounded-2xl overflow-hidden border border-slate-100 shadow-inner">
          <img
            src={designImages.modelHouse}
            alt=""
            aria-hidden="true"
            className="w-full h-full object-cover object-center"
          />
        </div>

        {/* Error Feedback */}
        {errorMessage && (
          <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <span className="flex-1 break-words">{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3 text-xs pt-1">
          {mode === 'signup' && (
            <>
              {/* Full Name */}
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Nom complet *
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Justin Bashige"
                    className="w-full pl-10 pr-3.5 py-3 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white shadow-2xs"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Numéro de téléphone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+243 999 123 456"
                    className="w-full pl-10 pr-3.5 py-3 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white shadow-2xs"
                  />
                </div>
              </div>

              {/* Account Type */}
              <div>
                <label className="block font-semibold text-slate-800 mb-1.5">
                  Type de compte *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label
                    className={`flex flex-col p-2.5 rounded-xl border cursor-pointer transition-all ${
                      role === 'tenant'
                        ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-semibold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs">Locataire</span>
                      <input
                        type="radio"
                        name="account_role"
                        checked={role === 'tenant'}
                        onChange={() => setRole('tenant')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 font-normal">
                      Je cherche un logement
                    </span>
                  </label>

                  <label
                    className={`flex flex-col p-2.5 rounded-xl border cursor-pointer transition-all ${
                      role === 'owner'
                        ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-semibold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs">Propriétaire</span>
                      <input
                        type="radio"
                        name="account_role"
                        checked={role === 'owner'}
                        onChange={() => setRole('owner')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 font-normal">
                      Je propose un logement
                    </span>
                  </label>
                </div>
              </div>
            </>
          )}

          {/* Email */}
          <div>
            <label className="block font-semibold text-slate-800 mb-1">
              Adresse email *
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="locatix@gmail.com"
                className="w-full pl-10 pr-3.5 py-3 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white shadow-2xs"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block font-semibold text-slate-800 mb-1">
              Mot de passe *
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••••••"
                className="w-full pl-10 pr-3.5 py-3 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white shadow-2xs font-mono"
              />
            </div>
            {mode === 'signup' && (
              <span className="text-[10px] text-slate-400 mt-1 block">
                6 caractères minimum
              </span>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-3 py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white rounded-2xl font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-md shadow-blue-500/25"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Chargement...</span>
              </>
            ) : mode === 'signin' ? (
              <>
                <span>Se connecter</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>Créer mon compte</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
