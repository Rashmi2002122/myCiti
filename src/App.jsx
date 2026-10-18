import React, { useState, useEffect, useCallback, useMemo, useRef, lazy, Suspense } from 'react';
import { MapPin, X, Bell } from 'lucide-react';
import TopBar, { CITIES } from './components/TopBar';
import MapView from './components/MapView';
import BottomSheet from './components/BottomSheet';
import BottomNav from './components/BottomNav';
import HomeView from './components/HomeView';
import SavedView from './components/SavedView';
import { useAuth } from './context/AuthContext';
import {
  fetchListings,
  fetchListingById,
  fetchActiveAds,
  fetchMyNotifications
} from './services/api';
import AddToHomeScreenBanner from './components/AddToHomeScreenBanner';
import InstallGuideModal from './components/InstallGuideModal';
import SplashScreen from './components/SplashScreen';
import { reverseGeocodeCity } from './utils/locationUtils';
import { registerPushSubscription } from './utils/pushUtils';

const AdminModal = lazy(() => import('./components/AdminModal'));
const LoginModal = lazy(() => import('./components/LoginModal'));
const CompleteProfileModal = lazy(() => import('./components/CompleteProfileModal'));
const AccountMenuModal = lazy(() => import('./components/AccountMenuModal'));
const MyPostsDashboard = lazy(() => import('./components/MyPostsDashboard'));
const PostAdvertisementModal = lazy(() => import('./components/PostAdvertisementModal'));
const NotificationCenterModal = lazy(() => import('./components/NotificationCenterModal'));
const CreateCampaignModal = lazy(() => import('./components/CreateCampaignModal'));
const CreateAnnouncementModal = lazy(() => import('./components/CreateAnnouncementModal'));
const CampaignsDashboardModal = lazy(() => import('./components/CampaignsDashboardModal'));

const SAVED_STORAGE_KEY = 'myciti_saved_listings';

export default function App() {
  const { user, accessToken, isAuthenticated, isAdmin, isClient, canPost, isConsumer, isProfileComplete, handleLogout, syncLocation } = useAuth();
  const [listings, setListings] = useState([]);
  const [selectedListing, setSelectedListing] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('map'); // 'home' | 'map' | 'saved'
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isCompleteProfileOpen, setIsCompleteProfileOpen] = useState(false);
  const [isMyPostsOpen, setIsMyPostsOpen] = useState(false);
  const [isPostAdOpen, setIsPostAdOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [activePopupNotification, setActivePopupNotification] = useState(null);
  const [isCreateCampaignOpen, setIsCreateCampaignOpen] = useState(false);
  const [campaignListingId, setCampaignListingId] = useState(null);
  const [isCreateAnnouncementOpen, setIsCreateAnnouncementOpen] = useState(false);
  const [isCampaignsDashboardOpen, setIsCampaignsDashboardOpen] = useState(false);
  const [activeAds, setActiveAds] = useState([]);
  const [editingSubmission, setEditingSubmission] = useState(null);
  const [selectedCity, setSelectedCity] = useState(() => {
    try {
      return localStorage.getItem('myciti_selected_city') || 'Kolkata';
    } catch {
      return 'Kolkata';
    }
  });
  const [mapCenter, setMapCenter] = useState(() => {
    try {
      const savedCityName = localStorage.getItem('myciti_selected_city') || 'Kolkata';
      const match = CITIES.find((c) => c.name.toLowerCase() === savedCityName.toLowerCase());
      if (match) return { lat: match.lat, lng: match.lng, zoom: match.zoom || 12 };
    } catch {}
    return { lat: 22.5726, lng: 88.3639, zoom: 12 };
  });
  const [locationToast, setLocationToast] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [savedIds, setSavedIds] = useState(() => {
    try {
      const stored = localStorage.getItem(SAVED_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Full-screen Splash Screen (once per session, force with ?splash=1)
  const [showSplash, setShowSplash] = useState(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    if (params.get('splash') === '1') return true;
    return !sessionStorage.getItem('myciti_splash_shown');
  });

  const handleSplashComplete = useCallback(() => {
    sessionStorage.setItem('myciti_splash_shown', 'true');
    setShowSplash(false);
  }, []);

  // Sync dark mode class on document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Save/unsave handler
  const handleToggleSave = useCallback((listingId) => {
    setSavedIds((prev) => {
      const exists = prev.includes(listingId);
      const next = exists ? prev.filter((id) => id !== listingId) : [...prev, listingId];
      try {
        localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.error('Failed to save to localStorage', e);
      }
      return next;
    });
  }, []);

  // Universal Share Handler (Web Share API + fallback copy link)
  const handleShare = useCallback(async (listing) => {
    const shareUrl = `${window.location.origin}/?listingId=${listing.id}`;
    const shareData = {
      title: `${listing.title} - myCiti`,
      text: `${listing.title} (${listing.category})\n📍 ${listing.landmark}, ${listing.address}`,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      alert(`Link copied to clipboard!\n${shareUrl}`);
    } catch {
      prompt('Copy link to share:', shareUrl);
    }
  }, []);

  // Load listings from API with active filters & distance
  const loadListings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchListings({
        category: selectedCategory,
        city: selectedCity,
        q: searchQuery,
        lat: userLocation ? userLocation.lat : null,
        lng: userLocation ? userLocation.lng : null,
      });
      setListings(data);
    } catch (err) {
      console.error(err);
      setError('Unable to load listings. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, selectedCity, searchQuery, userLocation]);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  // Load active geo-targeted ads
  const loadActiveAds = useCallback(async () => {
    try {
      const ads = await fetchActiveAds({
        lat: userLocation ? userLocation.lat : null,
        lng: userLocation ? userLocation.lng : null,
        city: selectedCity
      });
      setActiveAds(ads || []);
    } catch (e) {
      console.warn('Failed to load active ads:', e);
    }
  }, [userLocation, selectedCity]);

  useEffect(() => {
    loadActiveAds();
  }, [loadActiveAds]);

  // Ref to track known notifications and trigger system alerts for brand new ones
  const knownNotificationIdsRef = useRef(new Set(
    (() => {
      try {
        const stored = sessionStorage.getItem('myciti_seen_notif_ids');
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    })()
  ));

  // Check and poll notifications for logged in user
  const checkNotifications = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setUnreadNotificationsCount(0);
      return;
    }
    const token = accessToken || localStorage.getItem('myciti_access_token');
    if (!token) return;
    try {
      const data = await fetchMyNotifications(token);
      const list = Array.isArray(data) ? data : [];
      const unreadList = list.filter((n) => !(n.read ?? n.isRead));
      setUnreadNotificationsCount(unreadList.length);

      // Find brand new announcements that have not been seen yet
      const brandNew = unreadList.filter((n) => {
        if (knownNotificationIdsRef.current.has(n.id)) return false;
        if (knownNotificationIdsRef.current.size > 0) return true;
        // Fresh session: only alert if created within last 2 hours
        if (n.createdAt) {
          const ageMs = Date.now() - new Date(n.createdAt).getTime();
          return ageMs < 2 * 60 * 60 * 1000;
        }
        return true;
      });

      // Show in-app visual popup immediately
      if (brandNew.length > 0) {
        setActivePopupNotification(brandNew[0]);
      }

      // Also trigger native phone notification bar alert if permission is granted
      if (
        typeof window !== 'undefined' &&
        'Notification' in window &&
        Notification.permission === 'granted'
      ) {
        for (const notif of brandNew) {
          if ('serviceWorker' in navigator) {
            try {
              const reg = await navigator.serviceWorker.ready;
              await reg.showNotification(notif.title || 'myCiti Announcement', {
                body: notif.message || notif.body,
                icon: '/icon.svg',
                badge: '/icon.svg',
                tag: `myciti-${notif.id}`,
                data: { url: notif.actionUrl || '/' },
                renotify: true
              });
            } catch (err) {
              console.warn('[Notification] Error showing system notification:', err);
            }
          }
        }
      }

      list.forEach((n) => knownNotificationIdsRef.current.add(n.id));
      try {
        sessionStorage.setItem('myciti_seen_notif_ids', JSON.stringify([...knownNotificationIdsRef.current]));
      } catch {}
    } catch (e) {
      console.warn('Failed to check notifications:', e);
    }
  }, [isAuthenticated, user, accessToken]);

  useEffect(() => {
    checkNotifications();
    const interval = setInterval(checkNotifications, 20000); // Poll every 20s for fresh announcements
    const onFocus = () => checkNotifications();
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [checkNotifications]);

  // Auto-sync Web Push subscription when user is authenticated and permission is granted
  useEffect(() => {
    if (isAuthenticated && accessToken && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      registerPushSubscription(accessToken).catch(() => {});
    }
  }, [isAuthenticated, accessToken]);

  // Auto-dismiss in-app notification popup after 10 seconds
  useEffect(() => {
    if (!activePopupNotification) return;
    const timer = setTimeout(() => {
      setActivePopupNotification(null);
    }, 10000);
    return () => clearTimeout(timer);
  }, [activePopupNotification]);

  const handleSelectListing = useCallback((listing) => {
    setSelectedListing(listing);
  }, []);

  const sponsoredListingIds = useMemo(() => {
    return activeAds
      .map((a) => a.listingId)
      .filter((id) => id != null);
  }, [activeAds]);

  // Auto-open Complete Profile modal if Client/Admin is logged in with incomplete profile
  useEffect(() => {
    if (isAuthenticated && canPost && !isProfileComplete) {
      setIsCompleteProfileOpen(true);
    }
  }, [isAuthenticated, canPost, isProfileComplete]);

  // Route guards & URL handlers (/admin requires ADMIN; /account requires login)
  useEffect(() => {
    const path = window.location.pathname;
    const hash = window.location.hash;

    if (path === '/admin' || hash === '#admin') {
      if (!isAuthenticated) {
        setIsLoginOpen(true);
      } else if (!isAdmin) {
        alert('Access denied: Admin permissions required.');
        window.history.pushState({}, '', '/');
      } else {
        setIsAdminOpen(true);
      }
    } else if (path === '/account' || hash === '#account') {
      if (!isAuthenticated) {
        setIsLoginOpen(true);
      } else if (canPost && !isProfileComplete) {
        setIsCompleteProfileOpen(true);
      } else {
        setIsAccountMenuOpen(true);
      }
    }

    const params = new URLSearchParams(window.location.search);
    const listingId = params.get('listingId');
    if (listingId) {
      fetchListingById(listingId)
        .then((data) => setSelectedListing(data))
        .catch((err) => console.error('Failed to load shared listing', err));
    }
  }, [isAuthenticated, isAdmin, isProfileComplete]);

  // Handler for explicit city selection from TopBar dropdown
  const handleSelectCity = useCallback(
    (cityObj) => {
      const oldCity = selectedCity;
      const newCity = cityObj.name;
      setSelectedCity(newCity);
      setMapCenter({ lat: cityObj.lat, lng: cityObj.lng, zoom: cityObj.zoom || 12 });
      localStorage.setItem('myciti_selected_city', newCity);
      localStorage.setItem('myciti_user_lat', String(cityObj.lat));
      localStorage.setItem('myciti_user_lng', String(cityObj.lng));

      if (oldCity !== newCity) {
        setLocationToast(`Location updated to ${newCity}`);
      }

      if (syncLocation) {
        syncLocation({
          latitude: cityObj.lat,
          longitude: cityObj.lng,
          city: newCity,
        });
      }
    },
    [selectedCity, syncLocation]
  );

  // Near Me handler (Request GPS position and reverse-geocode/store city)
  const handleNearMe = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setUserLocation(coords);
        setMapCenter({ ...coords, zoom: 14 });
        setIsLocating(false);

        const detectedCity = await reverseGeocodeCity(coords.lat, coords.lng);
        if (detectedCity) {
          const oldCity = selectedCity;
          setSelectedCity(detectedCity);
          localStorage.setItem('myciti_selected_city', detectedCity);
          localStorage.setItem('myciti_user_lat', String(coords.lat));
          localStorage.setItem('myciti_user_lng', String(coords.lng));

          if (oldCity !== detectedCity) {
            setLocationToast(`Location updated to ${detectedCity}`);
          } else {
            setLocationToast(`Location refreshed: ${detectedCity}`);
          }

          if (syncLocation) {
            syncLocation({
              latitude: coords.lat,
              longitude: coords.lng,
              city: detectedCity,
            });
          }
        }
      },
      (err) => {
        console.warn('Geolocation error or denied:', err);
        alert('Could not access your location. Please check your browser location permissions.');
        setIsLocating(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }, [selectedCity, syncLocation]);

  // Auto-fetch user location on startup and store in database
  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) return;

    const fetchAndStoreLocation = () => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setUserLocation({ lat, lng });

          localStorage.setItem('myciti_user_lat', String(lat));
          localStorage.setItem('myciti_user_lng', String(lng));

          const detectedCity = await reverseGeocodeCity(lat, lng);
          const currentSavedCity = localStorage.getItem('myciti_selected_city');

          if (detectedCity && detectedCity !== currentSavedCity) {
            setSelectedCity(detectedCity);
            localStorage.setItem('myciti_selected_city', detectedCity);
            setLocationToast(`Location updated to ${detectedCity}`);

            const match = CITIES.find((c) => c.name.toLowerCase() === detectedCity.toLowerCase());
            if (match) {
              setMapCenter({ lat: match.lat, lng: match.lng, zoom: match.zoom || 12 });
            }
          }

          if (syncLocation) {
            syncLocation({
              latitude: lat,
              longitude: lng,
              city: detectedCity || selectedCity,
            });
          }
        },
        (err) => {
          // Geolocation not granted; sync stored city for authenticated user
          const savedCity = localStorage.getItem('myciti_selected_city') || selectedCity;
          const cityObj = CITIES.find((c) => c.name.toLowerCase() === savedCity.toLowerCase()) || CITIES[1];
          if (syncLocation) {
            syncLocation({
              latitude: cityObj.lat,
              longitude: cityObj.lng,
              city: savedCity,
            });
          }
        },
        { timeout: 8000, maximumAge: 300000 }
      );
    };

    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' }).then((status) => {
        if (status.state === 'granted' || status.state === 'prompt') {
          fetchAndStoreLocation();
        }
      }).catch(() => {
        fetchAndStoreLocation();
      });
    } else {
      fetchAndStoreLocation();
    }
  }, [syncLocation]);

  // Sync stored location when user logs in
  useEffect(() => {
    if (isAuthenticated && syncLocation) {
      const savedCity = localStorage.getItem('myciti_selected_city') || selectedCity;
      const savedLat = parseFloat(localStorage.getItem('myciti_user_lat')) || null;
      const savedLng = parseFloat(localStorage.getItem('myciti_user_lng')) || null;
      const cityObj = CITIES.find((c) => c.name.toLowerCase() === savedCity.toLowerCase()) || CITIES[1];

      syncLocation({
        latitude: savedLat || cityObj.lat,
        longitude: savedLng || cityObj.lng,
        city: savedCity,
      });
    }
  }, [isAuthenticated, syncLocation]);

  // Auto-dismiss location toast after 3.5 seconds
  useEffect(() => {
    if (!locationToast) return;
    const timer = setTimeout(() => {
      setLocationToast(null);
    }, 3500);
    return () => clearTimeout(timer);
  }, [locationToast]);

  return (
    <div className="fixed inset-0 w-full h-full h-[100dvh] overflow-hidden bg-transparent dark:bg-slate-950">
      {/* Top Floating Controls */}
      <TopBar
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onNearMeClick={handleNearMe}
        isLocating={isLocating}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        selectedCity={selectedCity}
        onSelectCity={handleSelectCity}
        unreadCount={unreadNotificationsCount}
        onOpenNotifications={() => {
          if (!isAuthenticated) {
            setIsLoginOpen(true);
          } else {
            setIsNotificationsOpen(true);
          }
        }}
      />

      {/* Main Views */}
      <main className="w-full h-full relative">
        <div className={`w-full h-full ${activeTab === 'map' ? 'block' : 'hidden'}`}>
          <MapView
            listings={listings}
            onSelectListing={handleSelectListing}
            userLocation={userLocation}
            targetCity={mapCenter}
            darkMode={darkMode}
            sponsoredListingIds={sponsoredListingIds}
            isVisible={activeTab === 'map'}
          />
        </div>

        {activeTab === 'home' && (
          <HomeView
            listings={listings}
            onSelectListing={handleSelectListing}
            savedIds={savedIds}
            onToggleSave={handleToggleSave}
            onShare={handleShare}
            userLocation={userLocation}
            onNearMeClick={handleNearMe}
            isLocating={isLocating}
            selectedCity={selectedCity}
          />
        )}

        {activeTab === 'saved' && (
          <SavedView
            listings={listings}
            savedIds={savedIds}
            onSelectListing={handleSelectListing}
            onToggleSave={handleToggleSave}
            onShare={handleShare}
            onExploreClick={() => setActiveTab('map')}
          />
        )}
      </main>

      {/* Location Updated Popup Toast */}
      {locationToast && (
        <div className="fixed top-24 sm:top-28 left-1/2 -translate-x-1/2 z-[1100] animate-bounce-in flex items-center gap-2.5 bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-900 px-4 py-2.5 rounded-full shadow-2xl border border-white/20 dark:border-slate-800 backdrop-blur-md transition-all duration-300 pointer-events-auto">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500 text-white text-xs flex-shrink-0">
            <MapPin className="w-3.5 h-3.5" />
          </span>
          <span className="text-xs font-bold tracking-tight whitespace-nowrap">
            {locationToast}
          </span>
          <button
            type="button"
            onClick={() => setLocationToast(null)}
            className="ml-1 p-0.5 text-slate-400 hover:text-white dark:hover:text-slate-800 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-full shadow-float border border-white/60 dark:border-slate-800 flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-city-blue border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Updating listings...</span>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[1000] bg-rose-500 text-white px-4 py-2 rounded-full shadow-float text-xs font-semibold flex items-center gap-2">
          <span>{error}</span>
          <button onClick={loadListings} className="underline font-bold ml-1">Retry</button>
        </div>
      )}

      {/* Bottom Sheet Detail */}
      {selectedListing && (
        <BottomSheet
          listing={selectedListing}
          onClose={() => setSelectedListing(null)}
          isSaved={savedIds.includes(selectedListing.id)}
          onToggleSave={handleToggleSave}
        />
      )}

      {/* Floating Bottom Nav */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        user={user}
        isAuthenticated={isAuthenticated}
        onAccountClick={() => {
          if (!isAuthenticated) {
            setIsLoginOpen(true);
          } else {
            setIsAccountMenuOpen(true);
          }
        }}
      />

      {/* Lazy Loaded Modals */}
      <Suspense fallback={null}>
        {isAdminOpen && (
          <AdminModal
            isOpen={isAdminOpen}
            onClose={() => setIsAdminOpen(false)}
            onListingChanged={loadListings}
            onOpenCreateAnnouncement={() => setIsCreateAnnouncementOpen(true)}
          />
        )}

        {isLoginOpen && (
          <LoginModal
            isOpen={isLoginOpen}
            onClose={() => setIsLoginOpen(false)}
          />
        )}

        {isAccountMenuOpen && (
          <AccountMenuModal
            isOpen={isAccountMenuOpen}
            onClose={() => setIsAccountMenuOpen(false)}
            onOpenCompleteProfile={() => setIsCompleteProfileOpen(true)}
            onOpenAdminPanel={() => setIsAdminOpen(true)}
            onOpenMyPosts={() => {
              if (!canPost) {
                setIsCompleteProfileOpen(true);
              } else {
                setIsMyPostsOpen(true);
              }
            }}
            onOpenPostAd={() => {
              if (!canPost) {
                setIsCompleteProfileOpen(true);
              } else {
                setEditingSubmission(null);
                setIsPostAdOpen(true);
              }
            }}
            onOpenCampaigns={() => setIsCampaignsDashboardOpen(true)}
            darkMode={darkMode}
            onToggleDarkMode={() => setDarkMode(!darkMode)}
          />
        )}

        {isCompleteProfileOpen && (
          <CompleteProfileModal
            isOpen={isCompleteProfileOpen}
            onClose={() => setIsCompleteProfileOpen(false)}
          />
        )}

        {isMyPostsOpen && (
          <MyPostsDashboard
            isOpen={isMyPostsOpen}
            onClose={() => setIsMyPostsOpen(false)}
            onOpenPostForm={(submissionToEdit) => {
              setEditingSubmission(submissionToEdit || null);
              setIsPostAdOpen(true);
            }}
            onOpenCreateCampaign={(listingId) => {
              setCampaignListingId(listingId);
              setIsCreateCampaignOpen(true);
            }}
            onViewOnMap={async (listingId) => {
              try {
                const listing = await fetchListingById(listingId);
                setSelectedListing(listing);
                setActiveTab('map');
              } catch (e) {
                console.error('Failed to view listing on map:', e);
              }
            }}
          />
        )}

        {isPostAdOpen && (
          <PostAdvertisementModal
            isOpen={isPostAdOpen}
            onClose={() => {
              setIsPostAdOpen(false);
              setEditingSubmission(null);
            }}
            editingSubmission={editingSubmission}
            onSuccess={() => {
              setIsMyPostsOpen(true);
            }}
          />
        )}

        {/* Real-time In-App Notification Toast / Popup */}
        {activePopupNotification && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[4000] max-w-sm w-[92%] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-sky-300 dark:border-slate-700 p-4 animate-in slide-in-from-top-4 duration-300 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-city-blue/10 dark:bg-sky-500/20 text-city-blue dark:text-sky-400 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 truncate">
                  {activePopupNotification.title || 'Community Announcement'}
                </h4>
                <button
                  onClick={() => setActivePopupNotification(null)}
                  className="w-6 h-6 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  aria-label="Dismiss alert"
                >
                  <X className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                {activePopupNotification.message || activePopupNotification.body}
              </p>
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-medium">Just now</span>
                <button
                  onClick={() => {
                    setActivePopupNotification(null);
                    setIsNotificationsOpen(true);
                  }}
                  className="text-xs font-bold text-city-blue dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>View Details</span>
                  <span>&rarr;</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {isNotificationsOpen && (
          <NotificationCenterModal
            isOpen={isNotificationsOpen}
            onClose={() => setIsNotificationsOpen(false)}
            onSelectListingId={async (listingId) => {
              try {
                const listing = await fetchListingById(listingId);
                setSelectedListing(listing);
                setActiveTab('map');
              } catch (e) {
                console.error('Failed to view listing:', e);
              }
            }}
            onUnreadCountChanged={setUnreadNotificationsCount}
          />
        )}

        {isCreateCampaignOpen && (
          <CreateCampaignModal
            isOpen={isCreateCampaignOpen}
            onClose={() => {
              setIsCreateCampaignOpen(false);
              setCampaignListingId(null);
            }}
            initialListingId={campaignListingId}
            onCampaignCreated={() => {
              loadActiveAds();
              setIsCampaignsDashboardOpen(true);
            }}
          />
        )}

        {isCreateAnnouncementOpen && (
          <CreateAnnouncementModal
            isOpen={isCreateAnnouncementOpen}
            onClose={() => setIsCreateAnnouncementOpen(false)}
            initialListingId={campaignListingId}
            onAnnouncementCreated={() => {
              setIsCampaignsDashboardOpen(true);
            }}
          />
        )}

        {isCampaignsDashboardOpen && (
          <CampaignsDashboardModal
            isOpen={isCampaignsDashboardOpen}
            onClose={() => setIsCampaignsDashboardOpen(false)}
            onOpenCreateCampaign={() => setIsCreateCampaignOpen(true)}
            onOpenCreateAnnouncement={() => setIsCreateAnnouncementOpen(true)}
          />
        )}
      </Suspense>

      {/* Add to Home Screen Banner & iOS / Desktop Guide Modal */}
      <AddToHomeScreenBanner />
      <InstallGuideModal />

      {/* Full-Screen Animated Splash Screen (once per session, force with ?splash=1) */}
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
    </div>
  );
}
