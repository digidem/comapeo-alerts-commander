/**
 * Shared type definitions for common interfaces used across the application.
 *
 * This file contains core types used throughout the CoMapeo Alerts Commander
 * application to maintain type consistency and reduce duplication.
 */

/**
 * Credentials interface for CoMapeo API authentication.
 *
 * @property serverName - The URL of the CoMapeo server (e.g., "https://api.example.com")
 * @property bearerToken - The authentication bearer token for API requests
 * @property rememberMe - Whether to persist credentials in localStorage (optional, defaults to false)
 */
export interface Credentials {
  serverName: string;
  bearerToken: string;
  rememberMe: boolean;
}

/**
 * Project interface representing a CoMapeo project.
 *
 * Projects are containers for geospatial data and alerts within the CoMapeo system.
 *
 * @property projectId - Unique identifier for the project
 * @property name - Human-readable name of the project
 */
export interface Project {
  projectId: string;
  name: string;
}

/**
 * Coordinates interface representing geographic coordinates.
 *
 * Uses standard WGS84 coordinate system (latitude/longitude).
 *
 * @property lat - Latitude in decimal degrees (-90 to 90)
 * @property lng - Longitude in decimal degrees (-180 to 180)
 */
export interface Coordinates {
  lat: number;
  lng: number;
}
