import axios, { AxiosInstance, AxiosError } from "axios";
import { Credentials, Project } from "@/types/common";

interface AlertData {
  detectionDateStart: string;
  detectionDateEnd: string;
  sourceId: string;
  metadata: {
    alert_type: string;
  };
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
}

interface MapAlert {
  id: string;
  name: string;
  coordinates: [number, number];
  projectName: string;
  detectionDateStart: string;
  detectionDateEnd: string;
  sourceId: string;
}

interface ApiProject {
  projectId?: string;
  id?: string;
  name?: string;
  title?: string;
}

interface ApiAlert {
  id?: string;
  metadata?: {
    alert_type?: string;
  };
  geometry?: {
    type: "Point";
    coordinates: [number, number];
  };
  detectionDateStart?: string;
  detectionDateEnd?: string;
  sourceId?: string;
}

class ApiService {
  private getApiClient(credentials: Credentials): AxiosInstance {
    const baseURL = this.getBaseUrl(credentials.serverName);

    return axios.create({
      baseURL,
      headers: {
        Authorization: `Bearer ${credentials.bearerToken}`,
        "Content-Type": "application/json",
      },
      // Add timeout and better error handling
      timeout: 30000,
      validateStatus: (status) => status < 500, // Don't throw for 4xx errors
    });
  }

  private getBaseUrl(serverName: string): string {
    // In development, use the proxy to avoid CORS issues
    if (import.meta.env.DEV) {
      return "/api";
    }

    // In production, use the full server URL
    if (
      !serverName.startsWith("http://") &&
      !serverName.startsWith("https://")
    ) {
      return `https://${serverName}`;
    }
    return serverName;
  }

  private handleError(error: unknown, context: string): never {
    if (error instanceof AxiosError) {
      if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        const message =
          error.response.data?.message ||
          error.response.statusText ||
          error.message;
        throw new Error(`${context}: ${status} ${message}`);
      } else if (error.request) {
        // Request was made but no response received (network error)
        throw new Error(`${context}: Network error - ${error.message}`);
      } else {
        // Something else happened
        throw new Error(`${context}: Request setup error - ${error.message}`);
      }
    } else {
      throw new Error(
        `${context}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async fetchProjects(credentials: Credentials): Promise<Project[]> {
    try {
      const apiClient = this.getApiClient(credentials);
      const response = await apiClient.get("/projects");

      // Check if response was successful
      if (response.status >= 400) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseData = response.data;

      // Handle the actual API response format: {"data": [...]}
      let projectsArray: ApiProject[] = [];

      if (responseData.data && Array.isArray(responseData.data)) {
        // Standard format: {"data": [...]}
        projectsArray = responseData.data;
      } else if (Array.isArray(responseData)) {
        // Direct array format: [...]
        projectsArray = responseData;
      } else if (
        responseData.projects &&
        Array.isArray(responseData.projects)
      ) {
        // Alternative format: {"projects": [...]}
        projectsArray = responseData.projects;
      } else {
        throw new Error(
          `Invalid response format. Expected object with 'data' array, got: ${JSON.stringify(responseData)}`,
        );
      }

      // Map the projects to our interface
      return projectsArray.map((project: ApiProject, index: number) => ({
        projectId: project.projectId || project.id || `project-${index}`,
        name: project.name || project.title || `Project ${index + 1}`,
      }));
    } catch (error) {
      console.error("Error fetching projects:", error);
      this.handleError(error, "Failed to fetch projects");
    }
  }

  async createAlert(
    credentials: Credentials,
    projectId: string,
    alertData: AlertData,
  ): Promise<void> {
    try {
      const apiClient = this.getApiClient(credentials);
      await apiClient.post(
        `/projects/${projectId}/remoteDetectionAlerts`,
        alertData,
      );
    } catch (error) {
      console.error(`Error creating alert for project ${projectId}:`, error);
      this.handleError(
        error,
        `Failed to create alert for project ${projectId}`,
      );
    }
  }

  async fetchAlerts(
    credentials: Credentials,
    projects: Project[],
  ): Promise<MapAlert[]> {
    const alerts: MapAlert[] = [];
    const errors: string[] = [];

    for (const project of projects) {
      try {
        const apiClient = this.getApiClient(credentials);
        const response = await apiClient.get(
          `/projects/${project.projectId}/remoteDetectionAlerts`,
        );
        const responseData = response.data;

        // Handle the actual API response format: {"data": [...]}
        let alertsArray: ApiAlert[] = [];

        if (responseData.data && Array.isArray(responseData.data)) {
          // Standard format: {"data": [...]}
          alertsArray = responseData.data;
        } else if (Array.isArray(responseData)) {
          // Direct array format: [...]
          alertsArray = responseData;
        } else if (responseData.alerts && Array.isArray(responseData.alerts)) {
          // Alternative format: {"alerts": [...]}
          alertsArray = responseData.alerts;
        } else {
          console.warn(
            `No alerts found for project ${project.name}. Response:`,
            responseData,
          );
          continue; // Skip this project, don't treat as error
        }

        alertsArray.forEach((alert: ApiAlert) => {
          if (alert.geometry && alert.geometry.coordinates) {
            alerts.push({
              id: alert.id || `${project.projectId}-${Date.now()}`,
              name: alert.metadata?.alert_type || "Alert",
              coordinates: alert.geometry.coordinates,
              projectName: project.name,
              detectionDateStart: alert.detectionDateStart || "",
              detectionDateEnd: alert.detectionDateEnd || "",
              sourceId: alert.sourceId || "",
            });
          }
        });
      } catch (error) {
        const errorMessage = `Error fetching alerts for project ${project.name}: ${error instanceof Error ? error.message : "Unknown error"}`;
        errors.push(errorMessage);
        console.error(errorMessage);
      }
    }

    // Throw error if we couldn't fetch any alerts and there were errors
    if (alerts.length === 0 && errors.length > 0) {
      throw new Error(
        `Failed to fetch alerts from all projects:\n${errors.join("\n")}`,
      );
    }

    // Log errors but don't throw if we got some alerts
    if (errors.length > 0) {
      console.warn("Some projects failed to load alerts:", errors);
    }

    return alerts;
  }
}

export const apiService = new ApiService();
