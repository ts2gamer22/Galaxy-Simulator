// Galaxy configuration and data types
export interface GalaxyConfig {
  starCount: number;
  armCount: number;
  galaxyRadius: number;
  rotationSpeed: number;
  coreSize: number;
  starColors: string[];
  particleSize: number;
  brightness: number;
}

export interface Star {
  position: [number, number, number];
  color: string;
  size: number;
  brightness: number;
  rotationRadius: number;
  angularVelocity: number;
}

export interface CameraState {
  position: [number, number, number];
  target: [number, number, number];
  zoom: number;
  autoRotate: boolean;
  rotationSpeed: number;
}

export const DEFAULT_GALAXY_CONFIG: GalaxyConfig = {
  starCount: 25000,
  armCount: 4,
  galaxyRadius: 100,
  rotationSpeed: 0.1,
  coreSize: 3.5,
  starColors: ['#ffffff', '#ffddaa', '#aaddff'],
  particleSize: 0.1,
  brightness: 1.0
};