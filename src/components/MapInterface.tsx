
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MapPin, LogOut, Settings, Download } from 'lucide-react';
import { toast } from 'sonner';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { AlertPopup } from '@/components/AlertPopup';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { MapTokenSetup } from '@/components/MapTokenSetup';
import { SearchBar } from '@/components/SearchBar';
import { CoordinateDisplay } from '@/components/CoordinateDisplay';
import { ManualCoordinateEntry } from '@/components/ManualCoordinateEntry';
import { MapContainer } from '@/components/MapContainer';
import { useMapAlerts } from '@/hooks/useMapAlerts';
import { useMapSearch } from '@/hooks/useMapSearch';
import { useMapInteraction } from '@/hooks/useMapInteraction';
import { useTranslation } from 'react-i18next';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface Coordinates {
  lat: number;
  lng: number;
}

interface MapInterfaceProps {
  onCoordinatesSet: (coordinates: Coordinates) => void;
  onLogout: () => void;
  coordinates: Coordinates | null;
  credentials?: any;
  projects?: any[];
}

// Default Mapbox token
const DEFAULT_MAPBOX_TOKEN = 'pk.eyJ1IjoibHVhbmRybyIsImEiOiJjanY2djRpdnkwOWdqM3lwZzVuaGIxa3VsIn0.jamcK2t2I1j3TXkUQFIsjQ';

export const MapInterface = ({ onCoordinatesSet, onLogout, coordinates, credentials, projects = [] }: MapInterfaceProps) => {
  const { t } = useTranslation();
  const [selectedCoords, setSelectedCoords] = useState<Coordinates | null>(coordinates);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [mapboxToken, setMapboxToken] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(false);
  
  const { isInstallable, installApp } = usePWAInstall();

  // Check for environment variable or use default token
  useEffect(() => {
    const envToken = import.meta.env.VITE_MAPBOX_TOKEN;
    if (envToken && envToken.trim()) {
      setMapboxToken(envToken);
      setShowTokenInput(false);
    } else {
      setMapboxToken(DEFAULT_MAPBOX_TOKEN);
      setShowTokenInput(false);
    }
  }, []);

  useEffect(() => {
    if (coordinates) {
      setSelectedCoords(coordinates);
    }
  }, [coordinates]);

  const handleCoordinatesChange = (coords: Coordinates) => {
    setSelectedCoords(coords);
  };

  const { mapRef, mapInstanceRef, markerRef, isMapLoaded } = useMapInteraction(
    mapboxToken,
    selectedCoords,
    handleCoordinatesChange
  );

  const {
    alerts,
    selectedAlert,
    setSelectedAlert,
    isLoadingAlerts,
    loadAlerts,
    cleanupMarkers
  } = useMapAlerts(credentials, projects, mapInstanceRef);

  const {
    searchQuery,
    setSearchQuery,
    isSearching,
    recentSearches,
    searchInputRef,
    handleSearch,
    handleClearSearch
  } = useMapSearch(mapInstanceRef.current, markerRef, handleCoordinatesChange);

  // Load alerts when map loads and credentials are available
  useEffect(() => {
    if (isMapLoaded && credentials && projects.length > 0) {
      loadAlerts();
    }
  }, [isMapLoaded, credentials, projects]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupMarkers();
    };
  }, []);

  const handleTokenSubmit = () => {
    setShowTokenInput(false);
  };

  const handleManualCoords = (coords: Coordinates) => {
    setSelectedCoords(coords);
    
    // Update map center and marker
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo({
        center: [coords.lng, coords.lat],
        zoom: 10
      });
      
      if (markerRef.current) {
        markerRef.current.remove();
      }
      
      markerRef.current = new mapboxgl.Marker({
        color: '#ef4444'
      })
        .setLngLat([coords.lng, coords.lat])
        .addTo(mapInstanceRef.current);
    }
  };

  const handleRecentSearchClick = (search: string) => {
    setSearchQuery(search);
    handleSearch();
  };

  const handleContinue = () => {
    if (!selectedCoords) {
      toast.error(t('map.pleaseSelectCoordinates'));
      return;
    }
    
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 100, 50]);
    }
    
    onCoordinatesSet(selectedCoords);
  };

  if (showTokenInput) {
    return (
      <MapTokenSetup
        mapboxToken={mapboxToken}
        setMapboxToken={setMapboxToken}
        onTokenSubmit={handleTokenSubmit}
        onLogout={onLogout}
      />
    );
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <MapContainer
        mapRef={mapRef}
        mapInstance={mapInstanceRef.current}
        marker={markerRef.current}
        selectedCoords={selectedCoords}
        isMapLoaded={isMapLoaded}
      />
      
      {/* Mobile-optimized floating header with safe area */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div 
          className="flex justify-between items-center px-4 py-3 h-16"
          style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
        >
          <h1 className="text-lg font-bold text-gray-800">{t('app.title')}</h1>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            {isInstallable && (
              <Button
                variant="outline"
                size="sm"
                onClick={installApp}
                className="flex items-center gap-1 h-11 min-w-[44px]"
                aria-label={t('common.installApp')}
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">{t('common.install')}</span>
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onLogout} 
              className="flex items-center gap-1 h-11 min-w-[44px]"
              aria-label={t('projects.logout')}
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">{t('projects.logout')}</span>
            </Button>
          </div>
        </div>
      </div>
      
      {/* Enhanced search bar with recent searches */}
      <SearchBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isSearching={isSearching}
        recentSearches={recentSearches}
        searchInputRef={searchInputRef}
        onSearch={handleSearch}
        onClearSearch={handleClearSearch}
        onRecentSearchClick={handleRecentSearchClick}
      />
      
      {/* Mobile FAB for manual entry - larger touch target */}
      <div className="absolute top-36 right-4 z-10 md:top-24">
        <Button
          onClick={() => setShowManualEntry(true)}
          className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg md:w-auto md:h-auto md:rounded-lg md:px-4 md:py-2"
          aria-label="Manual coordinate entry"
        >
          <Settings className="w-6 h-6 md:w-4 md:h-4" />
          <span className="hidden md:inline md:ml-2">{t('map.manualEntry')}</span>
        </Button>
      </div>
      
      {/* Enhanced bottom sheet for manual entry */}
      <ManualCoordinateEntry
        isOpen={showManualEntry}
        onClose={() => setShowManualEntry(false)}
        coordinates={selectedCoords}
        onCoordinatesSet={handleManualCoords}
      />
      
      {/* Enhanced coordinates display with safe area padding */}
      {selectedCoords && (
        <CoordinateDisplay
          coordinates={selectedCoords}
          onContinue={handleContinue}
        />
      )}

      {/* Alert Popup */}
      {selectedAlert && (
        <AlertPopup
          alert={selectedAlert}
          onClose={() => setSelectedAlert(null)}
        />
      )}
    </div>
  );
};
