import { useState, useEffect } from 'react';
import { LoginForm } from '@/components/LoginForm';
import { MapInterface } from '@/components/MapInterface';
import { ProjectSelection } from '@/components/ProjectSelection';
import { AlertForm } from '@/components/AlertForm';
import { toast } from 'sonner';

interface Credentials {
  serverName: string;
  bearerToken: string;
  rememberMe: boolean;
}

interface Project {
  projectId: string;
  name: string;
}

interface Coordinates {
  lat: number;
  lng: number;
}

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [currentStep, setCurrentStep] = useState<'auth' | 'map' | 'projects' | 'alert'>('auth');

  useEffect(() => {
    // Check for stored credentials
    const stored = localStorage.getItem('mapAlert_credentials');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setCredentials(parsed);
        setIsAuthenticated(true);
        setCurrentStep('map');
      } catch (error) {
        localStorage.removeItem('mapAlert_credentials');
      }
    }
  }, []);

  const handleLogin = (creds: Credentials) => {
    setCredentials(creds);
    setIsAuthenticated(true);
    setCurrentStep('map');
    
    if (creds.rememberMe) {
      localStorage.setItem('mapAlert_credentials', JSON.stringify(creds));
    }
    
    toast.success('Successfully authenticated');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCredentials(null);
    setProjects([]);
    setSelectedProjects([]);
    setCoordinates(null);
    setCurrentStep('auth');
    localStorage.removeItem('mapAlert_credentials');
    toast.success('Logged out successfully');
  };

  const handleCoordinatesSet = (coords: Coordinates) => {
    setCoordinates(coords);
    setCurrentStep('projects');
  };

  const handleProjectsSelected = (projectIds: string[]) => {
    setSelectedProjects(projectIds);
    setCurrentStep('alert');
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'auth':
        return <LoginForm onLogin={handleLogin} />;
      case 'map':
        return (
          <MapInterface
            onCoordinatesSet={handleCoordinatesSet}
            onLogout={handleLogout}
            coordinates={coordinates}
          />
        );
      case 'projects':
        return (
          <ProjectSelection
            credentials={credentials!}
            onProjectsSelected={handleProjectsSelected}
            onBack={() => setCurrentStep('map')}
            projects={projects}
            setProjects={setProjects}
            onLogout={handleLogout}
          />
        );
      case 'alert':
        return (
          <AlertForm
            coordinates={coordinates!}
            selectedProjects={selectedProjects}
            credentials={credentials!}
            projects={projects}
            onBack={() => setCurrentStep('projects')}
            onSuccess={() => {
              setCurrentStep('map');
              setCoordinates(null);
              setSelectedProjects([]);
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {renderCurrentStep()}
    </div>
  );
};

export default Index;
