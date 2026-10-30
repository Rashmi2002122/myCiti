import React, { useState, useRef, useEffect } from 'react';
import { Search, Compass, X, ChevronDown, Bell, Loader2 } from 'lucide-react';
import { FILTER_CHIPS } from '../services/api';
import { CITIES } from '../constants/cities';

export { CITIES };

export default function TopBar({
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  isSearching = false,
  onNearMeClick,
  isLocating,
  _darkMode,
  _onToggleDarkMode,
  selectedCity = 'Bhubaneswar',
  onSelectCity,
  unreadCount = 0,
  onOpenNotifications,
  onOpenAccountDrawer,
  user,
  isAuthenticated
}) {
  const [showSearchInput, setShowSearchInput] = useState(() => Boolean(searchQuery));
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const cityDropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Auto-expand search bar if query is populated from outside
  useEffect(() => {
    if (searchQuery && !showSearchInput) {
      setShowSearchInput(true);
    }
  }, [searchQuery, showSearchInput]);

  // Focus input whenever search input opens
  useEffect(() => {
    if (showSearchInput) {
      searchInputRef.current?.focus();
    }
  }, [showSearchInput]);

  const handleToggleSearch = () => {
    if (showSearchInput) {
      // Closing search: clear active query so hidden filters don't linger
      if (searchQuery) {
        onSearchChange('');
      }
      setShowSearchInput(false);
    } else {
      setShowSearchInput(true);
    }
  };

  const handleSearchFormSubmit = (e) => {
    e.preventDefault();
    searchInputRef.current?.blur();
    if (onSearchSubmit) {
      onSearchSubmit();
    }
  };

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
    <header className="absolute top-0 left-0 right-0 z-[1000] p-2 sm:p-4 pt-[max(0.6rem,env(safe-area-inset-top))] pointer-events-none flex flex-col gap-2">
      {/* Floating Action Controls */}
      <div className="w-full max-w-full flex items-center justify-between gap-1 sm:gap-2 pointer-events-auto">
        {/* Left: Round Avatar Button & Title pill with Dynamic City Selector */}
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-shrink">
          {/* Round Profile Avatar / Hamburger Button (Twitter/X style) */}
          <button
            type="button"
            onClick={onOpenAccountDrawer}
            aria-label="Open account menu"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/95 dark:bg-[#10141c] text-slate-800 dark:text-[#f4f5f7] shadow-float border border-slate-200/80 dark:border-[#303139] flex items-center justify-center overflow-hidden hover:border-[#ff951f]/60 hover:bg-slate-50 dark:hover:bg-[#101522] transition-colors duration-160 active:scale-95 cursor-pointer relative flex-shrink-0"
          >
            {user?.pictureUrl ? (
              <img
                src={user.pictureUrl}
                alt={user.name || 'User profile'}
                className="w-full h-full object-cover"
              />
            ) : isAuthenticated ? (
              <div className="w-full h-full bg-[#ff951f]/15 text-[#ff951f] flex items-center justify-center font-bold text-xs sm:text-sm font-mono">
                {user?.name ? user.name.charAt(0).toUpperCase() : '👤'}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-0.5 sm:gap-1 w-4 h-4 sm:w-5 sm:h-5 text-slate-700 dark:text-[#f4f5f7]">
                <span className="w-3.5 sm:w-4 h-0.5 bg-current rounded-full" />
                <span className="w-3.5 sm:w-4 h-0.5 bg-current rounded-full" />
                <span className="w-2 sm:w-2.5 h-0.5 bg-current rounded-full self-start" />
              </div>
            )}
            {isAuthenticated && (
              <span className={`absolute bottom-0.5 right-0.5 w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full border-2 border-white dark:border-[#10141c] ${
                user?.role === 'ADMIN' ? 'bg-[#ff951f]' : user?.role === 'CLIENT' ? 'bg-[#edcd8c]' : 'bg-[#ff951f]'
              }`} />
            )}
          </button>

          {/* Title pill with Dynamic City Selector */}
          <div className="relative min-w-0 flex-shrink" ref={cityDropdownRef}>
            <button
              type="button"
              onClick={() => setIsCityDropdownOpen(!isCityDropdownOpen)}
              className="flex items-center gap-1.5 sm:gap-2 bg-white/95 dark:bg-[#10141c] backdrop-blur-md px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full shadow-float border border-slate-200/80 dark:border-[#303139] hover:border-[#ff951f]/60 transition-colors duration-160 min-w-0 max-w-full cursor-pointer"
            >
              <span className="text-base sm:text-lg flex-shrink-0">🪔</span>
              <span className="font-medium text-xs sm:text-sm tracking-tight text-slate-800 dark:text-[#f4f5f7] flex-shrink-0">
                my<span className="text-[#ff951f] font-semibold">Cite</span>
              </span>
              <span aria-label="Location_City" className="text-[10px] font-mono font-medium uppercase tracking-wider bg-slate-100 dark:bg-[#101522] text-amber-700 dark:text-[#edcd8c] border border-slate-200 dark:border-[#303139] px-2 py-0.5 rounded-full flex items-center gap-0.5 min-w-0 max-w-[75px] sm:max-w-[130px]">
                <span className="truncate">{selectedCity}</span>
                <ChevronDown className="w-2.5 h-2.5 opacity-70 flex-shrink-0" />
              </span>
            </button>

            {/* City Selection Dropdown */}
            {isCityDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-52 bg-white dark:bg-[#10141c] rounded-[6px] shadow-2xl border border-slate-200 dark:border-[#303139] py-2 z-[2000] animate-in zoom-in-95">
                <div className="px-3 py-1.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-500 dark:text-[#c9ced8]/70 border-b border-slate-100 dark:border-[#303139] mb-1">
                  Select Market / City
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {CITIES.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        if (onSelectCity) onSelectCity(c);
                        setIsCityDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 text-xs font-medium flex items-center justify-between hover:bg-slate-50 dark:hover:bg-[#101522] transition-colors duration-160 cursor-pointer ${
                        selectedCity === c.id || selectedCity === c.name || (selectedCity === 'All Odisha' && c.id === 'ALL') || (selectedCity === 'ALL' && c.id === 'ALL')
                          ? 'text-[#ff951f] bg-slate-50 dark:bg-[#101522] font-semibold'
                          : 'text-slate-800 dark:text-[#f4f5f7]'
                      }`}
                    >
                      <span>{c.name}</span>
                      {(selectedCity === c.id || selectedCity === c.name || (selectedCity === 'All Odisha' && c.id === 'ALL')) && (
                        <span className="text-[#ff951f] text-xs font-mono">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right side buttons */}
        <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0 z-10">
          {/* Notifications Bell */}
          <button
            type="button"
            onClick={onOpenNotifications}
            aria-label="View notifications"
            title="Announcements & Notifications"
            className="relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-white/95 dark:bg-[#10141c] text-slate-700 dark:text-[#f4f5f7] shadow-float border border-slate-200/80 dark:border-[#303139] hover:border-[#ff951f]/60 hover:bg-slate-50 dark:hover:bg-[#101522] transition-colors duration-160 flex-shrink-0 cursor-pointer"
          >
            <Bell className="w-4 h-4 text-slate-500 dark:text-[#c9ced8]" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 bg-[#ff951f] text-[#07090e] rounded-full text-[9px] font-mono font-bold flex items-center justify-center shadow-xs">
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
            className={`w-9 h-9 sm:w-auto sm:min-w-[40px] sm:h-10 px-0 sm:px-3 flex items-center justify-center gap-1.5 rounded-full font-medium text-xs shadow-float transition-all duration-160 border flex-shrink-0 cursor-pointer ${
              isLocating
                ? 'bg-[#ff951f] text-[#07090e] font-bold animate-pulse border-[#ff951f]'
                : 'bg-white/95 dark:bg-[#10141c] text-slate-700 dark:text-[#f4f5f7] hover:border-[#ff951f]/60 hover:bg-slate-50 dark:hover:bg-[#101522] border-slate-200/80 dark:border-[#303139]'
            }`}
          >
            <Compass className={`w-4 h-4 ${isLocating ? 'animate-spin' : 'text-[#ff951f]'}`} />
            <span className="hidden sm:inline">Near me</span>
          </button>

          {/* Search Toggle */}
          <button
            type="button"
            onClick={handleToggleSearch}
            aria-label={showSearchInput ? 'Close search' : 'Open search'}
            title={showSearchInput ? 'Close search' : 'Open search'}
            className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full shadow-float border transition-all duration-160 flex-shrink-0 cursor-pointer ${
              showSearchInput
                ? 'bg-[#ff951f] text-[#07090e] border-[#ff951f]'
                : 'bg-white/95 dark:bg-[#10141c] text-slate-700 dark:text-[#f4f5f7] hover:border-[#ff951f]/60 hover:bg-slate-50 dark:hover:bg-[#101522] border-slate-200/80 dark:border-[#303139]'
            }`}
          >
            {showSearchInput ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expandable Search Input */}
      {showSearchInput && (
        <form
          onSubmit={handleSearchFormSubmit}
          className="pointer-events-auto bg-white/95 dark:bg-[#10141c] backdrop-blur-md rounded-full shadow-float px-3.5 py-1.5 border border-slate-200/80 dark:border-[#303139] flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-150 w-full"
        >
          {isSearching ? (
            <Loader2 className="w-4 h-4 text-[#ff951f] ml-1 flex-shrink-0 animate-spin" />
          ) : (
            <Search className="w-4 h-4 text-slate-400 dark:text-[#c9ced8] ml-1 flex-shrink-0" />
          )}
          <input
            ref={searchInputRef}
            type="search"
            name="search"
            enterKeyHint="search"
            autoComplete="off"
            aria-label="Search pandals, melas, stores, areas"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                if (searchQuery) {
                  onSearchChange('');
                } else {
                  setShowSearchInput(false);
                }
              }
            }}
            placeholder="Search pandals, melas, stores, areas..."
            className="w-full bg-transparent text-sm text-slate-800 dark:text-[#f4f5f7] placeholder:text-slate-400 dark:placeholder:text-[#c9ced8]/60 focus:outline-none py-1 font-sans"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                onSearchChange('');
                searchInputRef.current?.focus();
              }}
              aria-label="Clear search text"
              className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-[#101522] text-slate-400 dark:text-[#c9ced8] hover:text-slate-700 dark:hover:text-[#f4f5f7] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </form>
      )}

      {/* Horizontally scrollable filter chips */}
      <nav aria-label="Category filters" className="pointer-events-auto flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {FILTER_CHIPS.map((chip) => {
          const isSelected = selectedCategory === chip.id;
          return (
            <button
              key={chip.id}
              onClick={() => onSelectCategory(chip.id)}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex items-center gap-1.5 shadow-float transition-all duration-160 border cursor-pointer ${
                isSelected
                  ? 'bg-[#ff951f] text-[#07090e] border-[#ff951f] font-semibold scale-[1.02]'
                  : 'bg-white/95 dark:bg-[#10141c] text-slate-700 dark:text-[#c9ced8] hover:text-slate-900 dark:hover:text-[#f4f5f7] hover:border-[#ff951f]/50 border-slate-200/80 dark:border-[#303139]'
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