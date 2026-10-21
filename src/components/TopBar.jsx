import React, { useState, useRef, useEffect } from 'react';
import { Search, Compass, X, MapPin, ChevronDown, Bell } from 'lucide-react';
import { FILTER_CHIPS } from '../services/api';
import { CITIES } from '../constants/cities';

export { CITIES };

export default function TopBar({
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  onNearMeClick,
  isLocating,
  darkMode,
  onToggleDarkMode,
  selectedCity = 'Kolkata',
  onSelectCity,
  unreadCount = 0,
  onOpenNotifications,
  onOpenAccountDrawer,
  user,
  isAuthenticated
}) {
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const cityDropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(event.target)) {
        setIsCityDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="absolute top-0 left-0 right-0 z-[1000] p-3 sm:p-4 pt-[max(0.75rem,env(safe-area-inset-top))] pointer-events-none flex flex-col gap-2.5">
      {/* Floating Action Controls */}
      <div className="flex items-center justify-between gap-2 pointer-events-auto">
        {/* Left: Round Avatar Button & Title pill with Dynamic City Selector */}
        <div className="flex items-center gap-2">
          {/* Round Profile Avatar / Hamburger Button (Twitter/X style) */}
          <button
            type="button"
            onClick={onOpenAccountDrawer}
            aria-label="Open account menu"
            className="w-11 h-11 rounded-full bg-white/95 dark:bg-slate-900/95 shadow-float border border-white/60 dark:border-slate-800 flex items-center justify-center overflow-hidden hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95 cursor-pointer relative flex-shrink-0"
          >
            {user?.pictureUrl ? (
              <img
                src={user.pictureUrl}
                alt={user.name || 'User profile'}
                className="w-full h-full object-cover"
              />
            ) : isAuthenticated ? (
              <div className="w-full h-full bg-city-blue/10 dark:bg-sky-500/20 text-city-blue dark:text-sky-400 flex items-center justify-center font-black text-sm">
                {user?.name ? user.name.charAt(0).toUpperCase() : '👤'}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-1 w-5 h-5 text-slate-700 dark:text-slate-200">
                <span className="w-4 h-0.5 bg-current rounded-full" />
                <span className="w-4 h-0.5 bg-current rounded-full" />
                <span className="w-2.5 h-0.5 bg-current rounded-full self-start" />
              </div>
            )}
            {isAuthenticated && (
              <span className={`absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-900 ${
                user?.role === 'ADMIN' ? 'bg-amber-500' : user?.role === 'CLIENT' ? 'bg-emerald-500' : 'bg-city-blue'
              }`} />
            )}
          </button>

          {/* Title pill with Dynamic City Selector */}
          <div className="relative" ref={cityDropdownRef}>
          <button
            type="button"
            onClick={() => setIsCityDropdownOpen(!isCityDropdownOpen)}
            className="flex items-center gap-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3.5 py-2.5 rounded-full shadow-float border border-white/60 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors"
          >
            <span className="text-xl">ðŸª”</span>
            <span className="font-extrabold text-base tracking-tight text-slate-800 dark:text-slate-100">
              my<span className="text-city-blue">Citi</span>
            </span>
            <span aria-label="Location_City" className="text-[10px] font-extrabold uppercase tracking-wider bg-sky-base text-blue-800 dark:bg-blue-950 dark:text-blue-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <span>{selectedCity}</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </span>
          </button>

          {/* City Selection Dropdown */}
          {isCityDropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-52 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 py-2 z-[2000] animate-in zoom-in-95">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Select City
              </div>
              <div className="max-h-60 overflow-y-auto">
                {CITIES.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      if (onSelectCity) onSelectCity(c);
                      setIsCityDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs font-bold flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors ${
                      selectedCity === c.id || (selectedCity === 'All India' && c.id === 'ALL')
                        ? 'text-city-blue bg-blue-50/50 dark:bg-blue-950/30'
                        : 'text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <span>{c.name}</span>
                    {selectedCity === c.id && <span className="text-city-blue text-xs">âœ“</span>}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

        {/* Right side buttons */}
        <div className="flex items-center gap-2">
          {/* Notifications Bell */}
          <button
            type="button"
            onClick={onOpenNotifications}
            aria-label="View notifications"
            title="Announcements & Notifications"
            className="relative w-11 h-11 flex items-center justify-center rounded-full bg-white/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-200 shadow-float border border-white/60 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Bell className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white rounded-full text-[10px] font-black flex items-center justify-center shadow-xs animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Near Me Button */}
          <button
            onClick={onNearMeClick}
            disabled={isLocating}
            title="Locate Near Me"
            aria-label="Find listings near me"
            className={`min-w-[44px] min-h-[44px] px-3.5 flex items-center gap-1.5 rounded-full font-semibold text-xs shadow-float transition-all duration-200 border ${
              isLocating
                ? 'bg-blue-500 text-white animate-pulse border-transparent'
                : 'bg-white/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 border-white/60 dark:border-slate-800'
            }`}
          >
            <Compass className={`w-4 h-4 ${isLocating ? 'animate-spin' : 'text-city-blue'}`} />
            <span className="hidden xs:inline sm:inline">Near me</span>
          </button>

          {/* Search Toggle */}
          <button
            onClick={() => setShowSearchInput(!showSearchInput)}
            aria-label="Toggle search"
            className="w-11 h-11 flex items-center justify-center rounded-full bg-white/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-200 shadow-float border border-white/60 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            {showSearchInput ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expandable Search Input */}
      {showSearchInput && (
        <div className="pointer-events-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-float p-2 border border-white/60 dark:border-slate-800 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-150">
          <Search className="w-4 h-4 text-slate-400 ml-2 flex-shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search pandals, melas, stores, areas..."
            className="w-full bg-transparent text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none py-1"
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Horizontally scrollable filter chips */}
      <nav aria-label="Category filters" className="pointer-events-auto flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {FILTER_CHIPS.map((chip) => {
          const isSelected = selectedCategory === chip.id;
          return (
            <button
              key={chip.id}
              onClick={() => onSelectCategory(chip.id)}
              className={`min-h-[44px] px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-1.5 shadow-float transition-all duration-150 border ${
                isSelected
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white scale-[1.02]'
                  : 'bg-white/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border-white/60 dark:border-slate-800'
              }`}
            >
              <span>{chip.icon}</span>
              <span>{chip.label}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
}