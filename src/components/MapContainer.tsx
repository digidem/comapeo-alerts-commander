import { useEffect, memo } from "react";
import { useTranslation } from "react-i18next";

interface Coordinates {
  lat: number;
  lng: number;
}

interface MapContainerProps {
  mapRef: React.RefObject<HTMLDivElement>;
  selectedCoords: Coordinates | null;
  isMapLoaded: boolean;
  searchInputRef?: React.RefObject<HTMLInputElement>;
}

export const MapContainer = memo<MapContainerProps>(
  ({ mapRef, selectedCoords, isMapLoaded, searchInputRef }) => {
    const { t } = useTranslation();

    // Auto-focus search input when map loads - use ref instead of DOM query
    useEffect(() => {
      if (isMapLoaded && searchInputRef?.current) {
        const timeoutId = setTimeout(() => {
          searchInputRef.current?.focus();
        }, 300);

        return () => clearTimeout(timeoutId);
      }
    }, [isMapLoaded, searchInputRef]);

    return (
      <>
        {/* Full-screen map */}
        <div ref={mapRef} className="absolute inset-0" />

        {/* Loading overlay with skeleton */}
        {!isMapLoaded && (
          <div className="absolute inset-0 bg-white flex flex-col z-20">
            {/* Header skeleton */}
            <div className="h-16 bg-gray-100 border-b flex items-center px-4">
              <div className="h-6 bg-gray-200 rounded w-32 skeleton"></div>
            </div>

            {/* Search skeleton */}
            <div className="p-4">
              <div className="h-12 bg-gray-200 rounded-2xl skeleton"></div>
            </div>

            {/* Map skeleton */}
            <div className="flex-1 bg-gray-100 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto skeleton"></div>
                <div className="h-4 bg-gray-200 rounded w-32 mx-auto skeleton"></div>
                <p className="text-gray-500">{t("map.loadingMap")}</p>
              </div>
            </div>
          </div>
        )}

        {/* Mobile-friendly instructions with safe area */}
        {!selectedCoords && isMapLoaded && (
          <div
            className="absolute left-1/2 transform -translate-x-1/2 z-10 px-4"
            style={{
              bottom: `max(20px, calc(env(safe-area-inset-bottom) + 20px))`,
            }}
          >
            <div className="bg-black/75 text-white rounded-2xl px-4 py-3 text-center max-w-xs">
              <p className="text-sm">{t("map.tapToSelect")}</p>
            </div>
          </div>
        )}
      </>
    );
  },
);
