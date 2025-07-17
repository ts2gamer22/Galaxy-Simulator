import { describe, it, expect } from 'vitest';
import { generateSpiralArms, addCentralBulge, calculateAngularVelocity } from './GalaxyGenerator';
import type { GalaxyConfig } from '$lib/types/galaxy';

describe('Galaxy Generation Algorithms', () => {
  // Default test configuration
  const testConfig: GalaxyConfig = {
    starCount: 1000, // Reduced for faster tests
    armCount: 4,
    galaxyRadius: 100,
    rotationSpeed: 0.1,
    coreSize: 10,
    starColors: ['#ffffff', '#ffddaa', '#aaddff'],
    particleSize: 0.1
  };
  
  describe('generateSpiralArms', () => {
    it('should generate the correct number of stars', () => {
      const { positions } = generateSpiralArms(testConfig);
      // Each star has 3 position values (x, y, z)
      expect(positions.length / 3).toBe(testConfig.starCount);
    });
    
    it('should generate matching colors and sizes arrays', () => {
      const { positions, colors, sizes } = generateSpiralArms(testConfig);
      // Each star has 3 color values (r, g, b)
      expect(colors.length / 3).toBe(positions.length / 3);
      // Each star has 1 size value
      expect(sizes.length).toBe(positions.length / 3);
    });
    
    it('should create stars within the galaxy radius', () => {
      const { positions } = generateSpiralArms(testConfig);
      
      // Check each star's distance from center
      for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const z = positions[i + 2];
        const distance = Math.sqrt(x * x + z * z);
        
        // Allow for some variation due to radiusVariation
        expect(distance).toBeLessThanOrEqual(testConfig.galaxyRadius * 1.2);
      }
    });
    
    it('should distribute stars differently with different arm counts', () => {
      const config4Arms = { ...testConfig, armCount: 4 };
      const config6Arms = { ...testConfig, armCount: 6 };
      
      const result4 = generateSpiralArms(config4Arms);
      const result6 = generateSpiralArms(config6Arms);
      
      // The positions should be different with different arm counts
      // This is a statistical test, so we just check a few random positions
      let differences = 0;
      for (let i = 0; i < 30; i++) {
        if (
          result4.positions[i] !== result6.positions[i] ||
          result4.positions[i + 1] !== result6.positions[i + 1] ||
          result4.positions[i + 2] !== result6.positions[i + 2]
        ) {
          differences++;
        }
      }
      
      // Most positions should be different
      expect(differences).toBeGreaterThan(5);
    });
  });
  
  describe('addCentralBulge', () => {
    it('should add the specified number of bulge stars', () => {
      const initialPositions: number[] = [];
      const initialColors: number[] = [];
      const initialSizes: number[] = [];
      const bulgeStars = 500;
      
      const { positions, colors, sizes } = addCentralBulge(
        testConfig, 
        initialPositions, 
        initialColors, 
        initialSizes, 
        bulgeStars
      );
      
      // Check that the correct number of stars were added
      expect(positions.length / 3).toBe(bulgeStars);
      expect(colors.length / 3).toBe(bulgeStars);
      expect(sizes.length).toBe(bulgeStars);
    });
    
    it('should create bulge stars within the core size', () => {
      const initialPositions: number[] = [];
      const initialColors: number[] = [];
      const initialSizes: number[] = [];
      const bulgeStars = 500;
      
      const { positions } = addCentralBulge(
        testConfig, 
        initialPositions, 
        initialColors, 
        initialSizes, 
        bulgeStars
      );
      
      // Check each bulge star's distance from center
      for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const y = positions[i + 1];
        const z = positions[i + 2];
        const distance = Math.sqrt(x * x + y * y + z * z);
        
        // Bulge stars should be within the core size
        expect(distance).toBeLessThanOrEqual(testConfig.coreSize * 1.2);
      }
    });
    
    it('should create larger stars for the bulge', () => {
      const initialPositions: number[] = [];
      const initialColors: number[] = [];
      const initialSizes: number[] = [];
      const bulgeStars = 500;
      
      const { sizes } = addCentralBulge(
        testConfig, 
        initialPositions, 
        initialColors, 
        initialSizes, 
        bulgeStars
      );
      
      // Check that bulge stars are larger than the base particle size
      for (let i = 0; i < sizes.length; i++) {
        expect(sizes[i]).toBeGreaterThan(testConfig.particleSize);
      }
    });
  });
  
  describe('calculateAngularVelocity', () => {
    it('should return zero velocity at center', () => {
      const velocity = calculateAngularVelocity(0, testConfig.rotationSpeed);
      expect(velocity).toBe(0);
    });
    
    it('should increase linearly in the core region', () => {
      const v1 = calculateAngularVelocity(2, testConfig.rotationSpeed);
      const v2 = calculateAngularVelocity(4, testConfig.rotationSpeed);
      const v3 = calculateAngularVelocity(6, testConfig.rotationSpeed);
      
      // Velocity should increase linearly with radius in the core
      expect(v2 / v1).toBeCloseTo(2, 1);
      expect(v3 / v2).toBeCloseTo(1.5, 1);
    });
    
    it('should be constant in the mid region', () => {
      const v1 = calculateAngularVelocity(15, testConfig.rotationSpeed);
      const v2 = calculateAngularVelocity(20, testConfig.rotationSpeed);
      const v3 = calculateAngularVelocity(25, testConfig.rotationSpeed);
      
      // Velocity should be constant in the mid region
      expect(v1).toBeCloseTo(v2, 5);
      expect(v2).toBeCloseTo(v3, 5);
      expect(v1).toBeCloseTo(testConfig.rotationSpeed, 5);
    });
    
    it('should decrease in the outer region', () => {
      const v1 = calculateAngularVelocity(40, testConfig.rotationSpeed);
      const v2 = calculateAngularVelocity(80, testConfig.rotationSpeed);
      
      // Velocity should decrease with radius in the outer region
      expect(v1).toBeGreaterThan(v2);
    });
    
    it('should scale with the rotation speed parameter', () => {
      const speed1 = 0.1;
      const speed2 = 0.2;
      
      const v1 = calculateAngularVelocity(20, speed1);
      const v2 = calculateAngularVelocity(20, speed2);
      
      // Velocity should scale linearly with rotation speed
      expect(v2 / v1).toBeCloseTo(2, 5);
    });
  });
});