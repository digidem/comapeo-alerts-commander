
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Search, LogOut } from 'lucide-react';
import { toast } from 'sonner';

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
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (coordinates) {
      setSelectedCoords(coordinates);
      setManualLat(coordinates.lat.toString());
      setManualLng(coordinates.lng.toString());
    }
  }, [coordinates]);

  // Simple map simulation - in a real app, you'd use Leaflet, Google Maps, etc.
  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mapRef.current) return;
    
    const rect = mapRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 360 - 180;
    const y = 90 - ((e.clientY - rect.top) / rect.height) * 180;
    
    const coords = {
      lat: parseFloat(y.toFixed(6)),
      lng: parseFloat(x.toFixed(6))
    };
    
    setSelectedCoords(coords);
    setManualLat(coords.lat.toString());
    setManualLng(coords.lng.toString());
    toast.success(`Coordinates selected: ${coords.lat}, ${coords.lng}`);
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
    toast.success(`Coordinates set manually: ${lat}, ${lng}`);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    
    // Simulate geocoding - in a real app, you'd use a geocoding service
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock search results - you'd replace this with actual geocoding
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

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Select Location</h1>
          <Button variant="outline" onClick={onLogout} className="flex items-center gap-2">
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Interactive Map
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  ref={mapRef}
                  className="w-full h-96 bg-gradient-to-br from-green-200 to-blue-300 relative cursor-crosshair rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-500 transition-colors"
                  onClick={handleMapClick}
                >
                  <div className="absolute inset-0 flex items-center justify-center text-gray-600 pointer-events-none">
                    <div className="text-center">
                      <MapPin className="w-8 h-8 mx-auto mb-2" />
                      <p>Click anywhere to select coordinates</p>
                      {selectedCoords && (
                        <div className="mt-4 p-2 bg-white rounded shadow">
                          <p className="font-semibold">Selected: {selectedCoords.lat}, {selectedCoords.lng}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  {selectedCoords && (
                    <div 
                      className="absolute w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-lg transform -translate-x-2 -translate-y-2"
                      style={{
                        left: `${((selectedCoords.lng + 180) / 360) * 100}%`,
                        top: `${((90 - selectedCoords.lat) / 180) * 100}%`
                      }}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Controls */}
          <div className="space-y-6">
            {/* Search */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Search Location
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search for a city..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button onClick={handleSearch} disabled={isSearching}>
                    {isSearching ? '...' : 'Search'}
                  </Button>
                </div>
                <p className="text-sm text-gray-600">
                  Try: London, Paris, New York, Tokyo
                </p>
              </CardContent>
            </Card>
            
            {/* Manual Coordinates */}
            <Card>
              <CardHeader>
                <CardTitle>Manual Entry</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
              </CardContent>
            </Card>
            
            {/* Continue */}
            {selectedCoords && (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <div className="text-sm text-green-700">
                      <p className="font-semibold">Coordinates Selected:</p>
                      <p>{selectedCoords.lat}, {selectedCoords.lng}</p>
                    </div>
                    <Button onClick={handleContinue} className="w-full bg-green-600 hover:bg-green-700">
                      Continue to Projects
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
