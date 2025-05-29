import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import mapboxgl from "mapbox-gl";

interface Coordinates {
  lat: number;
  lng: number;
}

export const useMapSearch = (
  mapInstance: mapboxgl.Map | null,
  markerRef: React.MutableRefObject<mapboxgl.Marker | null>,
  onCoordinatesChange: (coords: Coordinates) => void,
) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("recentSearches");
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (error) {
        console.error("Error loading recent searches:", error);
      }
    }
  }, []);

  const saveRecentSearch = (query: string) => {
    const updated = [query, ...recentSearches.filter((s) => s !== query)].slice(
      0,
      3,
    );
    setRecentSearches(updated);
    localStorage.setItem("recentSearches", JSON.stringify(updated));
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    const accessToken = mapboxgl.accessToken;
    if (!accessToken) {
      toast.error("Mapbox access token is not configured");
      return;
    }

    setIsSearching(true);

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${accessToken}&limit=1`,
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Geocoding API error: ${response.status} - ${errorData.message || response.statusText}`,
        );
      }

      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        const [lng, lat] = feature.center;

        const result = { lat, lng };
        onCoordinatesChange(result);
        saveRecentSearch(searchQuery);

        // Update map center and marker
        if (mapInstance) {
          mapInstance.flyTo({
            center: [lng, lat],
            zoom: 10,
          });

          if (markerRef.current) {
            markerRef.current.remove();
          }

          markerRef.current = new mapboxgl.Marker({
            color: "#ef4444",
          })
            .setLngLat([lng, lat])
            .addTo(mapInstance);
        }

        toast.success(
          t("map.locationFound", {
            query: searchQuery,
            lat: lat.toString(),
            lng: lng.toString(),
          }),
        );
        setSearchQuery("");
      } else {
        toast.error(t("map.locationNotFound"));
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown geocoding error";
      toast.error(t("map.searchFailed"));
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    searchInputRef.current?.focus();
  };

  return {
    searchQuery,
    setSearchQuery,
    isSearching,
    recentSearches,
    searchInputRef,
    handleSearch,
    handleClearSearch,
  };
};
