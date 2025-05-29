import { useState, useEffect } from 'react';
import { LoginForm } from '@/components/LoginForm';
import { MapInterface } from '@/components/MapInterface';
import { ProjectSelection } from '@/components/ProjectSelection';
import { AlertForm } from '@/components/AlertForm';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
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

interface Coordinates {
  lat: number;
  lng: number;
}

const Index = () => {
  const { t } = useTranslation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [currentStep, setCurrentStep] = useState<'auth' | 'map' | 'projects' | 'alert'>('auth');
  const [alertsRefreshKey, setAlertsRefreshKey] = useState(0);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);

  // Function to fetch projects
  const fetchProjects = async (creds: Credentials) => {
    setIsLoadingProjects(true);
    try {
      const fetchedProjects = await apiService.fetchProjects(creds);
      setProjects(fetchedProjects);
      console.log(`Fetched ${fetchedProjects.length} projects for MapInterface`);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error(t('projects.failedToFetch'));
      // Don't prevent navigation to map, just show empty projects
      setProjects([]);
    } finally {
      setIsLoadingProjects(false);
    }
  };

  useEffect(() => {
    // Check for stored credentials
    const stored = localStorage.getItem('mapAlert_credentials');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setCredentials(parsed);
        setIsAuthenticated(true);
        setCurrentStep('map');
        // Fetch projects immediately after restoring credentials
        fetchProjects(parsed);
      } catch (error) {
        localStorage.removeItem('mapAlert_credentials');
      }
    }
  }, []);

  const handleLogin = async (creds: Credentials) => {
    setCredentials(creds);
    setIsAuthenticated(true);
    setCurrentStep('map');

    if (creds.rememberMe) {
      localStorage.setItem('mapAlert_credentials', JSON.stringify(creds));
    }

    toast.success(t('auth.successfullyAuthenticated'));

    // Fetch projects immediately after successful login
    await fetchProjects(creds);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCredentials(null);
    setProjects([]);
    setSelectedProjects([]);
    setCoordinates(null);
    setCurrentStep('auth');
    localStorage.removeItem('mapAlert_credentials');
    toast.success(t('auth.loggedOutSuccessfully'));
  };

  const handleCoordinatesSet = (coords: Coordinates) => {
    setCoordinates(coords);
    setCurrentStep('projects');
  };

  const handleProjectsSelected = (projectIds: string[]) => {
    setSelectedProjects(projectIds);
    setCurrentStep('alert');
  };

  const handleAlertSuccess = () => {
    setCurrentStep('map');
    setCoordinates(null);
    setSelectedProjects([]);
    // Trigger alerts refresh on map
    setAlertsRefreshKey(prev => prev + 1);
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
            credentials={credentials}
            projects={projects}
            isLoadingProjects={isLoadingProjects}
            key={alertsRefreshKey}
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
            onSuccess={handleAlertSuccess}
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
