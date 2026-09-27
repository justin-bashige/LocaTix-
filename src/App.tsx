import React, { useState, useEffect } from 'react';
import { getSupabaseClient } from './lib/supabase';
import { getCurrentUserProfile, signOutUser } from './services/authService';
import { getFavorites, toggleFavorite } from './services/favoriteService';
import { Profile, House } from './types/database';

import { Navbar } from './components/common/Navbar';
import { BottomNav, TenantTab, OwnerTab, AdminTab } from './components/common/BottomNav';
import { AuthScreen } from './components/auth/AuthScreen';
import { HouseDetailModal } from './components/tenant/HouseDetailModal';

// Tenant Screens
import { TenantHome } from './components/tenant/TenantHome';
import { TenantSearch } from './components/tenant/TenantSearch';
import { TenantFavorites } from './components/tenant/TenantFavorites';
import { TenantRequests } from './components/tenant/TenantRequests';

// Owner Screens
import { OwnerDashboard } from './components/owner/OwnerDashboard';
import { OwnerHouses } from './components/owner/OwnerHouses';
import { OwnerRequests } from './components/owner/OwnerRequests';

// Admin Screen
import { AdminDashboard } from './components/admin/AdminDashboard';

// Profile Screen
import { ProfileScreen } from './components/profile/ProfileScreen';

export default function App() {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Tab navigation state
  const [tenantTab, setTenantTab] = useState<TenantTab>('home');
  const [ownerTab, setOwnerTab] = useState<OwnerTab>('dashboard');
  const [adminTab, setAdminTab] = useState<AdminTab>('admin');

  // Favorites tracking
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  // Search keyword handover
  const [searchInitialKeyword, setSearchInitialKeyword] = useState('');

  // Selected house for full detail view
  const [selectedHouse, setSelectedHouse] = useState<House | null>(null);

  // Load current user profile
  const loadUser = async () => {
    setIsInitializing(true);
    const { profile } = await getCurrentUserProfile();
    setCurrentUser(profile);
    setIsInitializing(false);

    if (profile && profile.role === 'tenant') {
      loadUserFavorites(profile.id);
    }
  };

  const loadUserFavorites = async (userId: string) => {
    const { favorites } = await getFavorites(userId);
    const ids = new Set(favorites.map((f) => f.house_id));
    setFavoriteIds(ids);
  };

  useEffect(() => {
    loadUser();

    // Listen for auth state changes
    const client = getSupabaseClient();
    let authListener: any = null;
    if (client) {
      const { data } = client.auth.onAuthStateChange(async (event) => {
        if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          const { profile } = await getCurrentUserProfile();
          setCurrentUser(profile);
          if (profile?.role === 'tenant') {
            loadUserFavorites(profile.id);
          }
        } else if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
          setFavoriteIds(new Set());
        }
      });
      authListener = data.subscription;
    }

    return () => {
      if (authListener) authListener.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await signOutUser();
    setCurrentUser(null);
    setFavoriteIds(new Set());
    setTenantTab('home');
    setOwnerTab('dashboard');
  };

  const handleToggleFavorite = async (houseId: string) => {
    if (!currentUser) {
      alert('Veuillez vous connecter pour ajouter un logement à vos favoris.');
      return;
    }

    // Optimistic UI update
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(houseId)) {
        next.delete(houseId);
      } else {
        next.add(houseId);
      }
      return next;
    });

    const { error } = await toggleFavorite(currentUser.id, houseId);
    if (error) {
      loadUserFavorites(currentUser.id);
      alert(`Erreur: ${error}`);
    }
  };

  const handleGoToSearch = (keyword?: string) => {
    if (keyword) {
      setSearchInitialKeyword(keyword);
    }
    setTenantTab('search');
  };

  // Determine current active tab based on role
  const getCurrentTab = () => {
    if (!currentUser) return '';
    if (currentUser.role === 'owner') return ownerTab;
    if (currentUser.role === 'admin') return adminTab;
    return tenantTab;
  };

  const handleTabChange = (tab: any) => {
    if (!currentUser) return;
    if (currentUser.role === 'owner') {
      setOwnerTab(tab);
    } else if (currentUser.role === 'admin') {
      setAdminTab(tab);
    } else {
      setTenantTab(tab);
    }
  };

  // Render content based on authenticated role and current tab
  const renderMainContent = () => {
    if (!currentUser) {
      return (
        <AuthScreen
          onAuthSuccess={(profile) => {
            setCurrentUser(profile);
            if (profile.role === 'tenant') loadUserFavorites(profile.id);
          }}
        />
      );
    }

    // OWNER SCREENS
    if (currentUser.role === 'owner') {
      switch (ownerTab) {
        case 'home':
          return (
            <TenantHome
              currentUser={currentUser}
              favoriteIds={favoriteIds}
              onToggleFavorite={handleToggleFavorite}
              onSelectHouse={(house) => setSelectedHouse(house)}
              onGoToSearch={handleGoToSearch}
            />
          );
        case 'dashboard':
          return (
            <OwnerDashboard
              currentUser={currentUser}
              onNavigateToHouses={() => setOwnerTab('houses')}
              onNavigateToRequests={() => setOwnerTab('requests')}
              onNavigateToHome={() => setOwnerTab('home')}
            />
          );
        case 'houses':
          return (
            <OwnerHouses
              currentUser={currentUser}
              onSelectHouse={(house) => setSelectedHouse(house)}
            />
          );
        case 'requests':
          return <OwnerRequests currentUser={currentUser} />;
        case 'profile':
          return (
            <ProfileScreen
              currentUser={currentUser}
              onProfileUpdated={(updated) => setCurrentUser(updated)}
              onSignOut={handleSignOut}
            />
          );
      }
    }

    // ADMIN SCREENS
    if (currentUser.role === 'admin') {
      switch (adminTab) {
        case 'admin':
          return <AdminDashboard currentUser={currentUser} />;
        case 'profile':
          return (
            <ProfileScreen
              currentUser={currentUser}
              onProfileUpdated={(updated) => setCurrentUser(updated)}
              onSignOut={handleSignOut}
            />
          );
      }
    }

    // TENANT SCREENS (Default)
    switch (tenantTab) {
      case 'home':
        return (
          <TenantHome
            currentUser={currentUser}
            favoriteIds={favoriteIds}
            onToggleFavorite={handleToggleFavorite}
            onSelectHouse={(house) => setSelectedHouse(house)}
            onGoToSearch={handleGoToSearch}
          />
        );
      case 'search':
        return (
          <TenantSearch
            initialKeyword={searchInitialKeyword}
            favoriteIds={favoriteIds}
            onToggleFavorite={handleToggleFavorite}
            onSelectHouse={(house) => setSelectedHouse(house)}
          />
        );
      case 'favorites':
        return (
          <TenantFavorites
            currentUser={currentUser}
            favoriteIds={favoriteIds}
            onToggleFavorite={handleToggleFavorite}
            onSelectHouse={(house) => setSelectedHouse(house)}
            onExplore={() => setTenantTab('home')}
          />
        );
      case 'requests':
        return (
          <TenantRequests
            currentUser={currentUser}
            onExplore={() => setTenantTab('home')}
          />
        );
      case 'profile':
        return (
          <ProfileScreen
            currentUser={currentUser}
            onProfileUpdated={(updated) => setCurrentUser(updated)}
            onSignOut={handleSignOut}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navbar - only shown when logged in */}
      {currentUser && (
        <Navbar
          profile={currentUser}
          onSignOut={handleSignOut}
        />
      )}

      {/* Main Viewport Container */}
      <div className={`flex-1 w-full mx-auto ${!currentUser ? 'w-full' : 'max-w-2xl px-3 sm:px-4 py-4'}`}>
        {isInitializing ? (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] text-slate-400 gap-2">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-medium">Chargement de LocaTix...</p>
          </div>
        ) : (
          <main className="flex-1">{renderMainContent()}</main>
        )}
      </div>

      {/* Bottom Navigation (Only visible when user is logged in) */}
      {currentUser && (
        <BottomNav
          role={currentUser.role}
          currentTab={getCurrentTab()}
          onTabChange={handleTabChange}
          favoritesCount={favoriteIds.size}
        />
      )}

      {/* House Detail Modal */}
      <HouseDetailModal
        house={selectedHouse}
        currentUser={currentUser}
        isFavorited={selectedHouse ? favoriteIds.has(selectedHouse.id) : false}
        onToggleFavorite={handleToggleFavorite}
        onClose={() => setSelectedHouse(null)}
        onRequestSubmitted={() => {
          if (currentUser?.role === 'tenant') {
            setTenantTab('requests');
          }
        }}
      />
    </div>
  );
}
