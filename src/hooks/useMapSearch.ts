
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import mapboxgl from 'mapbox-gl';

interface Coordinates {
  lat: number;
  lng: number;
}

export const useMapSearch = (
  mapInstance: mapboxgl.Map | null,
  markerRef: React.MutableRefObject<mapboxgl.Marker | null>,
  onCoordinatesChange: (coords: Coordinates) => void
) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('recentSearches');
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (error) {
        console.error('Error loading recent searches:', error);
      }
    }
  }, []);

  const saveRecentSearch = (query: string) => {
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 3);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    
    try {
      // Simulate geocoding - in a real app, you'd use a geocoding service
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock search results
      const mockResults = {
        'london': { lat: 51.5074, lng: -0.1278 },
        'paris': { lat: 48.8566, lng: 2.3522 },
        'new york': { lat: 40.7128, lng: -74.0060 },
        'tokyo': { lat: 35.6762, lng: 139.6503 }
      };
      
      const result = mockResults[searchQuery.toLowerCase() as keyof typeof mockResults];
      
      if (result) {
        onCoordinatesChange(result);
        saveRecentSearch(searchQuery);
        
        // Update map center and marker
        if (mapInstance) {
          mapInstance.flyTo({
            center: [result.lng, result.lat],
            zoom: 10
          });
          
          if (markerRef.current) {
            markerRef.current.remove();
          }
          
          markerRef.current = new mapboxgl.Marker({
            color: '#ef4444'
          })
            .setLngLat([result.lng, result.lat])
            .addTo(mapInstance);
        }
        
        toast.success(t('map.locationFound', { query: searchQuery, lat: result.lat, lng: result.lng }));
        setSearchQuery('');
      } else {
        toast.error(t('map.locationNotFound'));
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error(t('map.searchFailed'));
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    searchInputRef.current?.focus();
  };

  return {
    searchQuery,
    setSearchQuery,
    isSearching,
    recentSearches,
    searchInputRef,
    handleSearch,
    handleClearSearch
  };
};
