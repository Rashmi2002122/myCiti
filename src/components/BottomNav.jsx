import React from 'react';
import { MapPin, Compass, Bookmark, User as UserIcon } from 'lucide-react';

export default function BottomNav({
  activeTab,
  onTabChange,
  onAccountClick,
  user,
  isAuthenticated
}) {
  const tabs = [
    { id: 'home', label: 'Highlights', icon: Compass },
    { id: 'map', label: 'Map', icon: MapPin },
    { id: 'saved', label: 'Saved', icon: Bookmark },
  ];

  return (
    <nav
      aria-label="Bottom Navigation"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[1500] pointer-events-auto"
    >
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-900/95 dark:bg-white/95 backdrop-blur-md rounded-full shadow-2xl border border-white/10 dark:border-slate-800">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`min-h-[44px] px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-all duration-200 ${
                isActive
                  ? 'bg-white text-slate-900 dark:bg-slate-900 dark:text-white shadow-md scale-[1.02]'
                  : 'text-slate-300 dark:text-slate-600 hover:text-white dark:hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              {isActive && <span>{tab.label}</span>}
            </button>
          );
        })}

        {/* Account Menu Button replacing the + button */}
        <button
          onClick={onAccountClick}
          aria-label={isAuthenticated ? 'Open account menu' : 'Sign in'}
          title={isAuthenticated ? (user?.name || 'Account Menu') : 'Sign In'}
          className="min-h-[44px] min-w-[44px] px-2.5 rounded-full bg-city-blue hover:bg-blue-600 active:scale-95 text-white flex items-center justify-center gap-1.5 shadow-lg transition-all ml-1"
        >
          <div className="relative flex items-center justify-center">
            {user?.pictureUrl ? (
              <img
                src={user.pictureUrl}
                alt={user.name || 'User'}
                className="w-6 h-6 rounded-full object-cover ring-2 ring-white/50"
              />
            ) : (
              <UserIcon className="w-5 h-5" />
            )}
            {user && !user.profileComplete && (
              <span
                title="Profile incomplete"
                className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-slate-900 animate-pulse"
              />
            )}
          </div>
          <span className="text-xs font-bold hidden sm:inline max-w-[70px] truncate">
            {isAuthenticated ? (user?.name?.split(' ')[0] || 'Account') : 'Account'}
          </span>
        </button>
      </div>
    </nav>
  );
}
