import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import mapboxgl from "mapbox-gl";

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
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const initializedRef = useRef(false);

  // Memoize the click handler to prevent recreation
  const handleMapClick = useCallback(
    (e: mapboxgl.MapMouseEvent) => {
      const coords = {
        lat: parseFloat(e.lngLat.lat.toFixed(6)),
        lng: parseFloat(e.lngLat.lng.toFixed(6)),
      };

      onCoordinatesChange(coords);

      // Haptic feedback on mobile
      if ("vibrate" in navigator) {
        navigator.vibrate(50);
      }

      // Update marker with bounce animation
      if (markerRef.current) {
        markerRef.current.remove();
      }

      const map = mapInstanceRef.current;
      if (!map) return;

      markerRef.current = new mapboxgl.Marker({
        color: "#ef4444",
        scale: 1.2,
      })
        .setLngLat([coords.lng, coords.lat])
        .addTo(map);

      // Animate marker
      setTimeout(() => {
        if (markerRef.current) {
          markerRef.current.getElement().style.transform = "scale(1)";
          markerRef.current.getElement().style.transition =
            "transform 0.3s ease-out";
        }
      }, 100);

      toast.success(
        t("map.locationSelected", {
          lat: coords.lat.toString(),
          lng: coords.lng.toString(),
        }),
      );
    },
    [onCoordinatesChange, t],
  );

  // Initialize map only once
  useEffect(() => {
    if (!mapRef.current || initializedRef.current) return;

    try {
      let mapStyle;

      if (mapboxToken && mapboxToken.trim()) {
        // Initialize with Mapbox token and style
        mapboxgl.accessToken = mapboxToken;
        mapStyle = "mapbox://styles/mapbox/satellite-streets-v12";
      } else {
        // Use OpenStreetMap as fallback when no token is provided
        mapStyle = {
          version: 8,
          sources: {
            "osm-tiles": {
              type: "raster",
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
              type: "raster",
              source: "osm-tiles",
              minzoom: 0,
              maxzoom: 19,
            },
          ],
        };
        console.log(
          "No Mapbox token provided, using OpenStreetMap tiles as fallback",
        );
      }

      const map = new mapboxgl.Map({
        container: mapRef.current,
        style: mapStyle,
        center: selectedCoords
          ? [selectedCoords.lng, selectedCoords.lat]
          : [0, 0],
        zoom: selectedCoords ? 10 : 2,
        touchZoomRotate: true,
        touchPitch: true,
      });

      map.addControl(new mapboxgl.NavigationControl(), "bottom-right");

      map.on("load", () => {
        setIsMapLoaded(true);
      });

      map.on("error", (e) => {
        console.error("Map error:", e);
        toast.error(t("map.mapConfigError"));
      });

      map.on("click", handleMapClick);

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
  }, [mapboxToken, t, handleMapClick]); // Remove selectedCoords from dependencies

  // Update marker when selectedCoords changes (without recreating map)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !isMapLoaded) return;

    if (selectedCoords) {
      // Remove existing marker
      if (markerRef.current) {
        markerRef.current.remove();
      }

      // Add new marker
      markerRef.current = new mapboxgl.Marker({
        color: "#ef4444",
      })
        .setLngLat([selectedCoords.lng, selectedCoords.lat])
        .addTo(map);
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
