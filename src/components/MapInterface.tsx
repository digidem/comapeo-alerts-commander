import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { LogOut, Settings, Download, Search } from "lucide-react";
import { toast } from "sonner";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { useIsMobile } from "@/hooks/use-mobile";
import { AlertPopup } from "@/components/AlertPopup";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { MapTokenSetup } from "@/components/MapTokenSetup";
import { SearchBar } from "@/components/SearchBar";
import { CoordinateDisplay } from "@/components/CoordinateDisplay";
import { ManualCoordinateEntry } from "@/components/ManualCoordinateEntry";
import { MapContainer } from "@/components/MapContainer";
import { ProjectSelector } from "@/components/ProjectSelector";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { useMapAlerts } from "@/hooks/useMapAlerts";
import { useMapSearch } from "@/hooks/useMapSearch";
import { useMapInteraction } from "@/hooks/useMapInteraction";
import { useTranslation } from "react-i18next";
import mapboxgl from "mapbox-gl";
import maplibregl from "maplibre-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import "maplibre-gl/dist/maplibre-gl.css";
import { Credentials, Project, Coordinates } from "@/types/common";

interface MapInterfaceProps {
  onCoordinatesSet: (
    coordinates: Coordinates,
    currentSelectedProjectId?: string,
  ) => void;
  onLogout: () => void;
  coordinates: Coordinates | null;
  credentials?: Credentials;
  projects?: Project[];
  isLoadingProjects?: boolean;
}

export const MapInterface = ({
  onCoordinatesSet,
  onLogout,
  coordinates,
  credentials,
  projects = [],
  isLoadingProjects = false,
}: MapInterfaceProps) => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [selectedCoords, setSelectedCoords] = useState<Coordinates | null>(
    coordinates,
  );
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  // Initialize mapboxToken directly from environment to avoid async timing issues
  const [mapboxToken, setMapboxToken] = useState(() => {
    const envToken = import.meta.env.VITE_MAPBOX_TOKEN;
    return envToken && envToken.trim() ? envToken : "";
  });
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(() => {
    if (projects.length > 0) {
      const savedProjectId = localStorage.getItem("selectedProjectId");
      const savedProject = savedProjectId
        ? projects.find((p) => p.projectId === savedProjectId)
        : null;
      return savedProject || projects[0];
    }
    return null;
  });
  const projectInitializedRef = useRef(false);

  const { isInstallable, installApp } = usePWAInstall();

  // Initialize selected project when projects first load (only once)
  useEffect(() => {
    if (projects.length > 0 && !projectInitializedRef.current) {
      const savedProjectId = localStorage.getItem("selectedProjectId");
      const savedProject = savedProjectId
        ? projects.find((p) => p.projectId === savedProjectId)
        : null;

      // Use saved project if found, otherwise default to first project
      const projectToSelect = savedProject || projects[0];
      setSelectedProject(projectToSelect);
      projectInitializedRef.current = true;
    }
  }, [projects]);

  // Save selected project to localStorage when it changes
  useEffect(() => {
    if (selectedProject) {
      localStorage.setItem("selectedProjectId", selectedProject.projectId);
    }
  }, [selectedProject]);

  const handleCoordinatesChange = useCallback((coords: Coordinates) => {
    setSelectedCoords(coords);
  }, []);

  const handleProjectSelect = useCallback((project: Project) => {
    setSelectedProject(project);
  }, []);

  const { mapRef, mapInstanceRef, markerRef, isMapLoaded } = useMapInteraction(
    mapboxToken,
    selectedCoords,
    handleCoordinatesChange,
  );

  const {
    selectedAlert,
    setSelectedAlert,
    isLoadingAlerts,
    loadAlerts,
    cleanupMarkers,
  } = useMapAlerts(credentials, selectedProject, mapInstanceRef, {
    autoFitBounds: true, // Automatically fit map bounds to show all alerts
  });

  const {
    searchQuery,
    setSearchQuery,
    isSearching,
    recentSearches,
    searchInputRef,
    handleSearch,
    handleClearSearch,
  } = useMapSearch(mapInstanceRef, markerRef, handleCoordinatesChange, {
    autoZoom: false, // Prevent automatic zoom changes when searching
  });

  // Load alerts when map loads and credentials are available
  useEffect(() => {
    if (isMapLoaded && credentials && selectedProject) {
      loadAlerts();
    }
  }, [isMapLoaded, credentials, selectedProject, loadAlerts]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupMarkers();
    };
  }, [cleanupMarkers]);

  // Adjust map padding on mobile when coordinates are selected to keep marker visible above bottom sheet
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !isMapLoaded) return;

    if (isMobile && selectedCoords) {
      // Add padding to bottom to account for bottom sheet (approximately 200px)
      map.easeTo({
        padding: { top: 0, bottom: 250, left: 0, right: 0 },
        duration: 300,
      });
    } else if (isMobile && !selectedCoords) {
      // Reset padding when coordinates are cleared
      map.easeTo({
        padding: { top: 0, bottom: 0, left: 0, right: 0 },
        duration: 300,
      });
    }
  }, [selectedCoords, isMobile, isMapLoaded, mapInstanceRef]);

  const handleTokenSubmit = () => {
    setShowTokenInput(false);
  };

  const handleManualCoords = useCallback(
    (coords: Coordinates) => {
      setSelectedCoords(coords);

      // Update map center and marker without changing zoom
      if (mapInstanceRef.current) {
        // Just center the map without changing zoom to prevent jarring experience
        mapInstanceRef.current.setCenter([coords.lng, coords.lat]);

        if (markerRef.current) {
          markerRef.current.remove();
        }

        // Use the appropriate Marker class based on which library we're using
        const MarkerClass = mapboxgl.accessToken
          ? mapboxgl.Marker
          : maplibregl.Marker;
        markerRef.current = new MarkerClass({
          color: "#ef4444",
        })
          .setLngLat([coords.lng, coords.lat])
          .addTo(mapInstanceRef.current);
      }
    },
    [mapInstanceRef, markerRef],
  );

  const handleRecentSearchClick = useCallback(
    (search: string) => {
      setSearchQuery(search);
      handleSearch();
    },
    [handleSearch, setSearchQuery],
  );

  const handleContinue = useCallback(() => {
    if (!selectedCoords) {
      toast.error(t("map.pleaseSelectCoordinates"));
      return;
    }

    // Haptic feedback
    if ("vibrate" in navigator) {
      navigator.vibrate([50, 100, 50]);
    }

    onCoordinatesSet(selectedCoords, selectedProject?.projectId);
  }, [selectedCoords, selectedProject, onCoordinatesSet, t]);

  const handleCancelCoordinates = useCallback(() => {
    setSelectedCoords(null);

    // Remove marker from map
    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }

    // Haptic feedback
    if ("vibrate" in navigator) {
      navigator.vibrate(50);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        selectedCoords={selectedCoords}
        isMapLoaded={isMapLoaded}
        searchInputRef={searchInputRef}
      />

      {/* Mobile-optimized floating header with safe area */}
      <div className="absolute top-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div
          className="flex justify-between items-center px-4 py-3 h-16"
          style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* App icon placeholder - you can replace with actual logo */}
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">CM</span>
            </div>
            {/* Show project name on mobile, app title on desktop */}
            {selectedProject ? (
              <h1 className="text-base font-bold text-gray-800 truncate md:text-lg">
                {selectedProject.name}
              </h1>
            ) : (
              <h1 className="text-base font-bold text-gray-800 truncate md:text-lg">
                {t("app.title")}
              </h1>
            )}
            {/* Desktop only: Project selector */}
            <div className="hidden md:flex">
              <ProjectSelector
                projects={projects}
                selectedProject={selectedProject}
                onProjectSelect={handleProjectSelect}
                isLoading={isLoadingProjects || isLoadingAlerts}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <LanguageSwitcher />
            {isInstallable && (
              <Button
                variant="outline"
                size="sm"
                onClick={installApp}
                className="flex items-center gap-1 h-11 min-w-[44px]"
                aria-label={t("common.installApp")}
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">{t("common.install")}</span>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={onLogout}
              className="flex items-center gap-1 h-11 min-w-[44px]"
              aria-label={t("projects.logout")}
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">{t("projects.logout")}</span>
            </Button>
          </div>
        </div>
        {/* Mobile only: Project selector below header */}
        <div className="md:hidden px-4 pb-3">
          <ProjectSelector
            projects={projects}
            selectedProject={selectedProject}
            onProjectSelect={handleProjectSelect}
            isLoading={isLoadingProjects || isLoadingAlerts}
          />
        </div>
      </div>

      {/* Search UI - Different on mobile vs desktop */}
      {isMobile ? (
        /* Mobile: Compact search trigger button */
        <div className="absolute top-20 left-4 z-20">
          <Button
            onClick={() => setShowSearchModal(true)}
            className="w-12 h-12 rounded-full bg-white/95 backdrop-blur-sm shadow-lg hover:bg-white border border-gray-200"
            aria-label="Open search"
          >
            <Search className="w-5 h-5 text-gray-700" />
          </Button>
        </div>
      ) : (
        /* Desktop: Full search bar always visible */
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
      )}

      {/* Mobile: Search bottom sheet */}
      {isMobile && (
        <BottomSheet
          isOpen={showSearchModal}
          onClose={() => setShowSearchModal(false)}
          title={t("map.searchPlaceholder")}
        >
          <SearchBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            isSearching={isSearching}
            recentSearches={recentSearches}
            searchInputRef={searchInputRef}
            onSearch={() => {
              handleSearch();
              setShowSearchModal(false);
            }}
            onClearSearch={handleClearSearch}
            onRecentSearchClick={(search) => {
              handleRecentSearchClick(search);
              setShowSearchModal(false);
            }}
            standalone={false}
          />
        </BottomSheet>
      )}

      {/* Floating map controls - vertically stacked on right side */}
      <div className="absolute right-4 z-10 flex flex-col gap-3" style={{ top: isMobile ? '140px' : '96px' }}>
        {/* Manual coordinate entry button */}
        <Button
          onClick={() => setShowManualEntry(true)}
          className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg md:w-auto md:h-auto md:rounded-lg md:px-4 md:py-2"
          aria-label="Manual coordinate entry"
        >
          <Settings className="w-6 h-6 md:w-4 md:h-4" />
          <span className="hidden md:inline md:ml-2">
            {t("map.manualEntry")}
          </span>
        </Button>
        {/* Add more map controls here in the future if needed */}
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
          onCancel={handleCancelCoordinates}
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
