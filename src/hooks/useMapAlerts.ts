
import { useState, useEffect, useRef } from 'react';
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
  projects: any[],
  mapInstance: mapboxgl.Map | null
) => {
  const { t } = useTranslation();
  const [alerts, setAlerts] = useState<MapAlert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<MapAlert | null>(null);
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(false);
  const alertMarkersRef = useRef<mapboxgl.Marker[]>([]);

  const loadAlerts = async () => {
    if (!credentials || projects.length === 0) return;
    
    setIsLoadingAlerts(true);
    try {
      const fetchedAlerts = await apiService.fetchAlerts(credentials, projects);
      setAlerts(fetchedAlerts);
      
      if (mapInstance) {
        addAlertMarkers(fetchedAlerts);
      }
    } catch (error) {
      console.error('Error loading alerts:', error);
      toast.error('Failed to load existing alerts');
    } finally {
      setIsLoadingAlerts(false);
    }
  };

  const addAlertMarkers = (alertList: MapAlert[]) => {
    if (!mapInstance) return;

    // Clear existing alert markers
    alertMarkersRef.current.forEach(marker => marker.remove());
    alertMarkersRef.current = [];

    // Add new alert markers
    alertList.forEach(alert => {
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
      `;
      el.appendChild(label);

      el.addEventListener('click', () => {
        setSelectedAlert(alert);
        
        // Haptic feedback
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }
      });

      const marker = new mapboxgl.Marker(el)
        .setLngLat(alert.coordinates)
        .addTo(mapInstance);

      alertMarkersRef.current.push(marker);
    });
  };

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
