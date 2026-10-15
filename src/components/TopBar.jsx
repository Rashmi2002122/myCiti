import React, { useState, useRef, useEffect } from 'react';
import { Search, Compass, Sun, Moon, X, MapPin, ChevronDown } from 'lucide-react';
import { FILTER_CHIPS } from '../services/api';

export const CITIES = [
  { id: 'ALL', name: 'All India', lat: 20.5937, lng: 78.9629, zoom: 5 },
  { id: 'Kolkata', name: 'Kolkata', lat: 22.5726, lng: 88.3639, zoom: 12.5 },
  { id: 'Bhubaneswar', name: 'Bhubaneswar', lat: 20.2961, lng: 85.8245, zoom: 13 },
  { id: 'Cuttack', name: 'Cuttack', lat: 20.4625, lng: 85.8830, zoom: 13 },
  { id: 'Ranchi', name: 'Ranchi', lat: 23.3441, lng: 85.3096, zoom: 13 },
  { id: 'Patna', name: 'Patna', lat: 25.5941, lng: 85.1376, zoom: 13 },
  { id: 'Delhi', name: 'Delhi NCR', lat: 28.6139, lng: 77.2090, zoom: 12 },
  { id: 'Mumbai', name: 'Mumbai', lat: 19.0760, lng: 72.8777, zoom: 12 },
  { id: 'Bengaluru', name: 'Bengaluru', lat: 12.9716, lng: 77.5946, zoom: 12 },
  { id: 'Hyderabad', name: 'Hyderabad', lat: 17.3850, lng: 78.4867, zoom: 12 },
  { id: 'Chennai', name: 'Chennai', lat: 13.0827, lng: 80.2707, zoom: 12 },
  { id: 'Pune', name: 'Pune', lat: 18.5204, lng: 73.8567, zoom: 12 }
];

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
  onSelectCity
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
        {/* Title pill with Dynamic City Selector */}
        <div className="relative" ref={cityDropdownRef}>
          <button
            type="button"
            onClick={() => setIsCityDropdownOpen(!isCityDropdownOpen)}
            className="flex items-center gap-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3.5 py-2.5 rounded-full shadow-float border border-white/60 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors"
          >
            <span className="text-xl">🪔</span>
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
                    {selectedCity === c.id && <span className="text-city-blue text-xs">✓</span>}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right side buttons */}
        <div className="flex items-center gap-2">
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
