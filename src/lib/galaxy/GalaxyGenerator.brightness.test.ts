import { describe, it, expect } from 'vitest';
import { generateSpiralArms, addCentralBulge } from './GalaxyGenerator';
import type { GalaxyConfig } from '$lib/types/galaxy';

describe('Galaxy Brightness Tests', () => {
  // Test configurations with different brightness levels
  const lowBrightnessConfig: GalaxyConfig = {
    starCount: 100, // Small count for faster tests
    armCount: 4,
    galaxyRadius: 100,
    rotationSpeed: 0.1,
    coreSize: 10,
    starColors: ['#ffffff', '#ffddaa', '#aaddff'],
    particleSize: 0.1,
    brightness: 0.5 // Low brightness
  };
  
  const highBrightnessConfig: GalaxyConfig = {
    ...lowBrightnessConfig,
    brightness: 2.0 // High brightness
  };
  
  describe('Star brightness affects color intensity', () => {
    it('should generate dimmer stars with low brightness setting', () => {
      // Generate stars with low brightness
      const { colors } = generateSpiralArms(lowBrightnessConfig);
      
      // Calculate average color intensity
      let totalIntensity = 0;
      for (let i = 0; i < colors.length; i += 3) {
        const r = colors[i];
        const g = colors[i + 1];
        const b = colors[i + 2];
        totalIntensity += (r + g + b) / 3;
      }
      const avgIntensity = totalIntensity / (colors.length / 3);
      
      // Low brightness should result in lower average intensity
      expect(avgIntensity).toBeLessThan(0.7);
    });
    
    it('should generate brighter stars with high brightness setting', () => {
      // Generate stars with high brightness
      const { colors } = generateSpiralArms(highBrightnessConfig);
      
      // Calculate average color intensity
      let totalIntensity = 0;
      for (let i = 0; i < colors.length; i += 3) {
        const r = colors[i];
        const g = colors[i + 1];
        const b = colors[i + 2];
        totalIntensity += (r + g + b) / 3;
      }
      const avgIntensity = totalIntensity / (colors.length / 3);
      
      // High brightness should result in higher average intensity
      expect(avgIntensity).toBeGreaterThan(0.5);
    });
    
    it('should have higher intensity with high brightness compared to low brightness', () => {
      // Generate stars with different brightness settings
      const { colors: lowColors } = generateSpiralArms(lowBrightnessConfig);
      const { colors: highColors } = generateSpiralArms(highBrightnessConfig);
      
      // Calculate average intensities
      let lowTotalIntensity = 0;
      let highTotalIntensity = 0;
      
      for (let i = 0; i < lowColors.length; i += 3) {
        const lowR = lowColors[i];
        const lowG = lowColors[i + 1];
        const lowB = lowColors[i + 2];
        lowTotalIntensity += (lowR + lowG + lowB) / 3;
        
        const highR = highColors[i];
        const highG = highColors[i + 1];
        const highB = highColors[i + 2];
        highTotalIntensity += (highR + highG + highB) / 3;
      }
      
      const lowAvgIntensity = lowTotalIntensity / (lowColors.length / 3);
      const highAvgIntensity = highTotalIntensity / (highColors.length / 3);
      
      // High brightness setting should produce higher average intensity
      expect(highAvgIntensity).toBeGreaterThan(lowAvgIntensity);
    });
  });
  
  describe('Central bulge brightness', () => {
    it('should create brighter bulge stars with higher brightness setting', () => {
      // Create bulge stars with different brightness settings
      const lowPositions: number[] = [];
      const lowColors: number[] = [];
      const lowSizes: number[] = [];
      
      const highPositions: number[] = [];
      const highColors: number[] = [];
      const highSizes: number[] = [];
      
      // Add bulge stars with different brightness settings
      addCentralBulge(lowBrightnessConfig, lowPositions, lowColors, lowSizes, 50);
      addCentralBulge(highBrightnessConfig, highPositions, highColors, highSizes, 50);
      
      // Calculate average color intensities
      let lowTotalIntensity = 0;
      let highTotalIntensity = 0;
      
      for (let i = 0; i < lowColors.length; i += 3) {
        const lowR = lowColors[i];
        const lowG = lowColors[i + 1];
        const lowB = lowColors[i + 2];
        lowTotalIntensity += (lowR + lowG + lowB) / 3;
        
        const highR = highColors[i];
        const highG = highColors[i + 1];
        const highB = highColors[i + 2];
        highTotalIntensity += (highR + highG + highB) / 3;
      }
      
      const lowAvgIntensity = lowTotalIntensity / (lowColors.length / 3);
      const highAvgIntensity = highTotalIntensity / (highColors.length / 3);
      
      // High brightness setting should produce brighter bulge stars
      expect(highAvgIntensity).toBeGreaterThan(lowAvgIntensity);
    });
  });
});