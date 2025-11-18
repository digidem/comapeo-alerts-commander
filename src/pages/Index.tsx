import { useState, useEffect, useCallback } from "react";
import { LoginForm } from "@/components/LoginForm";
import { MapInterface } from "@/components/MapInterface";
import { ProjectSelection } from "@/components/ProjectSelection";
import { AlertForm } from "@/components/AlertForm";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { apiService } from "@/services/apiService";
import { Credentials, Project, Coordinates } from "@/types/common";

const Index = () => {
  const { t } = useTranslation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [currentStep, setCurrentStep] = useState<
    "auth" | "map" | "projects" | "alert"
  >("auth");
  const [alertsRefreshKey, setAlertsRefreshKey] = useState(0);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Function to fetch projects
  const fetchProjects = useCallback(
    async (creds: Credentials) => {
      setIsLoadingProjects(true);
      try {
        const fetchedProjects = await apiService.fetchProjects(creds);
        setProjects(fetchedProjects);
      } catch (error) {
        console.error("Error fetching projects:", error);
        toast.error(t("projects.failedToFetch"));
        // Don't prevent navigation to map, just show empty projects
        setProjects([]);
      } finally {
        setIsLoadingProjects(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  // Note: 't' is intentionally excluded to prevent effect re-run on language change
  // The error message will use whatever language is active when the error occurs

  useEffect(() => {
    // Check for stored credentials
    const stored = localStorage.getItem("mapAlert_credentials");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Ensure rememberMe is set (for backwards compatibility with old stored credentials)
        const credentials: Credentials = {
          ...parsed,
          rememberMe: parsed.rememberMe ?? true, // Default to true for stored credentials
        };
        setCredentials(credentials);
        setIsAuthenticated(true);
        setCurrentStep("map");
        // Fetch projects immediately after restoring credentials
        fetchProjects(credentials);
      } catch (error) {
        localStorage.removeItem("mapAlert_credentials");
      }
    }
  }, [fetchProjects]);

  const handleLogin = async (creds: Credentials) => {
    // Clear previous login errors
    setLoginError(null);

    try {
      // Validate credentials by attempting to fetch projects
      await apiService.fetchProjects(creds);

      // If successful, proceed with login
      setCredentials(creds);
      setIsAuthenticated(true);
      setCurrentStep("map");

      if (creds.rememberMe) {
        localStorage.setItem("mapAlert_credentials", JSON.stringify(creds));
      }

      toast.success(t("auth.successfullyAuthenticated"));

      // Fetch projects for the map view
      await fetchProjects(creds);
    } catch (error: any) {
      console.error("Login failed:", error);

      // Set appropriate error message - check most specific errors first
      if (error.response?.status === 401 || error.message?.includes("401") || error.message?.includes("Unauthorized")) {
        setLoginError(t("auth.invalidCredentials"));
      } else if (error.message?.includes("Network error")) {
        setLoginError(t("auth.serverUnreachable"));
      } else {
        setLoginError(t("auth.loginFailed"));
      }

      // Re-throw to signal error to LoginForm
      throw error;
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCredentials(null);
    setProjects([]);
    setSelectedProjects([]);
    setCoordinates(null);
    setCurrentStep("auth");
    localStorage.removeItem("mapAlert_credentials");
    toast.success(t("auth.loggedOutSuccessfully"));
  };

  const handleCoordinatesSet = (
    coords: Coordinates,
    currentSelectedProjectId?: string,
  ) => {
    setCoordinates(coords);
    setCurrentProjectId(currentSelectedProjectId || null);
    setCurrentStep("projects");
  };

  const handleProjectsSelected = (projectIds: string[]) => {
    setSelectedProjects(projectIds);
    setCurrentStep("alert");
  };

  const handleAlertSuccess = () => {
    // Select the first project that had an alert created
    if (selectedProjects.length > 0) {
      localStorage.setItem("selectedProjectId", selectedProjects[0]);
    }

    setCurrentStep("map");
    setCoordinates(null);
    setSelectedProjects([]);
    // Trigger alerts refresh on map
    setAlertsRefreshKey((prev) => prev + 1);
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case "auth":
        return <LoginForm onLogin={handleLogin} error={loginError} />;
      case "map":
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
      case "projects":
        return (
          <ProjectSelection
            credentials={credentials!}
            onProjectsSelected={handleProjectsSelected}
            onBack={() => setCurrentStep("map")}
            projects={projects}
            setProjects={setProjects}
            onLogout={handleLogout}
            defaultSelectedProjectId={currentProjectId}
          />
        );
      case "alert":
        return (
          <AlertForm
            coordinates={coordinates!}
            selectedProjects={selectedProjects}
            credentials={credentials!}
            projects={projects}
            onBack={() => setCurrentStep("projects")}
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
