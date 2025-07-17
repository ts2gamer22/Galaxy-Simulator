import * as THREE from 'three';

/**
 * Handles advanced rendering optimizations for the galaxy simulation
 */
export class RenderingOptimizer {
  private frustum: THREE.Frustum;
  private frustumMatrix: THREE.Matrix4;
  private lodDistances: number[];
  private instancedMeshes: Map<number, THREE.InstancedMesh>;
  private starGeometry: THREE.BufferGeometry;
  private starMaterial: THREE.MeshBasicMaterial;
  private textureAtlas: THREE.Texture | null = null;
  
  constructor() {
    this.frustum = new THREE.Frustum();
    this.frustumMatrix = new THREE.Matrix4();
    this.lodDistances = [50, 100, 200, 400]; // Distance thresholds for LOD levels
    this.instancedMeshes = new Map();
    
    // Create star geometry for instanced rendering
    this.starGeometry = new THREE.SphereGeometry(1, 8, 8);
    this.starMaterial = new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending
    });
    
    // Create texture atlas for stars (will be initialized in createTextureAtlas)
    this.createTextureAtlas();
  }
  
  /**
   * Creates a texture atlas for different star types
   */
  private createTextureAtlas(): void {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Clear canvas
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Create 4 different star textures in a single atlas
    const starTypes = 4;
    const starSize = 64;
    
    for (let i = 0; i < starTypes; i++) {
      const x = i * starSize;
      const y = 0;
      
      // Base glow
      const gradient = ctx.createRadialGradient(
        x + starSize/2, y + starSize/2, 0,
        x + starSize/2, y + starSize/2, starSize/2
      );
      
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
      gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.8)');
      gradient.addColorStop(0.8, 'rgba(255, 255, 255, 0.1)');
      gradient.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, starSize, starSize);
      
      // Add some variation to each star type
      if (i === 1) {
        // Add cross flare
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + starSize/2, y + 5);
        ctx.lineTo(x + starSize/2, y + starSize - 5);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + 5, y + starSize/2);
        ctx.lineTo(x + starSize - 5, y + starSize/2);
        ctx.stroke();
      } else if (i === 2) {
        // Add halo
        const haloGradient = ctx.createRadialGradient(
          x + starSize/2, y + starSize/2, starSize/4,
          x + starSize/2, y + starSize/2, starSize/2
        );
        
        haloGradient.addColorStop(0, 'rgba(255, 255, 255, 0.0)');
        haloGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
        haloGradient.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');
        
        ctx.fillStyle = haloGradient;
        ctx.fillRect(x, y, starSize, starSize);
      } else if (i === 3) {
        // Add sparkle
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = 1;
        for (let j = 0; j < 4; j++) {
          const angle = j * Math.PI / 4;
          ctx.beginPath();
          ctx.moveTo(
            x + starSize/2 + Math.cos(angle) * 5,
            y + starSize/2 + Math.sin(angle) * 5
          );
          ctx.lineTo(
            x + starSize/2 + Math.cos(angle) * (starSize/2 - 5),
            y + starSize/2 + Math.sin(angle) * (starSize/2 - 5)
          );
          ctx.stroke();
        }
      }
    }
    
    // Create texture from canvas
    this.textureAtlas = new THREE.CanvasTexture(canvas);
    this.textureAtlas.needsUpdate = true;
    
    // Apply texture to material
    this.starMaterial.map = this.textureAtlas;
    this.starMaterial.needsUpdate = true;
  }
  
  /**
   * Updates the frustum for culling calculations
   */
  updateFrustum(camera: THREE.Camera): void {
    this.frustumMatrix.multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse
    );
    this.frustum.setFromProjectionMatrix(this.frustumMatrix);
  }
  
  /**
   * Determines if a point is visible in the camera frustum
   */
  isPointVisible(point: THREE.Vector3): boolean {
    return this.frustum.containsPoint(point);
  }
  
  /**
   * Gets the appropriate LOD level based on distance from camera
   */
  getLODLevel(distance: number): number {
    for (let i = 0; i < this.lodDistances.length; i++) {
      if (distance < this.lodDistances[i]) {
        return i;
      }
    }
    return this.lodDistances.length; // Furthest LOD level
  }
  
  /**
   * Creates or gets an instanced mesh for the given LOD level
   */
  getInstancedMesh(lodLevel: number, maxInstances: number): THREE.InstancedMesh {
    if (!this.instancedMeshes.has(lodLevel)) {
      // Create geometry based on LOD level
      let geometry: THREE.BufferGeometry;
      
      if (lodLevel === 0) {
        // Highest detail for closest stars
        geometry = new THREE.SphereGeometry(1, 8, 8);
      } else if (lodLevel === 1) {
        // Medium detail
        geometry = new THREE.SphereGeometry(1, 6, 6);
      } else {
        // Low detail for distant stars
        geometry = new THREE.SphereGeometry(1, 4, 4);
      }
      
      // Create instanced mesh
      const mesh = new THREE.InstancedMesh(
        geometry,
        this.starMaterial.clone(),
        maxInstances
      );
      
      mesh.frustumCulled = false; // We'll handle culling manually
      this.instancedMeshes.set(lodLevel, mesh);
    }
    
    return this.instancedMeshes.get(lodLevel)!;
  }
  
  /**
   * Optimizes star rendering by using instanced meshes and LOD
   */
  optimizeStarRendering(
    scene: THREE.Scene,
    camera: THREE.Camera,
    positions: Float32Array,
    colors: Float32Array,
    sizes: Float32Array
  ): void {
    // Update frustum for culling
    this.updateFrustum(camera);
    
    // Clear previous instanced meshes from scene
    this.instancedMeshes.forEach(mesh => {
      if (mesh.parent) {
        scene.remove(mesh);
      }
      mesh.count = 0; // Reset instance count
    });
    
    // Group stars by LOD level
    const starsByLOD = new Map<number, Array<{
      position: THREE.Vector3,
      color: THREE.Color,
      size: number,
      distance: number
    }>>();
    
    // Camera position for distance calculations
    const cameraPosition = camera.position;
    
    // Process all stars
    const starCount = positions.length / 3;
    for (let i = 0; i < starCount; i++) {
      const x = positions[i * 3];
      const y = positions[i * 3 + 1];
      const z = positions[i * 3 + 2];
      
      const position = new THREE.Vector3(x, y, z);
      
      // Calculate distance to camera
      const distance = position.distanceTo(cameraPosition);
      
      // Skip stars that are too far away (beyond our furthest LOD)
      if (distance > this.lodDistances[this.lodDistances.length - 1] * 2) {
        continue;
      }
      
      // Check if star is in view frustum
      if (!this.isPointVisible(position)) {
        continue;
      }
      
      // Determine LOD level based on distance
      const lodLevel = this.getLODLevel(distance);
      
      // Create color from RGB values
      const color = new THREE.Color(
        colors[i * 3],
        colors[i * 3 + 1],
        colors[i * 3 + 2]
      );
      
      // Get size
      const size = sizes[i];
      
      // Add to appropriate LOD group
      if (!starsByLOD.has(lodLevel)) {
        starsByLOD.set(lodLevel, []);
      }
      
      starsByLOD.get(lodLevel)!.push({
        position,
        color,
        size,
        distance
      });
    }
    
    // Create and position instanced meshes for each LOD level
    starsByLOD.forEach((stars, lodLevel) => {
      // Sort stars by distance for better transparency rendering
      stars.sort((a, b) => b.distance - a.distance);
      
      // Get or create instanced mesh for this LOD level
      const instancedMesh = this.getInstancedMesh(lodLevel, stars.length);
      instancedMesh.count = stars.length;
      
      // Set up instances
      const dummy = new THREE.Object3D();
      const colorArray = new Float32Array(stars.length * 3);
      
      stars.forEach((star, index) => {
        // Position and scale
        dummy.position.copy(star.position);
        dummy.scale.set(star.size, star.size, star.size);
        dummy.updateMatrix();
        instancedMesh.setMatrixAt(index, dummy.matrix);
        
        // Store color
        colorArray[index * 3] = star.color.r;
        colorArray[index * 3 + 1] = star.color.g;
        colorArray[index * 3 + 2] = star.color.b;
      });
      
      // Update instance matrices
      instancedMesh.instanceMatrix.needsUpdate = true;
      
      // Set colors
      const colorAttribute = new THREE.InstancedBufferAttribute(colorArray, 3);
      instancedMesh.geometry.setAttribute('color', colorAttribute);
      
      // Add to scene
      scene.add(instancedMesh);
    });
  }
  
  /**
   * Creates an optimized shader material for star rendering
   */
  createOptimizedStarMaterial(): THREE.ShaderMaterial {
    // Custom shader for more efficient star rendering
    const vertexShader = `
      attribute vec3 color;
      varying vec3 vColor;
      varying vec2 vUv;
      
      void main() {
        vColor = color;
        vUv = uv;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        
        // Size attenuation based on distance
        gl_PointSize = 2.0 * (300.0 / length(mvPosition.xyz));
      }
    `;
    
    const fragmentShader = `
      varying vec3 vColor;
      varying vec2 vUv;
      uniform sampler2D starTexture;
      
      void main() {
        vec4 texColor = texture2D(starTexture, vUv);
        if (texColor.a < 0.1) discard;
        gl_FragColor = vec4(vColor * texColor.rgb, texColor.a);
      }
    `;
    
    return new THREE.ShaderMaterial({
      uniforms: {
        starTexture: { value: this.textureAtlas }
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: true
    });
  }
  
  /**
   * Disposes of all resources to prevent memory leaks
   */
  dispose(): void {
    // Dispose of all instanced meshes
    this.instancedMeshes.forEach(mesh => {
      mesh.geometry.dispose();
      if (mesh.material instanceof THREE.Material) {
        mesh.material.dispose();
      } else if (Array.isArray(mesh.material)) {
        mesh.material.forEach(material => material.dispose());
      }
    });
    
    // Clear the map
    this.instancedMeshes.clear();
    
    // Dispose of shared resources
    this.starGeometry.dispose();
    this.starMaterial.dispose();
    
    if (this.textureAtlas) {
      this.textureAtlas.dispose();
    }
  }
}