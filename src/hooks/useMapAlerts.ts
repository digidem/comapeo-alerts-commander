
import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { apiService } from '@/services/apiService';
import { useTranslation } from 'react-i18next';
import mapboxgl from 'mapbox-gl';

export interface MapAlert {
  id: string;
  name: string;
  coordinates: [number, number];
  projectName: string;
  detectionDateStart: string;
  detectionDateEnd: string;
  sourceId: string;
}

export const useMapAlerts = (
  credentials: any,
  selectedProject: any | null,
  mapInstanceRef: React.MutableRefObject<mapboxgl.Map | null>
) => {
  const { t } = useTranslation();
  const [alerts, setAlerts] = useState<MapAlert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<MapAlert | null>(null);
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(false);
  const alertMarkersRef = useRef<mapboxgl.Marker[]>([]);

  const addAlertMarkers = (alertList: MapAlert[]) => {
    const mapInstance = mapInstanceRef.current;
    if (!mapInstance) {
      console.warn('Map instance not available when trying to add alert markers');
      return;
    }

    // Clear existing alert markers
    alertMarkersRef.current.forEach(marker => marker.remove());
    alertMarkersRef.current = [];

    if (alertList.length === 0) {
      return;
    }

    // Add new alert markers
    alertList.forEach((alert) => {
      // Validate coordinates
      if (!alert.coordinates || !Array.isArray(alert.coordinates) || alert.coordinates.length !== 2) {
        console.error(`Invalid coordinates for alert ${alert.id}:`, alert.coordinates);
        return;
      }

      const [lng, lat] = alert.coordinates;
      if (typeof lng !== 'number' || typeof lat !== 'number' || isNaN(lng) || isNaN(lat)) {
        console.error(`Invalid coordinate values for alert ${alert.id}:`, { lng, lat });
        return;
      }

      const el = document.createElement('div');
      el.className = 'alert-marker';
      el.style.cssText = `
        background-color: #ef4444;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 2px solid white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        position: relative;
        z-index: 1000;
      `;

      // Add label
      const label = document.createElement('div');
      label.textContent = alert.name;
      label.style.cssText = `
        position: absolute;
        top: -30px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 12px;
        white-space: nowrap;
        pointer-events: none;
        z-index: 1001;
      `;
      el.appendChild(label);

      el.addEventListener('click', () => {
        setSelectedAlert(alert);

        // Haptic feedback
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }
      });

      try {
        const marker = new mapboxgl.Marker(el)
          .setLngLat([lng, lat])
          .addTo(mapInstance);

        alertMarkersRef.current.push(marker);
      } catch (error) {
        console.error(`Failed to create marker for alert ${alert.id}:`, error);
      }
    });

    // Fit map to show all markers if there are any
    if (alertMarkersRef.current.length > 0) {
      const coordinates = alertList.map(alert => alert.coordinates);
      const bounds = coordinates.reduce((bounds, coord) => {
        return bounds.extend(coord);
      }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

      mapInstance.fitBounds(bounds, {
        padding: 50,
        maxZoom: 15
      });
    }
  };

  const loadAlerts = useCallback(async () => {
    if (!credentials || !selectedProject) {
      return;
    }

    setIsLoadingAlerts(true);
    try {
      // Fetch alerts for the selected project only
      const fetchedAlerts = await apiService.fetchAlerts(credentials, [selectedProject]);
      setAlerts(fetchedAlerts);

      if (fetchedAlerts.length === 0) {
        console.log(`No alerts found for project: ${selectedProject.name}`);
      } else {
        console.log(`Loaded ${fetchedAlerts.length} alerts for project: ${selectedProject.name}`);
      }
    } catch (error) {
      console.error('Error loading alerts:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred while loading alerts';
      toast.error(`Failed to load alerts: ${errorMessage}`);
      setAlerts([]);
    } finally {
      setIsLoadingAlerts(false);
    }
  }, [credentials, selectedProject]); // Remove addAlertMarkers dependency

  // Update markers when alerts change
  useEffect(() => {
    if (mapInstanceRef.current) {
      addAlertMarkers(alerts);
    }
  }, [alerts]); // Only depend on alerts

  // Clean up markers when component unmounts
  const cleanupMarkers = () => {
    alertMarkersRef.current.forEach(marker => marker.remove());
    alertMarkersRef.current = [];
  };

  return {
    alerts,
    selectedAlert,
    setSelectedAlert,
    isLoadingAlerts,
    loadAlerts,
    addAlertMarkers,
    cleanupMarkers
  };
};
