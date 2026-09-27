import React from 'react';
import { Home, Search, Heart, Send, User, LayoutDashboard, Building, Shield } from 'lucide-react';
import { UserRole } from '../../types/database';

export type TenantTab = 'home' | 'search' | 'favorites' | 'requests' | 'profile';
export type OwnerTab = 'home' | 'dashboard' | 'houses' | 'requests' | 'profile';
export type AdminTab = 'admin' | 'profile';

interface BottomNavProps {
  role: UserRole;
  currentTab: string;
  onTabChange: (tab: any) => void;
  favoritesCount?: number;
  pendingRequestsCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  role,
  currentTab,
  onTabChange,
  favoritesCount = 0,
  pendingRequestsCount = 0,
}) => {
  if (role === 'owner') {
    return (
      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 z-40 max-w-lg md:max-w-2xl mx-auto shadow-lg md:rounded-t-2xl">
        <div className="flex items-center justify-around h-16 px-1">
          {/* Accueil / Explorer le marché */}
          <button
            onClick={() => onTabChange('home')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
              currentTab === 'home' ? 'text-blue-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] mt-1">Accueil</span>
          </button>

          {/* Dashboard */}
          <button
            onClick={() => onTabChange('dashboard')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
              currentTab === 'dashboard' ? 'text-blue-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px] mt-1">Dashboard</span>
          </button>

          {/* Mes logements */}
          <button
            onClick={() => onTabChange('houses')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
              currentTab === 'houses' ? 'text-blue-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building className="w-5 h-5" />
            <span className="text-[10px] mt-1">Logements</span>
          </button>

          {/* Demandes */}
          <button
            onClick={() => onTabChange('requests')}
            className={`relative flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
              currentTab === 'requests' ? 'text-blue-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Send className="w-5 h-5" />
            <span className="text-[10px] mt-1">Demandes</span>
            {pendingRequestsCount > 0 && (
              <span className="absolute top-1.5 right-1/4 w-2 h-2 rounded-full bg-blue-600" />
            )}
          </button>

          {/* Profil */}
          <button
            onClick={() => onTabChange('profile')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
              currentTab === 'profile' ? 'text-blue-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-5 h-5" />
            <span className="text-[10px] mt-1">Profil</span>
          </button>
        </div>
      </nav>
    );
  }

  if (role === 'admin') {
    return (
      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 z-40 max-w-lg md:max-w-2xl mx-auto shadow-lg md:rounded-t-2xl">
        <div className="flex items-center justify-around h-16 px-2">
          <button
            onClick={() => onTabChange('admin')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
              currentTab === 'admin' ? 'text-blue-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Shield className="w-5 h-5" />
            <span className="text-[10px] mt-1">Admin</span>
          </button>

          <button
            onClick={() => onTabChange('profile')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
              currentTab === 'profile' ? 'text-blue-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-5 h-5" />
            <span className="text-[10px] mt-1">Profil</span>
          </button>
        </div>
      </nav>
    );
  }

  // Tenant navigation default
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 z-40 max-w-lg md:max-w-2xl mx-auto shadow-lg md:rounded-t-2xl">
      <div className="flex items-center justify-around h-16 px-1">
        {/* Accueil */}
        <button
          onClick={() => onTabChange('home')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
            currentTab === 'home' ? 'text-blue-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] mt-1">Accueil</span>
        </button>

        {/* Recherche */}
        <button
          onClick={() => onTabChange('search')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
            currentTab === 'search' ? 'text-blue-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Search className="w-5 h-5" />
          <span className="text-[10px] mt-1">Recherche</span>
        </button>

        {/* Favoris */}
        <button
          onClick={() => onTabChange('favorites')}
          className={`relative flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
            currentTab === 'favorites' ? 'text-blue-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Heart className="w-5 h-5" />
          <span className="text-[10px] mt-1">Favoris</span>
          {favoritesCount > 0 && (
            <span className="absolute top-1.5 right-1/4 w-2 h-2 rounded-full bg-rose-500" />
          )}
        </button>

        {/* Demandes */}
        <button
          onClick={() => onTabChange('requests')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
            currentTab === 'requests' ? 'text-blue-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Send className="w-5 h-5" />
          <span className="text-[10px] mt-1">Demandes</span>
        </button>

        {/* Profil */}
        <button
          onClick={() => onTabChange('profile')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
            currentTab === 'profile' ? 'text-blue-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] mt-1">Profil</span>
        </button>
      </div>
    </nav>
  );
};
