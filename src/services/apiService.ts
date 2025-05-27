
interface Credentials {
  serverName: string;
  bearerToken: string;
}

interface Project {
  projectId: string;
  name: string;
}

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

class ApiService {
  private getBaseUrl(serverName: string): string {
    // Ensure the server name includes protocol
    if (!serverName.startsWith('http://') && !serverName.startsWith('https://')) {
      return `https://${serverName}`;
    }
    return serverName;
  }

  async fetchProjects(credentials: Credentials): Promise<Project[]> {
    const baseUrl = this.getBaseUrl(credentials.serverName);
    
    try {
      const response = await fetch(`${baseUrl}/projects`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${credentials.bearerToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch projects: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ''}`);
      }

      const data = await response.json();
      
      // Handle different possible response formats
      if (Array.isArray(data)) {
        return data.map((project, index) => ({
          projectId: project.id || project.projectId || `project-${index}`,
          name: project.name || project.title || `Project ${index + 1}`
        }));
      } else if (data.projects && Array.isArray(data.projects)) {
        return data.projects.map((project: any, index: number) => ({
          projectId: project.id || project.projectId || `project-${index}`,
          name: project.name || project.title || `Project ${index + 1}`
        }));
      } else {
        throw new Error('Invalid response format: expected array of projects or object with projects property');
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred while fetching projects');
    }
  }

  async createAlert(credentials: Credentials, projectId: string, alertData: AlertData): Promise<void> {
    const baseUrl = this.getBaseUrl(credentials.serverName);
    
    try {
      const response = await fetch(`${baseUrl}/projects/${projectId}/remoteDetectionAlerts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${credentials.bearerToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(alertData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create alert for project ${projectId}: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ''}`);
      }

      console.log(`Alert created successfully for project ${projectId}:`, alertData);
    } catch (error) {
      console.error(`Error creating alert for project ${projectId}:`, error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Unknown error occurred while creating alert for project ${projectId}`);
    }
  }

  async fetchAlerts(credentials: Credentials, projects: Project[]): Promise<MapAlert[]> {
    const alerts: MapAlert[] = [];
    const errors: string[] = [];
    
    for (const project of projects) {
      try {
        const baseUrl = this.getBaseUrl(credentials.serverName);
        const response = await fetch(`${baseUrl}/projects/${project.projectId}/remoteDetectionAlerts`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${credentials.bearerToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          const errorMessage = `Failed to fetch alerts for ${project.name}: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ''}`;
          errors.push(errorMessage);
          console.error(errorMessage);
          continue;
        }

        const data = await response.json();
        const projectAlerts = Array.isArray(data) ? data : data.alerts || [];
        
        projectAlerts.forEach((alert: any) => {
          if (alert.geometry && alert.geometry.coordinates) {
            alerts.push({
              id: alert.id || `${project.projectId}-${Date.now()}`,
              name: alert.metadata?.alert_type || 'Alert',
              coordinates: alert.geometry.coordinates,
              projectName: project.name,
              detectionDateStart: alert.detectionDateStart || '',
              detectionDateEnd: alert.detectionDateEnd || '',
              sourceId: alert.sourceId || ''
            });
          }
        });
      } catch (error) {
        const errorMessage = `Error fetching alerts for project ${project.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMessage);
        console.error(errorMessage);
      }
    }

    // Throw error if we couldn't fetch any alerts and there were errors
    if (alerts.length === 0 && errors.length > 0) {
      throw new Error(`Failed to fetch alerts from all projects:\n${errors.join('\n')}`);
    }

    // Log errors but don't throw if we got some alerts
    if (errors.length > 0) {
      console.warn('Some projects failed to load alerts:', errors);
    }

    return alerts;
  }
}

export const apiService = new ApiService();
