
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Copy, CheckCircle, X, Loader } from 'lucide-react';
import { toast } from 'sonner';
import { apiService } from '@/services/apiService';

interface Coordinates {
  lat: number;
  lng: number;
}

interface Credentials {
  serverName: string;
  bearerToken: string;
}

interface Project {
  projectId: string;
  name: string;
}

interface AlertFormProps {
  coordinates: Coordinates;
  selectedProjects: string[];
  credentials: Credentials;
  projects: Project[];
  onBack: () => void;
  onSuccess: () => void;
}

type SubmissionState = 'idle' | 'loading' | 'success' | 'error' | 'partial';

export const AlertForm = ({ 
  coordinates, 
  selectedProjects, 
  credentials, 
  projects,
  onBack, 
  onSuccess 
}: AlertFormProps) => {
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [sourceId, setSourceId] = useState('');
  const [alertName, setAlertName] = useState('');
  const [submissionState, setSubmissionState] = useState<SubmissionState>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const validateSlug = (value: string): boolean => {
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    return slugRegex.test(value);
  };

  const copyCoordinates = async () => {
    const coordText = `${coordinates.lat}, ${coordinates.lng}`;
    try {
      await navigator.clipboard.writeText(coordText);
      toast.success('Coordinates copied to clipboard');
      
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    } catch (error) {
      toast.error('Failed to copy coordinates');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!startTime || !endTime || !sourceId || !alertName) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!validateSlug(alertName)) {
      toast.error('Alert name must be in slug format (lowercase letters, numbers, and hyphens only)');
      return;
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (start >= end) {
      toast.error('End time must be after start time');
      return;
    }

    setSubmissionState('loading');
    setErrorMessage('');

    let successCount = 0;
    let errorCount = 0;

    try {
      for (const projectId of selectedProjects) {
        try {
          await apiService.createAlert(credentials, projectId, {
            detectionDateStart: start.toISOString(),
            detectionDateEnd: end.toISOString(),
            sourceId,
            metadata: {
              alert_type: alertName
            },
            geometry: {
              type: "Point",
              coordinates: [coordinates.lng, coordinates.lat]
            }
          });
          
          successCount++;
        } catch (error) {
          errorCount++;
          console.error(`Failed to create alert for project ${projectId}:`, error);
        }
      }

      // Determine final state
      if (successCount === selectedProjects.length) {
        setSubmissionState('success');
        toast.success(`Successfully created alert for ${successCount} project${successCount !== 1 ? 's' : ''}`);
        
        // Haptic feedback for success
        if ('vibrate' in navigator) {
          navigator.vibrate([50, 100, 50]);
        }
        
        // Auto-navigate back after success
        setTimeout(() => {
          onSuccess();
        }, 2000);
      } else if (successCount > 0) {
        setSubmissionState('partial');
        setErrorMessage(`Created alert for ${successCount} project${successCount !== 1 ? 's' : ''}, failed for ${errorCount}`);
      } else {
        setSubmissionState('error');
        setErrorMessage('Failed to create alert for any project');
      }
      
    } catch (error) {
      setSubmissionState('error');
      setErrorMessage('An unexpected error occurred');
      console.error('Error creating alerts:', error);
    }
  };

  const getButtonContent = () => {
    switch (submissionState) {
      case 'loading':
        return (
          <>
            <Loader className="w-4 h-4 animate-spin" />
            Creating alerts...
          </>
        );
      case 'success':
        return (
          <>
            <CheckCircle className="w-4 h-4" />
            Alert created successfully
          </>
        );
      case 'error':
      case 'partial':
        return (
          <>
            <X className="w-4 h-4" />
            {submissionState === 'partial' ? 'Partially completed' : 'Creation failed'}
          </>
        );
      default:
        return `Submit Alert to ${selectedProjects.length} Project${selectedProjects.length !== 1 ? 's' : ''}`;
    }
  };

  const getButtonVariant = () => {
    switch (submissionState) {
      case 'success':
        return 'default';
      case 'error':
      case 'partial':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const selectedProjectNames = projects
    .filter(p => selectedProjects.includes(p.projectId))
    .map(p => p.name);

  const projectsText = selectedProjectNames.length > 2 
    ? `${selectedProjectNames.slice(0, 2).join(', ')} and ${selectedProjectNames.length - 2} more`
    : selectedProjectNames.join(', ');

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-gray-800">Create Alert</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Alert Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Location & Projects Summary */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Location:</p>
                  <p className="font-mono text-sm">{coordinates.lat}, {coordinates.lng}</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={copyCoordinates}
                  className="flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  Copy
                </Button>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">
                  Selected Projects ({selectedProjects.length}):
                </p>
                <p className="text-sm text-gray-800">{projectsText}</p>
              </div>
            </div>

            {/* Alert Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Detection Start Time</Label>
                  <Input
                    id="startTime"
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endTime">Detection End Time</Label>
                  <Input
                    id="endTime"
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                    className="h-12"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sourceId">Source ID</Label>
                <Input
                  id="sourceId"
                  type="text"
                  placeholder="3daada86-2216-4889-b501-bc91ceb13c8f"
                  value={sourceId}
                  onChange={(e) => setSourceId(e.target.value)}
                  required
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="alertName">Alert Name (slug format)</Label>
                <Input
                  id="alertName"
                  type="text"
                  placeholder="fire-detection"
                  value={alertName}
                  onChange={(e) => setAlertName(e.target.value)}
                  className={`h-12 ${!alertName || validateSlug(alertName) ? '' : 'border-red-500'}`}
                  required
                />
                <p className="text-sm text-gray-600">
                  Use lowercase letters, numbers, and hyphens only
                </p>
                {alertName && !validateSlug(alertName) && (
                  <p className="text-sm text-red-600">
                    Invalid format. Example: fire-detection
                  </p>
                )}
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-700">{errorMessage}</p>
                </div>
              )}

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full h-12 text-base font-medium" 
                disabled={submissionState === 'loading' || !validateSlug(alertName)}
                variant={getButtonVariant()}
              >
                {getButtonContent()}
              </Button>

              {(submissionState === 'error' || submissionState === 'partial') && (
                <Button 
                  type="button"
                  variant="outline"
                  className="w-full h-12"
                  onClick={() => {
                    setSubmissionState('idle');
                    setErrorMessage('');
                  }}
                >
                  Try Again
                </Button>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
