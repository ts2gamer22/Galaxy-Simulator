<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { GalaxyRenderer } from '$lib/galaxy/GalaxyRenderer';
  import type { GalaxyConfig } from '$lib/types/galaxy';
  import { DEFAULT_GALAXY_CONFIG } from '$lib/types/galaxy';
  
  // Props
  interface Props {
    config?: GalaxyConfig;
  }
  
  let { config = DEFAULT_GALAXY_CONFIG }: Props = $props();
  
  // Local state
  let container: HTMLDivElement;
  let galaxyRenderer: GalaxyRenderer | null = null;
  let isLoading = $state(true);
  let errorMessage = $state<string | null>(null);
  
  // Handle config changes
  $effect(() => {
    if (galaxyRenderer && config) {
      galaxyRenderer.updateConfig(config);
    }
  });
  
  // Initialize the galaxy renderer
  onMount(() => {
    try {
      // Check for WebGL support
      if (!isWebGLAvailable()) {
        errorMessage = "WebGL is not supported by your browser. Please try a different browser.";
        isLoading = false;
        return;
      }
      
      // Initialize the galaxy renderer
      galaxyRenderer = new GalaxyRenderer(container, config);
      
      // Hide loading indicator
      setTimeout(() => {
        isLoading = false;
      }, 500);
    } catch (error) {
      console.error("Error initializing galaxy:", error);
      errorMessage = "Failed to initialize the galaxy visualization. Please try again.";
      isLoading = false;
    }
  });
  
  // Clean up resources
  onDestroy(() => {
    if (galaxyRenderer) {
      galaxyRenderer.dispose();
      galaxyRenderer = null;
    }
  });
  
  // Check for WebGL support
  function isWebGLAvailable(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!(
        window.WebGLRenderingContext && 
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      );
    } catch (e) {
      return false;
    }
  }
</script>

<div class="galaxy-container" bind:this={container}>
  {#if isLoading}
    <div class="loading-overlay">
      <div class="loading-spinner"></div>
      <div class="loading-text">Generating Galaxy...</div>
    </div>
  {/if}
  
  {#if errorMessage}
    <div class="error-message">
      <p>{errorMessage}</p>
      <p>Please try using a modern browser with WebGL support.</p>
    </div>
  {/if}
</div>

<style>
  .galaxy-container {
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
    background-color: #000005;
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
  
  .error-message {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: rgba(30, 30, 60, 0.9);
    padding: 20px;
    border-radius: 10px;
    color: white;
    text-align: center;
    max-width: 80%;
    border: 1px solid rgba(100, 100, 255, 0.5);
  }
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>