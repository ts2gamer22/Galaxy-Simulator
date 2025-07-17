<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import * as THREE from 'three';
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
  import type { GalaxyConfig } from '$lib/types/galaxy';
  
  // Props
  interface Props {
    galaxyConfig: GalaxyConfig;
  }
  
  let { galaxyConfig }: Props = $props();
  
  // Watch for changes in galaxy configuration
  $effect(() => {
    console.log("Galaxy config changed:", galaxyConfig);
    // Regenerate galaxy when config changes (but only after initial mount)
    if (scene && galaxyMesh) {
      createGalaxy();
    }
  });
  
  // Three.js core objects
  let scene: THREE.Scene;
  let camera: THREE.PerspectiveCamera;
  let renderer: THREE.WebGLRenderer;
  let controls: OrbitControls;
  let canvas: HTMLCanvasElement;
  let animationId: number;
  
  // Container element
  let container: HTMLDivElement;
  
  // WebGL support detection
  let isWebGLAvailable = $state(true);
  let webGLErrorMessage = $state('');
  
  // Loading state
  let isLoading = $state(true);
  
  // Time tracking for smooth animation
  let lastTime = 0;
  
  // Performance monitoring
  let frameCount = 0;
  let lastFpsTime = 0;
  let currentFps = 60;
  let performanceLevel = 'high'; // 'high', 'medium', 'low'
  
  // Performance optimization functions
  function updatePerformanceMetrics(currentTime: number) {
    frameCount++;
    
    if (currentTime - lastFpsTime >= 1000) { // Update FPS every second
      currentFps = Math.round((frameCount * 1000) / (currentTime - lastFpsTime));
      frameCount = 0;
      lastFpsTime = currentTime;
      
      // Adjust performance level based on FPS
      adjustPerformanceLevel();
    }
  }
  
  function adjustPerformanceLevel() {
    const previousLevel = performanceLevel;
    
    if (currentFps < 20) {
      performanceLevel = 'low';
    } else if (currentFps < 40) {
      performanceLevel = 'medium';
    } else {
      performanceLevel = 'high';
    }
    
    // Apply performance adjustments if level changed
    if (previousLevel !== performanceLevel) {
      applyPerformanceSettings();
      console.log(`Performance level adjusted to: ${performanceLevel} (FPS: ${currentFps})`);
    }
  }
  
  function applyPerformanceSettings() {
    if (!renderer || !galaxyMesh) return;
    
    switch (performanceLevel) {
      case 'low':
        // Reduce quality for better performance
        renderer.setPixelRatio(Math.min(window.devicePixelRatio * 0.5, 1));
        if (galaxyMesh.material instanceof THREE.PointsMaterial) {
          galaxyMesh.material.size = galaxyConfig.particleSize * 0.7;
        }
        break;
        
      case 'medium':
        // Balanced quality and performance
        renderer.setPixelRatio(Math.min(window.devicePixelRatio * 0.75, 1.5));
        if (galaxyMesh.material instanceof THREE.PointsMaterial) {
          galaxyMesh.material.size = galaxyConfig.particleSize * 0.85;
        }
        break;
        
      case 'high':
        // Full quality
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        if (galaxyMesh.material instanceof THREE.PointsMaterial) {
          galaxyMesh.material.size = galaxyConfig.particleSize;
        }
        break;
    }
  }
  
  // WebGL support detection function
  function checkWebGLSupport() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      
      if (!gl) {
        isWebGLAvailable = false;
        webGLErrorMessage = 'Your browser does not support WebGL, which is required for this application.';
        console.error('WebGL not supported');
        return false;
      }
      
      // Check for required extensions and capabilities
      const extensions = gl.getSupportedExtensions();
      if (!extensions || extensions.length < 10) { // Basic check for minimal extension support
        isWebGLAvailable = false;
        webGLErrorMessage = 'Your browser has limited WebGL support. Some features may not work correctly.';
        console.warn('Limited WebGL support detected');
        return false;
      }
      
      return true;
    } catch (e) {
      isWebGLAvailable = false;
      webGLErrorMessage = `WebGL error: ${e.message || 'Unknown error'}`;
      console.error('WebGL error:', e);
      return false;
    }
  }
  
  function detectDeviceCapabilities() {
    // Check WebGL support first
    const hasWebGL = checkWebGLSupport();
    if (!hasWebGL) {
      performanceLevel = 'low';
      return;
    }
    
    // Simple device capability detection
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl) {
      performanceLevel = 'low';
      return;
    }
    
    // Check for mobile devices
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Check memory (if available)
    const memory = (navigator as any).deviceMemory;
    
    // Check GPU info if available
    let gpuInfo = '';
    try {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        gpuInfo = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      }
    } catch (e) {
      console.log('Unable to get GPU info:', e);
    }
    
    // Check screen resolution
    const screenResolution = window.screen.width * window.screen.height;
    const isHighRes = screenResolution > 2073600; // Greater than 1920x1080
    
    // Determine initial performance level based on device characteristics
    if (isMobile || (memory && memory < 2) || gpuInfo.includes('Intel') || screenResolution < 1000000) {
      // Low-end devices: mobile with low memory, Intel integrated graphics, or small screens
      performanceLevel = 'low';
      
      // Adjust galaxy config for better performance
      galaxyConfig = {
        ...galaxyConfig,
        starCount: Math.min(galaxyConfig.starCount, 10000),
        particleSize: Math.max(galaxyConfig.particleSize, 0.15)
      };
      
    } else if ((memory && memory < 8) || isHighRes || isMobile) {
      // Mid-range devices: limited memory, high-res screens, or high-end mobile
      performanceLevel = 'medium';
      
      // Adjust galaxy config for balanced performance
      galaxyConfig = {
        ...galaxyConfig,
        starCount: Math.min(galaxyConfig.starCount, 20000)
      };
      
    } else {
      // High-end devices: desktop with good memory and GPU
      performanceLevel = 'high';
    }
    
    console.log(`Initial performance level: ${performanceLevel} (Memory: ${memory || 'unknown'}, Mobile: ${isMobile}, GPU: ${gpuInfo || 'unknown'}, Resolution: ${window.screen.width}x${window.screen.height})`);
  }
  
  // Galaxy objects
  let galaxyMesh: THREE.Points;
  let dustParticles: THREE.Points;
  let galaxyCore: THREE.Mesh;
  
  // Rotation physics data
  let starData: {
    originalPositions: Float32Array;
    radii: Float32Array;
    angles: Float32Array;
    angularVelocities: Float32Array;
  } | null = null;
  
  // Differential rotation physics
  function calculateAngularVelocity(radius: number): number {
    // Realistic galaxy rotation curve
    // Inner regions rotate faster, outer regions slower
    const maxVelocity = galaxyConfig.rotationSpeed;
    
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
  
  function initializeRotationData(positions: Float32Array) {
    const starCount = positions.length / 3;
    const radii = new Float32Array(starCount);
    const angles = new Float32Array(starCount);
    const angularVelocities = new Float32Array(starCount);
    
    for (let i = 0; i < starCount; i++) {
      const x = positions[i * 3];
      const z = positions[i * 3 + 2];
      
      // Calculate radius and angle for each star
      const radius = Math.sqrt(x * x + z * z);
      const angle = Math.atan2(z, x);
      
      radii[i] = radius;
      angles[i] = angle;
      angularVelocities[i] = calculateAngularVelocity(radius);
    }
    
    starData = {
      originalPositions: new Float32Array(positions),
      radii,
      angles,
      angularVelocities
    };
  }
  
  function updateGalaxyRotation(deltaTime: number) {
    if (!starData || !galaxyMesh) return;
    
    const positions = galaxyMesh.geometry.attributes.position.array as Float32Array;
    
    for (let i = 0; i < starData.radii.length; i++) {
      const radius = starData.radii[i];
      const angularVelocity = starData.angularVelocities[i];
      
      // Update angle based on angular velocity
      starData.angles[i] += angularVelocity * deltaTime;
      
      // Calculate new position
      const newX = Math.cos(starData.angles[i]) * radius;
      const newZ = Math.sin(starData.angles[i]) * radius;
      
      // Update position (keep Y unchanged)
      positions[i * 3] = newX;
      positions[i * 3 + 2] = newZ;
      // Y position stays the same: positions[i * 3 + 1] = starData.originalPositions[i * 3 + 1];
    }
    
    // Mark positions as needing update
    galaxyMesh.geometry.attributes.position.needsUpdate = true;
  }
  
  // Particle effects for cosmic dust
  function createDustTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    
    const context = canvas.getContext('2d')!;
    const gradient = context.createRadialGradient(8, 8, 0, 8, 8, 8);
    gradient.addColorStop(0, 'rgba(100,150,255,0.3)');
    gradient.addColorStop(0.5, 'rgba(80,120,200,0.2)');
    gradient.addColorStop(1, 'rgba(60,100,180,0)');
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, 16, 16);
    
    return new THREE.CanvasTexture(canvas);
  }
  
  function createCosmicDust() {
    const dustPositions: number[] = [];
    const dustColors: number[] = [];
    const dustCount = Math.floor(galaxyConfig.starCount * 0.1); // 10% of star count
    
    // Generate dust particles along spiral arms and in nebulae regions
    for (let i = 0; i < dustCount; i++) {
      // Similar to star generation but more spread out
      const armIndex = Math.floor(Math.random() * galaxyConfig.armCount);
      const armAngleOffset = (armIndex * 2 * Math.PI) / galaxyConfig.armCount;
      
      // Dust extends further than stars
      const radius = Math.random() * galaxyConfig.galaxyRadius * 1.2;
      const spiralAngle = armAngleOffset + (radius * 0.2); // Less tight spiral
      
      // More variation for dust clouds
      const angleVariation = (Math.random() - 0.5) * 1.5;
      const radiusVariation = (Math.random() - 0.5) * 20;
      
      const finalAngle = spiralAngle + angleVariation;
      const finalRadius = Math.max(0, radius + radiusVariation);
      
      const x = Math.cos(finalAngle) * finalRadius;
      const z = Math.sin(finalAngle) * finalRadius;
      
      // More vertical spread for dust clouds
      const y = (Math.random() - 0.5) * 15 * Math.exp(-finalRadius / 50);
      
      dustPositions.push(x, y, z);
      
      // Dust colors - blues and purples for nebulae
      const dustColor = new THREE.Color().lerpColors(
        new THREE.Color(0x4466ff),
        new THREE.Color(0x8844ff),
        Math.random()
      );
      
      dustColors.push(dustColor.r, dustColor.g, dustColor.b);
    }
    
    // Create dust geometry
    const dustGeometry = new THREE.BufferGeometry();
    dustGeometry.setAttribute('position', new THREE.Float32BufferAttribute(dustPositions, 3));
    dustGeometry.setAttribute('color', new THREE.Float32BufferAttribute(dustColors, 3));
    
    // Create dust material with transparency and blending
    const dustTexture = createDustTexture();
    const dustMaterial = new THREE.PointsMaterial({
      size: galaxyConfig.particleSize * 3, // Larger than stars
      vertexColors: true,
      transparent: true,
      opacity: 0.3, // Very subtle
      sizeAttenuation: true,
      map: dustTexture,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    // Create dust mesh
    if (dustParticles) {
      scene.remove(dustParticles);
      dustParticles.geometry.dispose();
      (dustParticles.material as THREE.Material).dispose();
    }
    
    dustParticles = new THREE.Points(dustGeometry, dustMaterial);
    scene.add(dustParticles);
    
    console.log(`Cosmic dust created with ${dustPositions.length / 3} particles`);
  }
  
  // Galaxy core glow effect
  function createGalaxyCoreGlow() {
    // Create a glowing sphere for the galaxy core
    const coreGeometry = new THREE.SphereGeometry(galaxyConfig.coreSize * 0.7, 32, 32);
    
    // Create a glowing material with enhanced properties
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0xffffcc), // Brighter, more yellowish core
      transparent: true,
      opacity: 0.2 * galaxyConfig.brightness, // Adjust opacity based on brightness
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false // Prevent depth blocking issues
    });
    
    // Create multiple outer glow layers for more realistic effect
    const outerGlowGeometry1 = new THREE.SphereGeometry(galaxyConfig.coreSize * 1.2, 32, 32);
    const outerGlowMaterial1 = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0xffdd88),
      transparent: true,
      opacity: 0.1 * galaxyConfig.brightness,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    
    // Second outer glow layer
    const outerGlowGeometry2 = new THREE.SphereGeometry(galaxyConfig.coreSize * 1.8, 32, 32);
    const outerGlowMaterial2 = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0xff8844),
      transparent: true,
      opacity: 0.05 * galaxyConfig.brightness,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    
    // Remove existing core if it exists
    if (galaxyCore) {
      scene.remove(galaxyCore);
      if (galaxyCore.geometry) galaxyCore.geometry.dispose();
      if (galaxyCore.material instanceof THREE.Material) {
        galaxyCore.material.dispose();
      }
    }
    
    // Create core group with multiple glow layers
    const coreGroup = new THREE.Group();
    
    const innerCore = new THREE.Mesh(coreGeometry, coreMaterial);
    const outerGlow1 = new THREE.Mesh(outerGlowGeometry1, outerGlowMaterial1);
    const outerGlow2 = new THREE.Mesh(outerGlowGeometry2, outerGlowMaterial2);
    
    coreGroup.add(innerCore);
    coreGroup.add(outerGlow1);
    coreGroup.add(outerGlow2);
    
    galaxyCore = coreGroup as any; // Type assertion for compatibility
    scene.add(galaxyCore);
    
    console.log('Galaxy core glow effect created');
  }
  
  // Enhanced star brightness and twinkling effects
  function addStarBrightnessVariation(geometry: THREE.BufferGeometry) {
    const positions = geometry.attributes.position.array as Float32Array;
    const colors = geometry.attributes.color.array as Float32Array;
    const starCount = positions.length / 3;
    
    // Add brightness attribute for twinkling effect
    const brightness = new Float32Array(starCount);
    
    for (let i = 0; i < starCount; i++) {
      const x = positions[i * 3];
      const z = positions[i * 3 + 2];
      const radius = Math.sqrt(x * x + z * z);
      
      // Base brightness based on distance from center
      let baseBrightness = 1.0;
      if (radius < galaxyConfig.coreSize) {
        baseBrightness = 1.5; // Brighter core stars
      } else if (radius > galaxyConfig.galaxyRadius * 0.7) {
        baseBrightness = 0.6; // Dimmer outer stars
      }
      
      // Add random variation and apply global brightness setting
      const variation = 0.3 + Math.random() * 0.7; // 0.3 to 1.0
      brightness[i] = baseBrightness * variation * galaxyConfig.brightness;
      
      // Enhance color based on brightness
      const brightnessFactor = brightness[i];
      colors[i * 3] *= brightnessFactor;     // R
      colors[i * 3 + 1] *= brightnessFactor; // G
      colors[i * 3 + 2] *= brightnessFactor; // B
    }
    
    geometry.setAttribute('brightness', new THREE.Float32BufferAttribute(brightness, 1));
    return brightness;
  }
  
  // Depth-based fog for distant stars
  function addDepthFog() {
    // Add exponential fog for depth perception
    const fogColor = new THREE.Color(0x000011); // Match background
    const fogNear = 50;
    const fogFar = galaxyConfig.galaxyRadius * 2;
    
    scene.fog = new THREE.Fog(fogColor, fogNear, fogFar);
    
    console.log('Depth fog added for enhanced realism');
  }
  
  // Star field rendering enhancements
  function createStarTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    
    const context = canvas.getContext('2d')!;
    const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.2, 'rgba(255,255,255,0.8)');
    gradient.addColorStop(0.4, 'rgba(255,255,255,0.4)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, 32, 32);
    
    return new THREE.CanvasTexture(canvas);
  }
  
  // Galaxy generation functions
  function generateSpiralArms(armCount: number, tightness: number = 0.3) {
    const positions: number[] = [];
    const colors: number[] = [];
    const sizes: number[] = [];
    const starCount = galaxyConfig.starCount;
    
    // Generate stars for each spiral arm
    for (let i = 0; i < starCount; i++) {
      // Determine which arm this star belongs to
      const armIndex = Math.floor(Math.random() * armCount);
      const armAngleOffset = (armIndex * 2 * Math.PI) / armCount;
      
      // Distance from center (0 to galaxyRadius)
      const radius = Math.random() * galaxyConfig.galaxyRadius;
      
      // Spiral angle based on distance and tightness
      // Adjust tightness based on arm count to make differences more visible
      const adjustedTightness = tightness * (1 + (armCount - 2) * 0.05);
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
      const distanceRatio = finalRadius / galaxyConfig.galaxyRadius;
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
        const colorIndex = Math.floor(Math.random() * galaxyConfig.starColors.length);
        color = new THREE.Color(galaxyConfig.starColors[colorIndex]);
      } else {
        // Outer region - cooler, dimmer stars
        color = new THREE.Color().lerpColors(
          new THREE.Color(0xaaddff), 
          new THREE.Color(0x6699cc), 
          Math.random()
        );
      }
      
      colors.push(color.r, color.g, color.b);
      
      // Star size based on distance from center and brightness
      const baseSize = galaxyConfig.particleSize;
      const sizeVariation = Math.random() * 2 + 0.5; // 0.5 to 2.5 multiplier
      const distanceSize = distanceRatio < 0.3 ? 1.5 : (distanceRatio < 0.7 ? 1.2 : 1.0);
      const finalSize = baseSize * sizeVariation * distanceSize;
      
      sizes.push(finalSize);
    }
    
    return { positions, colors, sizes };
  }
  
  function addCentralBulge(positions: number[], colors: number[], sizes: number[], bulgeStars: number = 5000) {
    // Add dense central bulge
    for (let i = 0; i < bulgeStars; i++) {
      // Use exponential distribution for realistic bulge density
      const radius = Math.random() * Math.random() * galaxyConfig.coreSize;
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
      
      colors.push(color.r, color.g, color.b);
      
      // Central bulge stars are larger and brighter
      const bulgeSize = galaxyConfig.particleSize * (1.5 + Math.random());
      sizes.push(bulgeSize);
    }
  }
  
  function createGalaxy() {
    // Only show loading indicator on initial creation, not on updates
    // isLoading is set to true only during initial mount
    
    // Generate spiral arms
    const { positions, colors, sizes } = generateSpiralArms(galaxyConfig.armCount);
    
    // Add central bulge
    addCentralBulge(positions, colors, sizes);
    
    // Create geometry
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
    
    // Add brightness variation for enhanced realism
    const brightnessData = addStarBrightnessVariation(geometry);
    
    // Create enhanced material with custom star texture
    const starTexture = createStarTexture();
    const material = new THREE.PointsMaterial({
      size: galaxyConfig.particleSize,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
      map: starTexture,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    // Create galaxy mesh
    if (galaxyMesh) {
      scene.remove(galaxyMesh);
      galaxyMesh.geometry.dispose();
      (galaxyMesh.material as THREE.Material).dispose();
    }
    
    galaxyMesh = new THREE.Points(geometry, material);
    scene.add(galaxyMesh);
    
    // Initialize rotation data for differential rotation
    initializeRotationData(new Float32Array(positions));
    
    // Create cosmic dust particles
    createCosmicDust();
    
    // Add galaxy core glow effect
    createGalaxyCoreGlow();
    
    // Add depth-based fog for realism
    addDepthFog();
    
    console.log(`Galaxy created with ${positions.length / 3} stars`);
  }
  
  function initializeScene() {
    try {
      // Create scene
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x000011); // Dark blue space background
      
      // Create camera
      const aspect = window.innerWidth / window.innerHeight;
      camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
      camera.position.set(0, 50, 100);
      camera.lookAt(0, 0, 0);
      
      try {
        // Create renderer - this is where WebGL errors most commonly occur
        renderer = new THREE.WebGLRenderer({ 
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance'
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        // Get canvas element
        canvas = renderer.domElement;
        container.appendChild(canvas);
      } catch (rendererError) {
        console.error('Failed to initialize WebGL renderer:', rendererError);
        isWebGLAvailable = false;
        webGLErrorMessage = `Failed to initialize WebGL renderer: ${rendererError.message || 'Unknown error'}`;
        return;
      }
      
      // Add basic lighting
      const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
      scene.add(ambientLight);
      
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(1, 1, 1);
      scene.add(directionalLight);
    } catch (sceneError) {
      console.error('Failed to initialize Three.js scene:', sceneError);
      isWebGLAvailable = false;
      webGLErrorMessage = `Failed to initialize Three.js scene: ${sceneError.message || 'Unknown error'}`;
      return;
    }
    
    // Initialize camera controls
    controls = new OrbitControls(camera, canvas);
    
    // Configure orbit controls for galaxy viewing
    controls.enableDamping = true; // Smooth camera movement
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    
    // Set distance limits for zooming
    controls.minDistance = 10;
    controls.maxDistance = 500;
    
    // Set vertical rotation limits
    controls.maxPolarAngle = Math.PI;
    
    // Enable smooth zoom
    controls.enableZoom = true;
    controls.zoomSpeed = 0.6;
    
    // Enable rotation
    controls.enableRotate = true;
    controls.rotateSpeed = 0.5;
    
    // Enable panning
    controls.enablePan = true;
    controls.panSpeed = 0.8;
    
    // Touch-friendly controls for mobile devices
    controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN
    };
    
    // Adjust touch rotation speed
    controls.touchRotateSpeed = 0.6; // Slightly slower for better control
    
    // Detect mobile devices and adjust controls
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
      controls.rotateSpeed = 0.4; // Slower rotation for touch
      controls.zoomSpeed = 0.5; // Slower zoom for touch
      controls.enableDamping = true; // Extra damping for smoother touch control
      controls.dampingFactor = 0.08; // Increased damping for touch
    }
    
    // Set target to center of galaxy
    controls.target.set(0, 0, 0);
    controls.update();
    
    // Create the galaxy
    createGalaxy();
    
    // Hide loading indicator after a short delay
    setTimeout(() => {
      isLoading = false;
    }, 1000);
    
    console.log('Three.js scene and controls initialized successfully');
  }
  
  function animate(currentTime: number = 0) {
    animationId = requestAnimationFrame(animate);
    
    // Calculate delta time for smooth animation
    const deltaTime = (currentTime - lastTime) * 0.001; // Convert to seconds
    lastTime = currentTime;
    
    // Update performance metrics
    updatePerformanceMetrics(currentTime);
    
    // Update controls for smooth damping
    if (controls) {
      controls.update();
    }
    
    // Update galaxy rotation
    if (deltaTime > 0) {
      updateGalaxyRotation(deltaTime);
    }
    
    renderer.render(scene, camera);
  }
  
  function handleResize() {
    if (!camera || !renderer) return;
    
    // Get container dimensions instead of window for more flexible embedding
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    
    // Update camera aspect ratio
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    
    // Resize renderer with smooth transition
    renderer.setSize(width, height, true); // true = updateStyle
    
    // Adjust pixel ratio based on performance level
    let pixelRatio = window.devicePixelRatio;
    if (performanceLevel === 'medium') {
      pixelRatio = Math.min(pixelRatio * 0.75, 1.5);
    } else if (performanceLevel === 'low') {
      pixelRatio = Math.min(pixelRatio * 0.5, 1);
    } else {
      pixelRatio = Math.min(pixelRatio, 2);
    }
    renderer.setPixelRatio(pixelRatio);
    
    // Log resize for debugging
    console.log(`Canvas resized: ${width}x${height}, Pixel Ratio: ${pixelRatio}`);
  }
  
  function cleanup() {
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
    
    // Dispose of controls
    if (controls) {
      controls.dispose();
    }
    
    if (renderer) {
      renderer.dispose();
      if (canvas && container.contains(canvas)) {
        container.removeChild(canvas);
      }
    }
    
    // Clean up geometries and materials
    if (scene) {
      try {
        // Dispose of all objects in the scene
        scene.traverse((object) => {
          // Dispose of geometries
          if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
            if (object.geometry) {
              object.geometry.dispose();
            }
            
            // Dispose of materials (handle arrays of materials too)
            if (object.material) {
              if (Array.isArray(object.material)) {
                object.material.forEach(material => material.dispose());
              } else {
                object.material.dispose();
              }
            }
          }
          
          // Dispose of textures
          if (object.material && object.material.map) {
            object.material.map.dispose();
          }
        });
        
        // Clear the scene
        while(scene.children.length > 0) { 
          scene.remove(scene.children[0]); 
        }
        
        console.log('Scene cleanup completed successfully');
      } catch (e) {
        console.error('Error during scene cleanup:', e);
      }
    }
    
    // Clear references to help garbage collection
    scene = null;
    camera = null;
    controls = null;
    galaxyMesh = null;
    dustParticles = null;
    galaxyCore = null;
    starData = null;
    
    console.log('Memory cleanup completed');
  }
  
  onMount(() => {
    detectDeviceCapabilities();
    initializeScene();
    animate();
    
    // Hide loading indicator after a short delay to ensure smooth transition
    setTimeout(() => {
      isLoading = false;
    }, 1000);
    
    // Add resize listener
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  });
  
  onDestroy(() => {
    cleanup();
  });
</script>

<div class="galaxy-viewer" bind:this={container}>
  {#if isWebGLAvailable}
    <!-- Three.js canvas will be mounted here -->
    {#if isLoading}
      <div class="loading-overlay">
        <div class="loading-spinner"></div>
        <div class="loading-text">Generating Galaxy...</div>
      </div>
    {/if}
  {:else}
    <div class="webgl-error">
      <div class="error-container">
        <h2>WebGL Not Available</h2>
        <p>{webGLErrorMessage}</p>
        <div class="suggestions">
          <h3>Suggestions:</h3>
          <ul>
            <li>Try using a modern browser like Chrome, Firefox, or Edge</li>
            <li>Make sure your graphics drivers are up to date</li>
            <li>Check if hardware acceleration is enabled in your browser settings</li>
            <li>Try disabling browser extensions that might interfere with WebGL</li>
          </ul>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .galaxy-viewer {
    width: 100%;
    height: 100vh;
    position: relative;
  }
  
  .webgl-error {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(to bottom, #000011, #000033);
    color: white;
    text-align: center;
  }
  
  .error-container {
    max-width: 600px;
    padding: 30px;
    background: rgba(0, 0, 0, 0.7);
    border-radius: 10px;
    border: 1px solid rgba(100, 100, 255, 0.3);
    box-shadow: 0 0 30px rgba(50, 50, 200, 0.3);
  }
  
  .webgl-error h2 {
    color: #ff5555;
    margin-bottom: 20px;
    font-size: 24px;
  }
  
  .webgl-error p {
    margin-bottom: 20px;
    line-height: 1.5;
    color: #cccccc;
  }
  
  .suggestions {
    text-align: left;
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid rgba(255, 255, 255, 0.2);
  }
  
  .suggestions h3 {
    color: #88aaff;
    margin-bottom: 10px;
    font-size: 18px;
  }
  
  .suggestions ul {
    padding-left: 20px;
  }
  
  .suggestions li {
    margin-bottom: 8px;
    color: #aaaaaa;
  }
  
  .loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background-color: rgba(0, 0, 5, 0.8);
    z-index: 10;
    transition: opacity 0.5s ease, visibility 0.5s ease;
    animation: fadeIn 0.5s ease;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  .loading-spinner {
    width: 60px;
    height: 60px;
    border: 4px solid rgba(100, 100, 255, 0.3);
    border-radius: 50%;
    border-top-color: rgba(100, 150, 255, 1);
    animation: spin 1s linear infinite;
    margin-bottom: 20px;
  }
  
  .loading-text {
    color: white;
    font-size: 18px;
    font-family: Arial, sans-serif;
    text-shadow: 0 0 10px rgba(100, 150, 255, 0.8);
  }
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>