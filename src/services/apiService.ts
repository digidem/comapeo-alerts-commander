
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
        throw new Error(`HTTP error! status: ${response.status}`);
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
        // Fallback for demo purposes
        return [
          { projectId: 'demo-project-1', name: 'Demo Project 1' },
          { projectId: 'demo-project-2', name: 'Demo Project 2' },
          { projectId: 'demo-project-3', name: 'Demo Project 3' }
        ];
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      // Return demo projects for development/testing
      return [
        { projectId: 'demo-project-1', name: 'Demo Project 1' },
        { projectId: 'demo-project-2', name: 'Demo Project 2' },
        { projectId: 'demo-project-3', name: 'Demo Project 3' }
      ];
    }
  }

  async createAlert(credentials: Credentials, projectId: string, alertData: AlertData): Promise<void> {
    const baseUrl = this.getBaseUrl(credentials.serverName);
    
    try {
      const response = await fetch(`${baseUrl}/projects/${projectId}/alerts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${credentials.bearerToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(alertData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      // For demo purposes, we'll simulate success
      console.log(`Alert created successfully for project ${projectId}:`, alertData);
    } catch (error) {
      console.error(`Error creating alert for project ${projectId}:`, error);
      
      // For demo purposes, we'll simulate success in development
      if (credentials.serverName.includes('demo') || credentials.serverName.includes('localhost')) {
        console.log(`Demo mode: Alert would be created for project ${projectId}:`, alertData);
        return;
      }
      
      throw error;
    }
  }
}

export const apiService = new ApiService();
