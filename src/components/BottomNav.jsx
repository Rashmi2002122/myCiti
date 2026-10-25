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
    { id: 'home', label: 'Explore', icon: Compass },
    { id: 'map', label: 'Map', icon: MapPin },
    { id: 'saved', label: 'Saved', icon: Bookmark },
  ];

  return (
    <nav
      aria-label="Bottom Navigation"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[1500] pointer-events-auto"
    >
      <div className="flex items-center gap-1.5 p-1.5 bg-white/95 dark:bg-[#10141c] backdrop-blur-md rounded-full shadow-2xl border border-slate-200/80 dark:border-[#303139]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`min-h-[42px] px-4 py-2 rounded-full text-xs font-medium flex items-center gap-2 transition-all duration-160 cursor-pointer ${
                isActive
                  ? 'bg-[#ff951f] text-[#07090e] font-semibold shadow-md scale-[1.02]'
                  : 'text-slate-600 dark:text-[#c9ced8] hover:text-slate-900 dark:hover:text-[#f4f5f7] hover:bg-slate-100 dark:hover:bg-[#101522]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {isActive && <span>{tab.label}</span>}
            </button>
          );
        })}

        {/* Account Menu Button */}
        <button
          onClick={onAccountClick}
          aria-label={isAuthenticated ? 'Open account menu' : 'Sign in'}
          title={isAuthenticated ? (user?.name || 'Account Menu') : 'Sign In'}
          className="min-h-[42px] min-w-[42px] px-2.5 rounded-full bg-slate-100 dark:bg-[#101522] hover:bg-slate-200 dark:hover:bg-[#101522]/80 border border-slate-200 dark:border-[#303139] hover:border-[#ff951f]/60 active:scale-95 text-slate-800 dark:text-[#f4f5f7] flex items-center justify-center gap-1.5 transition-all duration-160 ml-1 cursor-pointer"
        >
          <div className="relative flex items-center justify-center">
            {user?.pictureUrl ? (
              <img
                src={user.pictureUrl}
                alt={user.name || 'User'}
                className="w-6 h-6 rounded-full object-cover ring-1 ring-[#ff951f]/50"
              />
            ) : (
              <UserIcon className="w-4 h-4 text-amber-700 dark:text-[#edcd8c]" />
            )}
            {user && !user.profileComplete && (user.role === 'CLIENT' || user.role === 'ADMIN' || user.role === 'SUBMITTER') && (
              <span
                title="Profile incomplete"
                className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#ff951f] ring-1 ring-white dark:ring-[#10141c]"
              />
            )}
          </div>
          <span className="text-xs font-medium hidden sm:inline max-w-[70px] truncate text-slate-800 dark:text-[#f4f5f7]">
            {isAuthenticated ? (user?.name?.split(' ')[0] || 'Account') : 'Account'}
          </span>
        </button>
      </div>
    </nav>
  );
}
