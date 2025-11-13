import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import mapboxgl from "mapbox-gl";
import maplibregl from "maplibre-gl";

interface Coordinates {
  lat: number;
  lng: number;
}

export const useMapSearch = (
  mapInstance: mapboxgl.Map | maplibregl.Map | null,
  markerRef: React.MutableRefObject<
    mapboxgl.Marker | maplibregl.Marker | null
  >,
  onCoordinatesChange: (coords: Coordinates) => void,
  options: { autoZoom?: boolean } = { autoZoom: false },
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

    setIsSearching(true);

    try {
      const accessToken = mapboxgl.accessToken;
      let lat: number;
      let lng: number;

      if (accessToken) {
        // Use Mapbox geocoding when token is available
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
          [lng, lat] = feature.center;
        } else {
          toast.error(t("map.locationNotFound"));
          return;
        }
      } else {
        // Use Nominatim (OSM) geocoding as fallback when no token
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`,
          {
            headers: {
              "User-Agent": "GeoAlertCommander/1.0",
            },
          },
        );

        if (!response.ok) {
          throw new Error(`Nominatim API error: ${response.status}`);
        }

        const data = await response.json();

        if (data && data.length > 0) {
          lat = parseFloat(data[0].lat);
          lng = parseFloat(data[0].lon);
        } else {
          toast.error(t("map.locationNotFound"));
          return;
        }
      }

      const result = { lat, lng };
      onCoordinatesChange(result);
      saveRecentSearch(searchQuery);

      // Update map center and marker
      if (mapInstance) {
        // Only auto-zoom if enabled
        if (options.autoZoom) {
          mapInstance.flyTo({
            center: [lng, lat],
            zoom: 10,
          });
        } else {
          // Just center the map without changing zoom
          mapInstance.setCenter([lng, lat]);
        }

        if (markerRef.current) {
          markerRef.current.remove();
        }

        // Use the appropriate Marker class - check if using Mapbox or MapLibre
        const MarkerClass = mapboxgl.accessToken
          ? mapboxgl.Marker
          : maplibregl.Marker;
        markerRef.current = new MarkerClass({
          color: "#ef4444",
        })
          .setLngLat([lng, lat])
          .addTo(mapInstance as any);
      }

      toast.success(
        t("map.locationFound", {
          query: searchQuery,
          lat: lat.toString(),
          lng: lng.toString(),
        }),
      );
      setSearchQuery("");
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
