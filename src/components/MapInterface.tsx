
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Search, LogOut, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
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
}

export const MapInterface = ({ onCoordinatesSet, onLogout, coordinates }: MapInterfaceProps) => {
  const [selectedCoords, setSelectedCoords] = useState<Coordinates | null>(coordinates);
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [mapboxToken, setMapboxToken] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(true);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    if (coordinates) {
      setSelectedCoords(coordinates);
      setManualLat(coordinates.lat.toString());
      setManualLng(coordinates.lng.toString());
    }
  }, [coordinates]);

  useEffect(() => {
    if (!mapRef.current || !mapboxToken) return;

    // Initialize Mapbox
    mapboxgl.accessToken = mapboxToken;
    
    const map = new mapboxgl.Map({
      container: mapRef.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: selectedCoords ? [selectedCoords.lng, selectedCoords.lat] : [0, 0],
      zoom: selectedCoords ? 10 : 2
    });

    map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

    map.on('click', (e) => {
      const coords = {
        lat: parseFloat(e.lngLat.lat.toFixed(6)),
        lng: parseFloat(e.lngLat.lng.toFixed(6))
      };
      
      setSelectedCoords(coords);
      setManualLat(coords.lat.toString());
      setManualLng(coords.lng.toString());
      
      // Update marker
      if (markerRef.current) {
        markerRef.current.remove();
      }
      
      markerRef.current = new mapboxgl.Marker({
        color: '#ef4444'
      })
        .setLngLat([coords.lng, coords.lat])
        .addTo(map);
      
      toast.success(`Coordinates selected: ${coords.lat}, ${coords.lng}`);
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
      if (markerRef.current) {
        markerRef.current.remove();
      }
      map.remove();
    };
  }, [mapboxToken, selectedCoords]);

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
    
    toast.success(`Coordinates set manually: ${lat}, ${lng}`);
    setShowManualEntry(false);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    
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
      
      toast.success(`Found ${searchQuery}: ${result.lat}, ${result.lng}`);
    } else {
      toast.error('Location not found. Try: London, Paris, New York, or Tokyo');
    }
    
    setIsSearching(false);
  };

  const handleContinue = () => {
    if (!selectedCoords) {
      toast.error('Please select coordinates first');
      return;
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
      
      {/* Floating header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-white/90 backdrop-blur-sm border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Select Location</h1>
          <Button variant="outline" onClick={onLogout} className="flex items-center gap-2">
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </div>
      
      {/* Floating search bar */}
      <div className="absolute top-20 left-6 z-10 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-4 w-80">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-gray-500" />
          <Input
            placeholder="Search for a city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="border-none shadow-none focus-visible:ring-0"
          />
          <Button size="sm" onClick={handleSearch} disabled={isSearching}>
            {isSearching ? '...' : 'Go'}
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Try: London, Paris, New York, Tokyo
        </p>
      </div>
      
      {/* Manual entry toggle button */}
      <div className="absolute top-20 right-6 z-10">
        <Button
          variant="outline"
          onClick={() => setShowManualEntry(!showManualEntry)}
          className="bg-white/95 backdrop-blur-sm shadow-lg flex items-center gap-2"
        >
          <Settings className="w-4 h-4" />
          Manual Entry
          {showManualEntry ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
      </div>
      
      {/* Manual entry panel */}
      {showManualEntry && (
        <div className="absolute top-32 right-6 z-10 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-4 w-80">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude (-90 to 90)</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                placeholder="51.5074"
                value={manualLat}
                onChange={(e) => setManualLat(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude (-180 to 180)</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                placeholder="-0.1278"
                value={manualLng}
                onChange={(e) => setManualLng(e.target.value)}
              />
            </div>
            <Button onClick={handleManualCoords} className="w-full">
              Set Coordinates
            </Button>
          </div>
        </div>
      )}
      
      {/* Coordinates display panel */}
      {selectedCoords && (
        <div className="absolute bottom-6 left-6 z-10 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-4">
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-red-500" />
            <div>
              <p className="font-semibold text-gray-800">Selected Location</p>
              <p className="text-sm text-gray-600">
                {selectedCoords.lat}, {selectedCoords.lng}
              </p>
            </div>
            <Button onClick={handleContinue} className="ml-4 bg-green-600 hover:bg-green-700">
              Continue
            </Button>
          </div>
        </div>
      )}
      
      {/* Instructions overlay */}
      {!selectedCoords && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10 bg-black/75 text-white rounded-lg px-4 py-2">
          <p className="text-sm">Click anywhere on the map to select coordinates</p>
        </div>
      )}
    </div>
  );
};
