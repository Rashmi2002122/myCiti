import React, { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import TopBar from './components/TopBar';
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
  const { user, isAuthenticated, isAdmin, isClient, canPost, isConsumer, isProfileComplete, handleLogout } = useAuth();
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
  const [isCreateCampaignOpen, setIsCreateCampaignOpen] = useState(false);
  const [campaignListingId, setCampaignListingId] = useState(null);
  const [isCreateAnnouncementOpen, setIsCreateAnnouncementOpen] = useState(false);
  const [isCampaignsDashboardOpen, setIsCampaignsDashboardOpen] = useState(false);
  const [activeAds, setActiveAds] = useState([]);
  const [editingSubmission, setEditingSubmission] = useState(null);
  const [selectedCity, setSelectedCity] = useState('Kolkata');
  const [mapCenter, setMapCenter] = useState({ lat: 22.5726, lng: 88.3639, zoom: 12 });
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
  const knownNotificationIdsRef = useRef(new Set());

  // Check and poll notifications for logged in user
  const checkNotifications = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setUnreadNotificationsCount(0);
      return;
    }
    const token = localStorage.getItem('myciti_token');
    if (!token) return;
    try {
      const data = await fetchMyNotifications(token);
      const list = data || [];
      const unreadList = list.filter((n) => !n.isRead);
      setUnreadNotificationsCount(unreadList.length);

      // Trigger native phone notification bar alert for new unread notifications
      if (
        knownNotificationIdsRef.current.size > 0 &&
        typeof window !== 'undefined' &&
        'Notification' in window &&
        Notification.permission === 'granted'
      ) {
        const brandNew = unreadList.filter((n) => !knownNotificationIdsRef.current.has(n.id));
        for (const notif of brandNew) {
          if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.ready.then((reg) => {
              reg.showNotification(notif.title || 'myCiti Announcement', {
                body: notif.message,
                icon: '/icon.svg',
                badge: '/icon.svg',
                tag: `myciti-${notif.id}`,
                data: { url: notif.actionUrl || '/' },
                renotify: true
              });
            }).catch(() => {});
          } else {
            new Notification(notif.title || 'myCiti Announcement', {
              body: notif.message,
              icon: '/icon.svg'
            });
          }
        }
      }

      list.forEach((n) => knownNotificationIdsRef.current.add(n.id));
    } catch (e) {
      console.warn('Failed to check notifications:', e);
    }
  }, [isAuthenticated, user]);

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

  const sponsoredListingIds = activeAds
    .map((a) => a.listingId)
    .filter((id) => id != null);

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

  // Near Me handler (Request geolocation ONLY on click)
  const handleNearMe = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setUserLocation(coords);
        setMapCenter({ ...coords, zoom: 14 });
        setIsLocating(false);
      },
      (err) => {
        console.warn('Geolocation error or denied:', err);
        alert('Could not access your location. Please check your browser location permissions.');
        setIsLocating(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

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
        onSelectCity={(cityObj) => {
          setSelectedCity(cityObj.name);
          setMapCenter({ lat: cityObj.lat, lng: cityObj.lng, zoom: 12 });
        }}
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
        {activeTab === 'map' && (
          <MapView
            listings={listings}
            onSelectListing={(listing) => setSelectedListing(listing)}
            userLocation={userLocation}
            targetCity={mapCenter}
            darkMode={darkMode}
            sponsoredListingIds={sponsoredListingIds}
          />
        )}

        {activeTab === 'home' && (
          <HomeView
            listings={listings}
            onSelectListing={(listing) => setSelectedListing(listing)}
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
            onSelectListing={(listing) => setSelectedListing(listing)}
            onToggleSave={handleToggleSave}
            onShare={handleShare}
            onExploreClick={() => setActiveTab('map')}
          />
        )}
      </main>

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
