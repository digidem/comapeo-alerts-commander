
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MapAlert {
  id: string;
  name: string;
  coordinates: [number, number];
  projectName: string;
  detectionDateStart: string;
  detectionDateEnd: string;
  sourceId: string;
}

interface AlertPopupProps {
  alert: MapAlert;
  onClose: () => void;
}

export const AlertPopup = ({ alert, onClose }: AlertPopupProps) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return 'Invalid date';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold">Alert Details</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
            aria-label="Close alert details"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-600">Alert Name</p>
            <p className="text-base">{alert.name}</p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-600">Project</p>
            <p className="text-base">{alert.projectName}</p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-600">Coordinates</p>
            <p className="text-base font-mono">{alert.coordinates[1]}, {alert.coordinates[0]}</p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-600">Detection Period</p>
            <p className="text-sm">
              <span className="block">Start: {formatDate(alert.detectionDateStart)}</span>
              <span className="block">End: {formatDate(alert.detectionDateEnd)}</span>
            </p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-600">Source ID</p>
            <p className="text-sm font-mono">{alert.sourceId || 'N/A'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
