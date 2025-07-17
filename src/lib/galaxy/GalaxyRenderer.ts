import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { generateSpiralArms, addCentralBulge, calculateAngularVelocity } from './GalaxyGenerator';
import { RenderingOptimizer } from './RenderingOptimizer';
import type { GalaxyConfig } from '$lib/types/galaxy';

/**
 * Handles the rendering of the galaxy with advanced optimizations
 */
export class GalaxyRenderer {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private galaxyGroup: THREE.Group;
  private clock: THREE.Clock;
  private renderingOptimizer: RenderingOptimizer;
  private animationFrameId: number | null = null;
  private galaxyConfig: GalaxyConfig;
  
  // Star data
  private positions: Float32Array = new Float32Array();
  private colors: Float32Array = new Float32Array();
  private sizes: Float32Array = new Float32Array();
  private rotationRadii: Float32Array = new Float32Array();
  private angularVelocities: Float32Array = new Float32Array();
  
  // Performance monitoring
  private frameCount = 0;
  private lastFpsTime = 0;
  private fps = 0;
  private lowPerformanceMode = false;
  
  constructor(container: HTMLElement, config: GalaxyConfig) {
    this.galaxyConfig = config;
    
    // Initialize Three.js components
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000005);
    
    // Camera setup
    this.camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 30, 100);
    
    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);
    
    // Controls setup
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 20;
    this.controls.maxDistance = 300;
    
    // Galaxy group to hold all stars
    this.galaxyGroup = new THREE.Group();
    this.scene.add(this.galaxyGroup);
    
    // Clock for animation
    this.clock = new THREE.Clock();
    
    // Initialize rendering optimizer
    this.renderingOptimizer = new RenderingOptimizer();
    
    // Generate initial galaxy
    this.generateGalaxy();
    
    // Start animation loop
    this.animate();
    
    // Handle window resize
    window.addEventListener('resize', () => this.handleResize(container));
    
    // Start performance monitoring
    this.monitorPerformance();
  }
  
  /**
   * Generates the galaxy based on current configuration
   */
  generateGalaxy(): void {
    // Clear previous galaxy
    while (this.galaxyGroup.children.length > 0) {
      const object = this.galaxyGroup.children[0];
      if (object instanceof THREE.Mesh) {
        if (object.geometry) object.geometry.dispose();
        if (object.material instanceof THREE.Material) {
          object.material.dispose();
        } else if (Array.isArray(object.material)) {
          object.material.forEach(material => material.dispose());
        }
      }
      this.galaxyGroup.remove(object);
    }
    
    // Generate spiral arms
    const spiralData = generateSpiralArms(this.galaxyConfig);
    
    // Add central bulge
    const bulgeStars = Math.floor(this.galaxyConfig.starCount * 0.2); // 20% of stars in bulge
    const galaxyData = addCentralBulge(
      this.galaxyConfig,
      spiralData.positions,
      spiralData.colors,
      spiralData.sizes,
      bulgeStars
    );
    
    // Convert to typed arrays for better performance
    this.positions = new Float32Array(galaxyData.positions);
    this.colors = new Float32Array(galaxyData.colors);
    this.sizes = new Float32Array(galaxyData.sizes);
    
    // Calculate rotation data
    const totalStars = this.positions.length / 3;
    this.rotationRadii = new Float32Array(totalStars);
    this.angularVelocities = new Float32Array(totalStars);
    
    for (let i = 0; i < totalStars; i++) {
      const x = this.positions[i * 3];
      const z = this.positions[i * 3 + 1];
      
      // Calculate radius from center
      const radius = Math.sqrt(x * x + z * z);
      this.rotationRadii[i] = radius;
      
      // Calculate angular velocity based on radius
      this.angularVelocities[i] = calculateAngularVelocity(
        radius,
        this.galaxyConfig.rotationSpeed
      );
    }
  }
  
  /**
   * Updates the galaxy configuration
   */
  updateConfig(config: GalaxyConfig): void {
    this.galaxyConfig = config;
    this.generateGalaxy();
  }
  
  /**
   * Animates the galaxy rotation
   */
  animate(): void {
    this.animationFrameId = requestAnimationFrame(() => this.animate());
    
    // Get elapsed time
    const elapsedTime = this.clock.getElapsedTime();
    
    // Update controls
    this.controls.update();
    
    // Update star positions based on rotation
    this.updateStarPositions(elapsedTime);
    
    // Render the scene with optimizations
    this.renderWithOptimizations();
    
    // Monitor performance
    this.frameCount++;
    if (elapsedTime - this.lastFpsTime >= 1) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastFpsTime = elapsedTime;
      
      // Adjust quality based on performance
      this.adjustQualityBasedOnPerformance();
    }
  }
  
  /**
   * Updates star positions based on differential rotation
   */
  private updateStarPositions(elapsedTime: number): void {
    const totalStars = this.positions.length / 3;
    
    for (let i = 0; i < totalStars; i++) {
      const radius = this.rotationRadii[i];
      
      // Skip stars with zero radius (at exact center)
      if (radius < 0.1) continue;
      
      const angularVelocity = this.angularVelocities[i];
      const angle = elapsedTime * angularVelocity;
      
      // Get original x, z coordinates
      const x = this.positions[i * 3];
      const z = this.positions[i * 3 + 2];
      
      // Calculate current angle
      const currentAngle = Math.atan2(z, x);
      
      // Calculate new angle
      const newAngle = currentAngle + angle;
      
      // Update position
      this.positions[i * 3] = Math.cos(newAngle) * radius;
      this.positions[i * 3 + 2] = Math.sin(newAngle) * radius;
    }
  }
  
  /**
   * Renders the scene with advanced optimizations
   */
  private renderWithOptimizations(): void {
    // Use the rendering optimizer to handle frustum culling and LOD
    this.renderingOptimizer.optimizeStarRendering(
      this.scene,
      this.camera,
      this.positions,
      this.colors,
      this.sizes
    );
    
    // Render the scene
    this.renderer.render(this.scene, this.camera);
  }
  
  /**
   * Monitors performance and adjusts settings if needed
   */
  private monitorPerformance(): void {
    // Check FPS every 5 seconds
    setInterval(() => {
      if (this.fps < 30 && !this.lowPerformanceMode) {
        // Switch to low performance mode
        this.lowPerformanceMode = true;
        this.applyLowPerformanceSettings();
      } else if (this.fps > 45 && this.lowPerformanceMode) {
        // Switch back to normal mode
        this.lowPerformanceMode = false;
        this.applyNormalPerformanceSettings();
      }
    }, 5000);
  }
  
  /**
   * Applies settings for low-performance devices
   */
  private applyLowPerformanceSettings(): void {
    // Reduce pixel ratio
    this.renderer.setPixelRatio(1);
    
    // Reduce star count if it's high
    if (this.galaxyConfig.starCount > 10000) {
      const newConfig = {
        ...this.galaxyConfig,
        starCount: Math.floor(this.galaxyConfig.starCount * 0.5) // Reduce by 50%
      };
      this.updateConfig(newConfig);
    }
  }
  
  /**
   * Applies normal performance settings
   */
  private applyNormalPerformanceSettings(): void {
    // Restore pixel ratio
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }
  
  /**
   * Handles window resize
   */
  private handleResize(container: HTMLElement): void {
    // Update camera
    this.camera.aspect = container.clientWidth / container.clientHeight;
    this.camera.updateProjectionMatrix();
    
    // Update renderer
    this.renderer.setSize(container.clientWidth, container.clientHeight);
  }
  
  /**
   * Cleans up resources
   */
  dispose(): void {
    // Stop animation loop
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    // Dispose of rendering optimizer
    this.renderingOptimizer.dispose();
    
    // Dispose of Three.js objects
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        if (object.geometry) object.geometry.dispose();
        if (object.material instanceof THREE.Material) {
          object.material.dispose();
        } else if (Array.isArray(object.material)) {
          object.material.forEach(material => material.dispose());
        }
      }
    });
    
    // Dispose of renderer
    this.renderer.dispose();
    
    // Remove event listeners
    window.removeEventListener('resize', () => this.handleResize);
  }
}