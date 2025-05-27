
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface Coordinates {
  lat: number;
  lng: number;
}

interface ManualCoordinateEntryProps {
  isOpen: boolean;
  onClose: () => void;
  coordinates: Coordinates | null;
  onCoordinatesSet: (coords: Coordinates) => void;
}

export const ManualCoordinateEntry = ({ 
  isOpen, 
  onClose, 
  coordinates, 
  onCoordinatesSet 
}: ManualCoordinateEntryProps) => {
  const { t } = useTranslation();
  const [manualLat, setManualLat] = useState(coordinates?.lat.toString() || '');
  const [manualLng, setManualLng] = useState(coordinates?.lng.toString() || '');

  const handleManualCoords = () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      toast.error(t('manualCoords.invalidCoordinates'));
      return;
    }
    
    const coords = { lat, lng };
    onCoordinatesSet(coords);
    toast.success(t('map.coordinatesSetManually', { lat: lat.toString(), lng: lng.toString() }));
    onClose();
    
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(100);
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={t('manualCoords.title')}
      className="pb-safe-area-inset-bottom"
    >
      <div className="space-y-6">
        <div className="space-y-3">
          <Label htmlFor="latitude" className="text-base font-medium">{t('manualCoords.latitude')}</Label>
          <Input
            id="latitude"
            type="number"
            step="any"
            placeholder={t('manualCoords.latitudePlaceholder')}
            value={manualLat}
            onChange={(e) => setManualLat(e.target.value)}
            className="text-base h-12"
            autoComplete="off"
          />
        </div>
        <div className="space-y-3">
          <Label htmlFor="longitude" className="text-base font-medium">{t('manualCoords.longitude')}</Label>
          <Input
            id="longitude"
            type="number"
            step="any"
            placeholder={t('manualCoords.longitudePlaceholder')}
            value={manualLng}
            onChange={(e) => setManualLng(e.target.value)}
            className="text-base h-12"
            autoComplete="off"
          />
        </div>
        <Button onClick={handleManualCoords} className="w-full h-12 text-base font-medium">
          {t('manualCoords.setCoordinates')}
        </Button>
      </div>
    </BottomSheet>
  );
};
