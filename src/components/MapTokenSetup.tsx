
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface MapTokenSetupProps {
  mapboxToken: string;
  setMapboxToken: (token: string) => void;
  onTokenSubmit: () => void;
  onLogout: () => void;
}

export const MapTokenSetup = ({ 
  mapboxToken, 
  setMapboxToken, 
  onTokenSubmit, 
  onLogout 
}: MapTokenSetupProps) => {
  const { t } = useTranslation();

  const handleSubmit = () => {
    if (!mapboxToken.trim()) {
      toast.error(t('mapbox.enterValidToken'));
      return;
    }
    onTokenSubmit();
    toast.success(t('mapbox.tokenSetSuccessfully'));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            {t('mapbox.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mapboxToken">{t('mapbox.token')}</Label>
            <Input
              id="mapboxToken"
              type="password"
              placeholder={t('mapbox.tokenPlaceholder')}
              value={mapboxToken}
              onChange={(e) => setMapboxToken(e.target.value)}
            />
            <p className="text-sm text-gray-600">
              {t('mapbox.getTokenFrom')}{' '}
              <a href="https://mapbox.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                mapbox.com
              </a>
            </p>
          </div>
          <Button onClick={handleSubmit} className="w-full">
            {t('mapbox.initializeMap')}
          </Button>
          <Button variant="outline" onClick={onLogout} className="w-full">
            {t('mapbox.backToLogin')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
