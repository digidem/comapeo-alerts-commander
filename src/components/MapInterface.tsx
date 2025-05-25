import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { MapPin, Search, LogOut, Settings, Download } from 'lucide-react';
import { toast } from 'sonner';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { AlertPopup } from '@/components/AlertPopup';
import { apiService } from '@/services/apiService';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface Coordinates {
  lat: number;
  lng: number;
}

interface MapInterfaceProps {
  onCoordinatesSet: (coordinates: Coordinates) => void;
  onLogout: () => void;
  coordinates: Coordinates | null;
  credentials?: any;
  projects?: any[];
}

interface MapAlert {
  id: string;
  name: string;
  coordinates: [number, number];
  projectName: string;
  detectionDateStart: string;
  detectionDateEnd: string;
  sourceId: string;
}

// Default Mapbox token
const DEFAULT_MAPBOX_TOKEN = 'pk.eyJ1IjoibHVhbmRybyIsImEiOiJjanY2djRpdnkwOWdqM3lwZzVuaGIxa3VsIn0.jamcK2t2I1j3TXkUQFIsjQ';

export const MapInterface = ({ onCoordinatesSet, onLogout, coordinates, credentials, projects = [] }: MapInterfaceProps) => {
  const [selectedCoords, setSelectedCoords] = useState<Coordinates | null>(coordinates);
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [mapboxToken, setMapboxToken] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [alerts, setAlerts] = useState<MapAlert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<MapAlert | null>(null);
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const alertMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const { isInstallable, installApp } = usePWAInstall();

  // Check for environment variable or use default token
  useEffect(() => {
    const envToken = import.meta.env.VITE_MAPBOX_TOKEN;
    if (envToken && envToken.trim()) {
      setMapboxToken(envToken);
      setShowTokenInput(false);
    } else {
      setMapboxToken(DEFAULT_MAPBOX_TOKEN);
      setShowTokenInput(false);
    }
  }, []);

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

  // Auto-focus search input
  useEffect(() => {
    if (isMapLoaded && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 300);
    }
  }, [isMapLoaded]);

  useEffect(() => {
    if (coordinates) {
      setSelectedCoords(coordinates);
      setManualLat(coordinates.lat.toString());
      setManualLng(coordinates.lng.toString());
    }
  }, [coordinates]);

  // Load alerts when map loads and credentials are available
  useEffect(() => {
    if (isMapLoaded && credentials && projects.length > 0) {
      loadAlerts();
    }
  }, [isMapLoaded, credentials, projects]);

  const loadAlerts = async () => {
    if (!credentials || projects.length === 0) return;
    
    setIsLoadingAlerts(true);
    try {
      const fetchedAlerts = await apiService.fetchAlerts(credentials, projects);
      setAlerts(fetchedAlerts);
      
      // Add alert markers to map
      if (mapInstanceRef.current) {
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
    if (!mapInstanceRef.current) return;

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
        .addTo(mapInstanceRef.current!);

      alertMarkersRef.current.push(marker);
    });
  };

  // Update map initialization to include alert loading
  useEffect(() => {
    if (!mapRef.current || !mapboxToken) return;

    try {
      // Initialize Mapbox
      mapboxgl.accessToken = mapboxToken;
      
      const map = new mapboxgl.Map({
        container: mapRef.current,
        style: 'mapbox://styles/mapbox/satellite-streets-v12',
        center: selectedCoords ? [selectedCoords.lng, selectedCoords.lat] : [0, 0],
        zoom: selectedCoords ? 10 : 2,
        touchZoomRotate: true,
        touchPitch: true
      });

      map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

      map.on('load', () => {
        setIsMapLoaded(true);
      });

      map.on('error', (e) => {
        console.error('Mapbox error:', e);
        toast.error('⚠️ Map configuration error. Please contact support.');
      });

      map.on('click', (e) => {
        const coords = {
          lat: parseFloat(e.lngLat.lat.toFixed(6)),
          lng: parseFloat(e.lngLat.lng.toFixed(6))
        };
        
        setSelectedCoords(coords);
        setManualLat(coords.lat.toString());
        setManualLng(coords.lng.toString());
        
        // Haptic feedback on mobile
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }
        
        // Update marker with bounce animation
        if (markerRef.current) {
          markerRef.current.remove();
        }
        
        markerRef.current = new mapboxgl.Marker({
          color: '#ef4444',
          scale: 1.2
        })
          .setLngLat([coords.lng, coords.lat])
          .addTo(map);
        
        // Animate marker
        setTimeout(() => {
          if (markerRef.current) {
            markerRef.current.getElement().style.transform = 'scale(1)';
            markerRef.current.getElement().style.transition = 'transform 0.3s ease-out';
          }
        }, 100);
        
        toast.success(`📍 Location selected: ${coords.lat}, ${coords.lng}`);
      });

      // Add existing marker if coordinates exist
      if (selectedCoords) {
        markerRef.current = new mapboxgl.Marker({
          color: '#ef4444'
        })
          .setLngLat([selectedCoords.lng, selectedCoords.lat])
          .addTo(map);
      }

      mapInstanceRef.current = map;

      return () => {
        alertMarkersRef.current.forEach(marker => marker.remove());
        if (markerRef.current) {
          markerRef.current.remove();
        }
        map.remove();
      };
    } catch (error) {
      console.error('Failed to initialize map:', error);
      toast.error('⚠️ Map configuration error. Please contact support.');
    }
  }, [mapboxToken, selectedCoords]);

  const saveRecentSearch = (query: string) => {
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 3);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const handleTokenSubmit = () => {
    if (!mapboxToken.trim()) {
      toast.error('Please enter a valid Mapbox token');
      return;
    }
    setShowTokenInput(false);
    toast.success('Mapbox token set successfully');
  };

  const handleManualCoords = () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      toast.error('Please enter valid coordinates (lat: -90 to 90, lng: -180 to 180)');
      return;
    }
    
    const coords = { lat, lng };
    setSelectedCoords(coords);
    
    // Update map center and marker
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo({
        center: [lng, lat],
        zoom: 10
      });
      
      if (markerRef.current) {
        markerRef.current.remove();
      }
      
      markerRef.current = new mapboxgl.Marker({
        color: '#ef4444'
      })
        .setLngLat([lng, lat])
        .addTo(mapInstanceRef.current);
    }
    
    toast.success(`📍 Coordinates set manually: ${lat}, ${lng}`);
    setShowManualEntry(false);
    
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(100);
    }
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
        setSelectedCoords(result);
        setManualLat(result.lat.toString());
        setManualLng(result.lng.toString());
        saveRecentSearch(searchQuery);
        
        // Update map center and marker
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo({
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
            .addTo(mapInstanceRef.current);
        }
        
        toast.success(`📍 Found ${searchQuery}: ${result.lat}, ${result.lng}`);
        setSearchQuery('');
      } else {
        toast.error('Location not found. Try: London, Paris, New York, or Tokyo');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('⚠️ Search failed. Please check your connection and try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    searchInputRef.current?.focus();
  };

  const handleContinue = () => {
    if (!selectedCoords) {
      toast.error('Please select coordinates first');
      return;
    }
    
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 100, 50]);
    }
    
    onCoordinatesSet(selectedCoords);
  };

  if (showTokenInput) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Mapbox Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mapboxToken">Mapbox Public Token</Label>
              <Input
                id="mapboxToken"
                type="password"
                placeholder="pk.eyJ1IjoieW91ci11c2VybmFtZSIsImEi..."
                value={mapboxToken}
                onChange={(e) => setMapboxToken(e.target.value)}
              />
              <p className="text-sm text-gray-600">
                Get your token from{' '}
                <a href="https://mapbox.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  mapbox.com
                </a>
              </p>
            </div>
            <Button onClick={handleTokenSubmit} className="w-full">
              Initialize Map
            </Button>
            <Button variant="outline" onClick={onLogout} className="w-full">
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden">
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
              <p className="text-gray-500">Loading map...</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Mobile-optimized floating header with safe area */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div 
          className="flex justify-between items-center px-4 py-3 h-16"
          style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
        >
          <h1 className="text-lg font-bold text-gray-800">CoMapeo Alert</h1>
          <div className="flex items-center gap-2">
            {isInstallable && (
              <Button
                variant="outline"
                size="sm"
                onClick={installApp}
                className="flex items-center gap-1 h-11 min-w-[44px]"
                aria-label="Install app"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Install</span>
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onLogout} 
              className="flex items-center gap-1 h-11 min-w-[44px]"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </div>
      
      {/* Enhanced search bar with recent searches */}
      <div className="absolute top-20 left-4 right-4 z-10 md:left-6 md:right-auto md:w-80">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-4 space-y-3">
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-gray-500 flex-shrink-0" />
            <Input
              ref={searchInputRef}
              placeholder="Search for a city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="border-none shadow-none focus-visible:ring-0 text-base h-12"
              autoComplete="off"
            />
            {searchQuery && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleClearSearch}
                className="p-2 h-8 w-8"
                aria-label="Clear search"
              >
                ✕
              </Button>
            )}
            <Button 
              size="sm" 
              onClick={handleSearch} 
              disabled={isSearching || !searchQuery.trim()}
              className="flex-shrink-0 h-12 px-6"
            >
              {isSearching ? '...' : 'Go'}
            </Button>
          </div>
          
          {/* Recent searches */}
          {recentSearches.length > 0 && !searchQuery && (
            <div className="border-t pt-3">
              <p className="text-xs text-gray-500 mb-2">Recent searches:</p>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSearchQuery(search);
                      handleSearch();
                    }}
                    className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full hover:bg-gray-200 transition-colors min-h-[32px]"
                  >
                    {search}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <p className="text-xs text-gray-500">
            Try: London, Paris, New York, Tokyo
          </p>
        </div>
      </div>
      
      {/* Mobile FAB for manual entry - larger touch target */}
      <div className="absolute top-36 right-4 z-10 md:top-24">
        <Button
          onClick={() => setShowManualEntry(true)}
          className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg md:w-auto md:h-auto md:rounded-lg md:px-4 md:py-2"
          aria-label="Manual coordinate entry"
        >
          <Settings className="w-6 h-6 md:w-4 md:h-4" />
          <span className="hidden md:inline md:ml-2">Manual Entry</span>
        </Button>
      </div>
      
      {/* Enhanced bottom sheet for manual entry */}
      <BottomSheet
        isOpen={showManualEntry}
        onClose={() => setShowManualEntry(false)}
        title="Manual Coordinates"
        className="pb-safe-area-inset-bottom"
      >
        <div className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="latitude" className="text-base font-medium">Latitude (-90 to 90)</Label>
            <Input
              id="latitude"
              type="number"
              step="any"
              placeholder="51.5074"
              value={manualLat}
              onChange={(e) => setManualLat(e.target.value)}
              className="text-base h-12"
              autoComplete="off"
            />
          </div>
          <div className="space-y-3">
            <Label htmlFor="longitude" className="text-base font-medium">Longitude (-180 to 180)</Label>
            <Input
              id="longitude"
              type="number"
              step="any"
              placeholder="-0.1278"
              value={manualLng}
              onChange={(e) => setManualLng(e.target.value)}
              className="text-base h-12"
              autoComplete="off"
            />
          </div>
          <Button onClick={handleManualCoords} className="w-full h-12 text-base font-medium">
            Set Coordinates
          </Button>
        </div>
      </BottomSheet>
      
      {/* Enhanced coordinates display with safe area padding */}
      {selectedCoords && (
        <div 
          className="absolute left-4 right-4 z-10 md:left-6 md:right-auto md:w-auto"
          style={{ bottom: `max(80px, calc(env(safe-area-inset-bottom) + 80px))` }}
        >
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 text-base">Selected Location</p>
                <p className="text-sm text-gray-600 truncate" role="region" aria-label="Selected coordinates">
                  <span>Lat: {selectedCoords.lat}</span>, <span>Lng: {selectedCoords.lng}</span>
                </p>
              </div>
              <Button 
                onClick={handleContinue} 
                className="bg-green-600 hover:bg-green-700 h-12 px-6 font-medium min-w-[100px]"
                aria-label="Continue to project selection"
              >
                Continue
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Mobile-friendly instructions with safe area */}
      {!selectedCoords && isMapLoaded && (
        <div 
          className="absolute left-1/2 transform -translate-x-1/2 z-10 px-4"
          style={{ bottom: `max(20px, calc(env(safe-area-inset-bottom) + 20px))` }}
        >
          <div className="bg-black/75 text-white rounded-2xl px-4 py-3 text-center max-w-xs">
            <p className="text-sm">Tap anywhere on the map to select coordinates</p>
          </div>
        </div>
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
