import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import mapboxgl from "mapbox-gl";
import maplibregl from "maplibre-gl";

interface Coordinates {
  lat: number;
  lng: number;
}

export const useMapInteraction = (
  mapboxToken: string,
  selectedCoords: Coordinates | null,
  onCoordinatesChange: (coords: Coordinates) => void,
) => {
  const { t } = useTranslation();
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<mapboxgl.Map | maplibregl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | maplibregl.Marker | null>(null);
  const initializedRef = useRef(false);

  // Memoize the click handler to prevent recreation
  const handleMapClick = useCallback(
    (e: mapboxgl.MapMouseEvent | maplibregl.MapMouseEvent) => {
      const coords = {
        lat: parseFloat(e.lngLat.lat.toFixed(6)),
        lng: parseFloat(e.lngLat.lng.toFixed(6)),
      };

      onCoordinatesChange(coords);

      // Haptic feedback on mobile
      if ("vibrate" in navigator) {
        navigator.vibrate(50);
      }

      toast.success(
        t("map.locationSelected", {
          lat: coords.lat.toString(),
          lng: coords.lng.toString(),
        }),
      );
    },
    [onCoordinatesChange], // Removed 't' to prevent map re-render on language change
  );

  // Initialize map only once
  useEffect(() => {
    if (!mapRef.current || initializedRef.current) return;

    try {
      let map: mapboxgl.Map | maplibregl.Map;

      if (mapboxToken && mapboxToken.trim()) {
        // Use Mapbox GL with token for premium features
        mapboxgl.accessToken = mapboxToken;
        map = new mapboxgl.Map({
          container: mapRef.current,
          style: "mapbox://styles/mapbox/satellite-streets-v12",
          center: selectedCoords
            ? [selectedCoords.lng, selectedCoords.lat]
            : [0, 0],
          zoom: selectedCoords ? 10 : 2,
          touchZoomRotate: true,
          touchPitch: true,
        });
        map.addControl(new mapboxgl.NavigationControl(), "bottom-right");
      } else {
        // Use MapLibre GL with OpenStreetMap when no token is provided
        if (import.meta.env.DEV) {
          console.log(
            "No Mapbox token provided, using OpenStreetMap tiles with MapLibre GL",
          );
        }

        const osmStyle = {
          version: 8 as const,
          sources: {
            "osm-tiles": {
              type: "raster" as const,
              tiles: [
                "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
                "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
                "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
              ],
              tileSize: 256,
              attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            },
          },
          layers: [
            {
              id: "osm-tiles",
              type: "raster" as const,
              source: "osm-tiles",
              minzoom: 0,
              maxzoom: 19,
            },
          ],
        };

        map = new maplibregl.Map({
          container: mapRef.current,
          style: osmStyle,
          center: selectedCoords
            ? [selectedCoords.lng, selectedCoords.lat]
            : [0, 0],
          zoom: selectedCoords ? 10 : 2,
          touchZoomRotate: true,
          touchPitch: true,
        });
        map.addControl(new maplibregl.NavigationControl(), "bottom-right");
      }

      map.on("load", () => {
        setIsMapLoaded(true);
      });

      map.on("error", (e) => {
        console.error("Map error:", e);
        toast.error(t("map.mapConfigError"));
      });

      map.on("click", handleMapClick as any);

      mapInstanceRef.current = map;
      initializedRef.current = true;

      return () => {
        if (markerRef.current) {
          markerRef.current.remove();
        }
        map.remove();
        initializedRef.current = false;
      };
    } catch (error) {
      console.error("Failed to initialize map:", error);
      toast.error(t("map.mapConfigError"));
    }
  }, [mapboxToken, handleMapClick]); // Removed 't' to prevent map re-render on language change

  // Update marker when selectedCoords changes (without recreating map)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !isMapLoaded) return;

    if (selectedCoords) {
      // Remove existing marker
      if (markerRef.current) {
        markerRef.current.remove();
      }

      // Add new marker using the appropriate library
      const MarkerClass = mapboxgl.accessToken
        ? mapboxgl.Marker
        : maplibregl.Marker;
      markerRef.current = new MarkerClass({
        color: "#ef4444",
      })
        .setLngLat([selectedCoords.lng, selectedCoords.lat])
        .addTo(map as any);
    } else {
      // Remove marker if no coordinates
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
    }
  }, [selectedCoords, isMapLoaded]);

  return {
    mapRef,
    mapInstanceRef,
    markerRef,
    isMapLoaded,
  };
};
