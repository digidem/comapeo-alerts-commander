import { useState, useEffect, useRef } from "react";
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

  useEffect(() => {
    if (!mapRef.current || !mapboxToken) return;

    try {
      // Initialize Mapbox
      mapboxgl.accessToken = mapboxToken;

      const map = new mapboxgl.Map({
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

      map.on("load", () => {
        setIsMapLoaded(true);
      });

      map.on("error", (e) => {
        console.error("Mapbox error:", e);
        toast.error(t("map.mapConfigError"));
      });

      map.on("click", (e) => {
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
      });

      // Add existing marker if coordinates exist
      if (selectedCoords) {
        markerRef.current = new mapboxgl.Marker({
          color: "#ef4444",
        })
          .setLngLat([selectedCoords.lng, selectedCoords.lat])
          .addTo(map);
      }

      mapInstanceRef.current = map;

      return () => {
        if (markerRef.current) {
          markerRef.current.remove();
        }
        map.remove();
      };
    } catch (error) {
      console.error("Failed to initialize map:", error);
      toast.error(t("map.mapConfigError"));
    }
  }, [mapboxToken, selectedCoords, t, onCoordinatesChange]);

  return {
    mapRef,
    mapInstanceRef,
    markerRef,
    isMapLoaded,
  };
};
