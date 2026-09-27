import React from 'react';
import { Home } from 'lucide-react';
import { Profile } from '../../types/database';

interface NavbarProps {
  profile: Profile | null;
  onOpenConfig?: () => void;
  onSignOut?: () => void;
  isMobileFrame?: boolean;
  onToggleFrame?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  profile,
}) => {
  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'owner':
        return 'Espace Propriétaire';
      case 'admin':
        return 'Espace Administrateur';
      case 'tenant':
      default:
        return 'Espace Locataire';
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shrink-0">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Home className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-slate-900">LocaTix</span>
              <span className="hidden sm:inline-block ml-2 text-[11px] font-medium text-slate-500">
                Location immobilière
              </span>
            </div>
          </div>

          {profile && (
            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
              {getRoleLabel(profile.role)}
            </span>
          )}
        </div>

        {/* User profile info without logout icon */}
        <div className="flex items-center gap-2">
          {profile && (
            <div className="text-right hidden sm:block">
              <p className="text-xs font-medium text-slate-900 truncate max-w-[140px]">
                {profile.name}
              </p>
              <p className="text-[10px] text-slate-500 truncate max-w-[140px]">
                {profile.email}
              </p>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
