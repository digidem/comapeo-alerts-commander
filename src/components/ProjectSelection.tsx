
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, FolderOpen } from 'lucide-react';
import { toast } from 'sonner';
import { apiService } from '@/services/apiService';

interface Project {
  projectId: string;
  name: string;
}

interface Credentials {
  serverName: string;
  bearerToken: string;
}

interface ProjectSelectionProps {
  credentials: Credentials;
  onProjectsSelected: (projectIds: string[]) => void;
  onBack: () => void;
  projects: Project[];
  setProjects: (projects: Project[]) => void;
}

export const ProjectSelection = ({ 
  credentials, 
  onProjectsSelected, 
  onBack, 
  projects, 
  setProjects 
}: ProjectSelectionProps) => {
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const fetchedProjects = await apiService.fetchProjects(credentials);
      setProjects(fetchedProjects);
      toast.success(`Found ${fetchedProjects.length} projects`);
    } catch (error) {
      toast.error('Failed to fetch projects. Please check your credentials.');
      console.error('Error fetching projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
              <p>Loading projects...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Map
          </Button>
          <h1 className="text-3xl font-bold text-gray-800">Select Projects</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5" />
              Available Projects ({projects.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No projects available</p>
                <Button onClick={fetchProjects} className="mt-4">
                  Retry
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-gray-600">
                  Select the projects where you want to create alerts:
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {projects.map((project) => (
                    <Card 
                      key={project.projectId}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedProjects.includes(project.projectId) 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200'
                      }`}
                      onClick={() => handleProjectToggle(project.projectId)}
                    >
                      <CardContent className="pt-4">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            checked={selectedProjects.includes(project.projectId)}
                            onCheckedChange={() => handleProjectToggle(project.projectId)}
                          />
                          <div className="flex-1">
                            <p className="font-medium">{project.name}</p>
                            <p className="text-sm text-gray-500">ID: {project.projectId}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {selectedProjects.length > 0 && (
                  <Card className="border-green-200 bg-green-50">
                    <CardContent className="pt-6">
                      <div className="text-center space-y-4">
                        <div className="text-sm text-green-700">
                          <p className="font-semibold">
                            {selectedProjects.length} project{selectedProjects.length !== 1 ? 's' : ''} selected
                          </p>
                        </div>
                        <Button onClick={handleContinue} className="w-full bg-green-600 hover:bg-green-700">
                          Continue to Alert Form
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
