import * as THREE from 'three';
import type { GalaxyConfig } from '$lib/types/galaxy';

/**
 * Generates spiral arm positions, colors, and sizes based on galaxy configuration
 */
export function generateSpiralArms(config: GalaxyConfig, tightness: number = 0.3) {
  const positions: number[] = [];
  const colors: number[] = [];
  const sizes: number[] = [];
  const starCount = config.starCount;
  const armCount = config.armCount;
  
  // Adjust tightness based on arm count to make differences more visible
  const adjustedTightness = tightness * (1 + (armCount - 2) * 0.05);
  
  // Generate stars for each spiral arm
  for (let i = 0; i < starCount; i++) {
    // Determine which arm this star belongs to
    const armIndex = Math.floor(Math.random() * armCount);
    const armAngleOffset = (armIndex * 2 * Math.PI) / armCount;
    
    // Distance from center (0 to galaxyRadius)
    const radius = Math.random() * config.galaxyRadius;
    
    // Spiral angle based on distance and tightness
    const spiralAngle = armAngleOffset + (radius * adjustedTightness);
    
    // Add some random variation to make it look natural
    // Reduce variation for higher arm counts to make arms more distinct
    const angleVariation = (Math.random() - 0.5) * 0.5 * (3 / armCount);
    const radiusVariation = (Math.random() - 0.5) * 10;
    
    const finalAngle = spiralAngle + angleVariation;
    const finalRadius = Math.max(0, radius + radiusVariation);
    
    // Convert polar to cartesian coordinates
    const x = Math.cos(finalAngle) * finalRadius;
    const z = Math.sin(finalAngle) * finalRadius;
    
    // Add vertical variation for galaxy thickness
    const y = (Math.random() - 0.5) * 5 * Math.exp(-finalRadius / 30);
    
    positions.push(x, y, z);
    
    // Star color based on distance from center (stellar classification)
    const distanceRatio = finalRadius / config.galaxyRadius;
    let color: THREE.Color;
    
    if (distanceRatio < 0.3) {
      // Core region - bright white/yellow stars
      color = new THREE.Color().lerpColors(
        new THREE.Color(0xffffff), 
        new THREE.Color(0xffddaa), 
        Math.random()
      );
    } else if (distanceRatio < 0.7) {
      // Mid region - mix of colors
      const colorIndex = Math.floor(Math.random() * config.starColors.length);
      color = new THREE.Color(config.starColors[colorIndex]);
    } else {
      // Outer region - use a mix of custom colors and cooler stars
      // This ensures all stars at the edge are properly colored
      if (Math.random() < 0.7) {
        // 70% chance to use custom colors for better visibility at edges
        const colorIndex = Math.floor(Math.random() * config.starColors.length);
        color = new THREE.Color(config.starColors[colorIndex]);
        // Make them slightly dimmer at the edges
        color.multiplyScalar(0.85);
      } else {
        // 30% chance for cooler, bluer stars
        color = new THREE.Color().lerpColors(
          new THREE.Color(0xaaddff), 
          new THREE.Color(0x6699cc), 
          Math.random()
        );
      }
    }
    
    // Apply brightness factor to the color
    const brightnessValue = config.brightness || 1.0; // Default to 1.0 if not specified
    color.multiplyScalar(brightnessValue);
    
    colors.push(color.r, color.g, color.b);
    
    // Star size based on distance from center and brightness
    const baseSize = config.particleSize;
    const sizeVariation = Math.random() * 2 + 0.5; // 0.5 to 2.5 multiplier
    const distanceSize = distanceRatio < 0.3 ? 1.5 : (distanceRatio < 0.7 ? 1.2 : 1.0);
    const finalSize = baseSize * sizeVariation * distanceSize;
    
    sizes.push(finalSize);
  }
  
  return { positions, colors, sizes };
}

/**
 * Adds a central bulge of stars to the galaxy
 */
export function addCentralBulge(
  config: GalaxyConfig,
  positions: number[], 
  colors: number[], 
  sizes: number[], 
  bulgeStars: number = 5000
) {
  // Add dense central bulge
  for (let i = 0; i < bulgeStars; i++) {
    // Use exponential distribution for realistic bulge density
    const radius = Math.random() * Math.random() * config.coreSize;
    const theta = Math.random() * 2 * Math.PI;
    const phi = Math.acos(2 * Math.random() - 1);
    
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi) * 0.3; // Flatten the bulge
    const z = radius * Math.sin(phi) * Math.sin(theta);
    
    positions.push(x, y, z);
    
    // Central bulge stars are typically older, redder stars
    const color = new THREE.Color().lerpColors(
      new THREE.Color(0xffaa66), 
      new THREE.Color(0xff8844), 
      Math.random()
    );
    
    // Apply brightness factor to the color
    const brightnessValue = config.brightness || 1.0; // Default to 1.0 if not specified
    color.multiplyScalar(brightnessValue);
    
    colors.push(color.r, color.g, color.b);
    
    // Central bulge stars are larger and brighter
    const bulgeSize = config.particleSize * (1.5 + Math.random());
    sizes.push(bulgeSize);
  }
  
  return { positions, colors, sizes };
}

/**
 * Calculates angular velocity for differential rotation based on radius
 */
export function calculateAngularVelocity(radius: number, rotationSpeed: number): number {
  // Realistic galaxy rotation curve
  // Inner regions rotate faster, outer regions slower
  const maxVelocity = rotationSpeed;
  
  if (radius < 10) {
    // Solid body rotation in the core
    return maxVelocity * (radius / 10);
  } else if (radius < 30) {
    // Peak velocity region
    return maxVelocity;
  } else {
    // Declining velocity in outer regions (flat rotation curve approximation)
    return maxVelocity * Math.pow(30 / radius, 0.3);
  }
}