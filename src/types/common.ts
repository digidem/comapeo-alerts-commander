/**
 * Shared type definitions for common interfaces used across the application
 */

/**
 * Credentials interface for API authentication
 */
export interface Credentials {
  serverName: string;
  bearerToken: string;
  rememberMe?: boolean;
}

/**
 * Project interface representing a CoMapeo project
 */
export interface Project {
  projectId: string;
  name: string;
}
