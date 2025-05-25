
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ArrowLeft, LogOut, FolderOpen } from 'lucide-react';
import { toast } from 'sonner';
import { apiService } from '@/services/apiService';

interface Credentials {
  serverName: string;
  bearerToken: string;
  rememberMe: boolean;
}

interface Project {
  projectId: string;
  name: string;
}

interface ProjectSelectionProps {
  credentials: Credentials;
  onProjectsSelected: (projectIds: string[]) => void;
  onBack: () => void;
  projects: Project[];
  setProjects: (projects: Project[]) => void;
  onLogout?: () => void;
}

export const ProjectSelection = ({ 
  credentials, 
  onProjectsSelected, 
  onBack, 
  projects, 
  setProjects,
  onLogout 
}: ProjectSelectionProps) => {
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      if (projects.length > 0) return; // Already loaded
      
      setLoading(true);
      try {
        const fetchedProjects = await apiService.fetchProjects(credentials);
        setProjects(fetchedProjects);
        toast.success(`Found ${fetchedProjects.length} projects`);
      } catch (error) {
        console.error('Error fetching projects:', error);
        toast.error('Failed to fetch projects');
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [credentials, projects.length, setProjects]);

  const handleProjectToggle = (projectId: string) => {
    setSelectedProjects(prev => 
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  const handleContinue = () => {
    if (selectedProjects.length === 0) {
      toast.error('Please select at least one project');
      return;
    }
    onProjectsSelected(selectedProjects);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p>Loading projects...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No projects state
  if (projects.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-gray-500 rounded-full flex items-center justify-center">
              <FolderOpen className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="text-xl font-bold">No Projects Available</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-gray-600">
              No projects are available for your account. Please contact your administrator for access.
            </p>
            <div className="space-y-2">
              <Button onClick={onBack} variant="outline" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Map
              </Button>
              {onLogout && (
                <Button onClick={onLogout} variant="outline" className="w-full">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Map
          </Button>
          {onLogout && (
            <Button variant="outline" onClick={onLogout} className="flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Select Projects</CardTitle>
            <p className="text-center text-gray-600">
              Choose which projects to send the alert to
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {projects.map((project) => (
                <div key={project.projectId} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                  <Checkbox
                    id={project.projectId}
                    checked={selectedProjects.includes(project.projectId)}
                    onCheckedChange={() => handleProjectToggle(project.projectId)}
                  />
                  <Label
                    htmlFor={project.projectId}
                    className="flex-1 text-sm font-medium cursor-pointer"
                  >
                    {project.name}
                  </Label>
                </div>
              ))}
            </div>

            {selectedProjects.length > 0 && (
              <div className="mt-6 p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-700 mb-3">
                  Selected {selectedProjects.length} project{selectedProjects.length !== 1 ? 's' : ''}:
                </p>
                <ul className="text-sm text-green-600 space-y-1">
                  {selectedProjects.map(projectId => {
                    const project = projects.find(p => p.projectId === projectId);
                    return (
                      <li key={projectId}>• {project?.name}</li>
                    );
                  })}
                </ul>
              </div>
            )}

            <Button 
              onClick={handleContinue} 
              className="w-full mt-6"
              disabled={selectedProjects.length === 0}
            >
              Continue to Alert Form ({selectedProjects.length} selected)
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
