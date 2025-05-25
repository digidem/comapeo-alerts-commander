
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, AlertTriangle, CheckCircle } from 'lucide-react';
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResults, setSubmissionResults] = useState<{ projectId: string; success: boolean; error?: string }[]>([]);

  const validateSlug = (value: string): boolean => {
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    return slugRegex.test(value);
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

    setIsSubmitting(true);
    const results: { projectId: string; success: boolean; error?: string }[] = [];

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
          
          results.push({ projectId, success: true });
        } catch (error) {
          results.push({ 
            projectId, 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      setSubmissionResults(results);
      
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;
      
      if (successCount > 0) {
        toast.success(`Successfully created ${successCount} alert${successCount !== 1 ? 's' : ''}`);
      }
      
      if (failureCount > 0) {
        toast.error(`Failed to create ${failureCount} alert${failureCount !== 1 ? 's' : ''}`);
      }
      
    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error('Error creating alerts:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewAlert = () => {
    setStartTime('');
    setEndTime('');
    setSourceId('');
    setAlertName('');
    setSubmissionResults([]);
    onSuccess();
  };

  const selectedProjectNames = projects.filter(p => selectedProjects.includes(p.projectId));

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Projects
          </Button>
          <h1 className="text-3xl font-bold text-gray-800">Create Alert</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Alert Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Alert Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Detection Start Time</Label>
                  <Input
                    id="startTime"
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
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
                  />
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
                    className={!alertName || validateSlug(alertName) ? '' : 'border-red-500'}
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

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isSubmitting || !validateSlug(alertName)}
                >
                  {isSubmitting ? 'Creating Alerts...' : `Create Alert for ${selectedProjects.length} Project${selectedProjects.length !== 1 ? 's' : ''}`}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Summary */}
          <div className="space-y-6">
            {/* Location Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Location</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">Coordinates:</p>
                <p className="font-mono">{coordinates.lat}, {coordinates.lng}</p>
              </CardContent>
            </Card>

            {/* Projects Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Selected Projects ({selectedProjects.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {selectedProjectNames.map((project) => (
                    <div key={project.projectId} className="flex items-center justify-between">
                      <span className="text-sm">{project.name}</span>
                      <span className="text-xs text-gray-500 font-mono">{project.projectId}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Submission Results */}
            {submissionResults.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Submission Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {submissionResults.map((result) => {
                      const project = projects.find(p => p.projectId === result.projectId);
                      return (
                        <div key={result.projectId} className="flex items-center gap-2">
                          {result.success ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                          )}
                          <span className="text-sm flex-1">
                            {project?.name || result.projectId}
                          </span>
                          {!result.success && result.error && (
                            <span className="text-xs text-red-600">{result.error}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  {submissionResults.some(r => r.success) && (
                    <Button onClick={handleNewAlert} className="w-full mt-4">
                      Create New Alert
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
