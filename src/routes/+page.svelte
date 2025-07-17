<script lang="ts">
  import GalaxyViewer from '$lib/components/GalaxyViewer.svelte';
  import ControlPanel from '$lib/components/ControlPanel.svelte';
  import type { GalaxyConfig } from '$lib/types/galaxy';
  import { DEFAULT_GALAXY_CONFIG } from '$lib/types/galaxy';
  
  // Galaxy configuration state
  let galaxyConfig = $state<GalaxyConfig>({...DEFAULT_GALAXY_CONFIG});
  
  // Handle configuration changes
  function handleConfigChange(newConfig: GalaxyConfig) {
    galaxyConfig = newConfig;
  }
</script>

<div class="app-container">
  <GalaxyViewer galaxyConfig={galaxyConfig} />
  <ControlPanel galaxyConfig={galaxyConfig} onConfigChange={handleConfigChange} />
  
  <div class="info-panel">
    <h1>Interactive Galaxy Simulation</h1>
    <p>Explore a procedurally generated spiral galaxy with realistic physics.</p>
    <p>Use the control panel to adjust parameters and customize your galaxy.</p>
    <p>Mouse controls: Drag to rotate, scroll to zoom.</p>
  </div>
</div>

<style>
  :global(body, html) {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    font-family: Arial, sans-serif;
  }
  
  .app-container {
    width: 100%;
    height: 100vh;
    position: relative;
  }
  
  .info-panel {
    position: fixed;
    bottom: 20px;
    left: 20px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 15px 20px;
    border-radius: 10px;
    max-width: 400px;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(100, 100, 255, 0.3);
    z-index: 100;
    
    @media (max-width: 768px) {
      bottom: auto;
      top: 20px;
      left: 20px;
      max-width: 80%;
    }
    
    @media (max-width: 480px) {
      display: none;
    }
  }
  
  .info-panel h1 {
    margin: 0 0 10px 0;
    font-size: 24px;
    color: rgba(180, 200, 255, 1);
    text-shadow: 0 0 10px rgba(100, 150, 255, 0.5);
  }
  
  .info-panel p {
    margin: 8px 0;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.9);
  }
</style>