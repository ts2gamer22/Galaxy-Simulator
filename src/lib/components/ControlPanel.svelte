<script lang="ts">
  import type { GalaxyConfig } from '$lib/types/galaxy';
  
  // Props
  interface Props {
    galaxyConfig: GalaxyConfig;
    onConfigChange: (config: GalaxyConfig) => void;
  }
  
  let { galaxyConfig, onConfigChange }: Props = $props();
  
  // Local state for controls
  let isVisible = $state(true);
  
  // Handle control changes
  function updateConfig(updates: Partial<GalaxyConfig>) {
    const newConfig = { ...galaxyConfig, ...updates };
    onConfigChange(newConfig);
  }
  
  // Reset to defaults
  function resetToDefaults() {
    const defaultConfig: GalaxyConfig = {
      starCount: 25000,
      armCount: 4,
      galaxyRadius: 100,
      rotationSpeed: 0.1,
      coreSize: 3.5,
      starColors: ['#ffffff', '#ffddaa', '#aaddff'],
      particleSize: 0.1,
      brightness: 1.0
    };
    onConfigChange(defaultConfig);
  }
  
  // Toggle panel visibility
  function toggleVisibility() {
    isVisible = !isVisible;
  }
</script>

<div class="control-panel" class:hidden={!isVisible}>
  <div class="panel-header">
    <h3>Galaxy Controls</h3>
    <button class="toggle-btn" onclick={toggleVisibility}>
      {isVisible ? '−' : '+'}
    </button>
  </div>
  
  {#if isVisible}
    <div class="controls">
      <!-- Star Count Control -->
      <div class="control-group">
        <label for="starCount">Star Count: {galaxyConfig.starCount.toLocaleString()}</label>
        <input
          id="starCount"
          type="range"
          min="1000"
          max="50000"
          step="1000"
          value={galaxyConfig.starCount}
          oninput={(e) => updateConfig({ starCount: parseInt(e.currentTarget.value) })}
        />
      </div>
      
      <!-- Rotation Speed Control -->
      <div class="control-group">
        <label for="rotationSpeed">Rotation Speed: {galaxyConfig.rotationSpeed.toFixed(3)}</label>
        <input
          id="rotationSpeed"
          type="range"
          min="0"
          max="0.5"
          step="0.01"
          value={galaxyConfig.rotationSpeed}
          oninput={(e) => updateConfig({ rotationSpeed: parseFloat(e.currentTarget.value) })}
        />
      </div>
      
      <!-- Spiral Arms Control -->
      <div class="control-group">
        <label for="armCount">Spiral Arms: {galaxyConfig.armCount}</label>
        <input
          id="armCount"
          type="range"
          min="2"
          max="8"
          step="1"
          value={galaxyConfig.armCount}
          oninput={(e) => updateConfig({ armCount: parseInt(e.currentTarget.value) })}
        />
      </div>
      
      <!-- Galaxy Radius Control -->
      <div class="control-group">
        <label for="galaxyRadius">Galaxy Size: {galaxyConfig.galaxyRadius}</label>
        <input
          id="galaxyRadius"
          type="range"
          min="50"
          max="200"
          step="10"
          value={galaxyConfig.galaxyRadius}
          oninput={(e) => updateConfig({ galaxyRadius: parseInt(e.currentTarget.value) })}
        />
      </div>
      
      <!-- Core Size Control -->
      <div class="control-group">
        <label for="coreSize">Core Size: {galaxyConfig.coreSize}</label>
        <input
          id="coreSize"
          type="range"
          min="0"
          max="7"
          step="0.5"
          value={galaxyConfig.coreSize}
          oninput={(e) => updateConfig({ coreSize: parseFloat(e.currentTarget.value) })}
        />
      </div>
      
      <!-- Particle Size Control -->
      <div class="control-group">
        <label for="particleSize">Star Size: {galaxyConfig.particleSize.toFixed(2)}</label>
        <input
          id="particleSize"
          type="range"
          min="0.05"
          max="0.5"
          step="0.01"
          value={galaxyConfig.particleSize}
          oninput={(e) => updateConfig({ particleSize: parseFloat(e.currentTarget.value) })}
        />
      </div>
      
      <!-- Brightness Control -->
      <div class="control-group">
        <label for="brightness">Star Brightness: {galaxyConfig.brightness.toFixed(2)}</label>
        <input
          id="brightness"
          type="range"
          min="0.1"
          max="3.0"
          step="0.1"
          value={galaxyConfig.brightness}
          oninput={(e) => updateConfig({ brightness: parseFloat(e.currentTarget.value) })}
        />
      </div>
      
      <!-- Star Colors -->
      <div class="control-group">
        <label for="star-colors">Star Colors:</label>
        <div class="color-controls" id="star-colors">
          {#each galaxyConfig.starColors as color, index}
            <div class="color-input-group">
              <input
                type="color"
                value={color}
                onclick={(e) => e.currentTarget.classList.add('picking')}
                onchange={(e) => {
                  // Only update when color selection is complete
                  e.currentTarget.classList.remove('picking');
                  const newColors = [...galaxyConfig.starColors];
                  newColors[index] = e.currentTarget.value;
                  updateConfig({ starColors: newColors });
                }}
              />
              <span class="color-label">Color {index + 1}</span>
            </div>
          {/each}
        </div>
      </div>
      
      <!-- Reset Button -->
      <div class="control-group">
        <button class="reset-btn" onclick={resetToDefaults}>
          Reset to Defaults
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .control-panel {
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(0, 0, 0, 0.8);
    border: 1px solid rgba(100, 100, 255, 0.3);
    border-radius: 12px;
    padding: 0;
    color: white;
    font-family: Arial, sans-serif;
    font-size: 14px;
    min-width: 280px;
    max-width: 320px;
    backdrop-filter: blur(10px);
    z-index: 1000;
    transition: all 0.3s ease;
    box-shadow: 0 0 20px rgba(50, 50, 200, 0.2);
    
    /* Responsive positioning for smaller screens */
    @media (max-width: 768px) {
      top: auto;
      bottom: 20px;
      right: 50%;
      transform: translateX(50%);
      max-width: 90%;
      width: 400px;
    }
    
    @media (max-width: 480px) {
      bottom: 10px;
      max-width: 95%;
      width: 95%;
    }
  }
  
  .control-panel.hidden .controls {
    display: none;
  }
  
  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 20px;
    border-bottom: 1px solid rgba(100, 100, 255, 0.2);
    background: linear-gradient(to right, rgba(30, 30, 60, 0.5), rgba(20, 20, 40, 0.5));
    border-radius: 12px 12px 0 0;
  }
  
  .panel-header h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: rgba(180, 200, 255, 1);
    text-shadow: 0 0 10px rgba(100, 150, 255, 0.5);
  }
  
  .toggle-btn {
    background: none;
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: white;
    width: 30px;
    height: 30px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }
  
  .toggle-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.5);
  }
  
  .controls {
    padding: 20px;
    max-height: 70vh;
    overflow-y: auto;
  }
  
  .control-group {
    margin-bottom: 20px;
  }
  
  .control-group:last-child {
    margin-bottom: 0;
  }
  
  label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.9);
  }
  
  input[type="range"] {
    width: 100%;
    height: 6px;
    border-radius: 3px;
    background: rgba(255, 255, 255, 0.2);
    outline: none;
    -webkit-appearance: none;
    appearance: none;
  }
  
  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    cursor: pointer;
    border: 2px solid white;
    box-shadow: 0 0 10px rgba(102, 126, 234, 0.6);
  }
  
  input[type="range"]::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    cursor: pointer;
    border: 2px solid white;
    box-shadow: 0 0 10px rgba(102, 126, 234, 0.6);
  }
  
  .color-controls {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  
  .color-input-group {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  input[type="color"] {
    width: 40px;
    height: 30px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 4px;
    background: none;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  
  input[type="color"].picking {
    transform: scale(1.1);
    box-shadow: 0 0 15px rgba(100, 150, 255, 0.8);
    border-color: rgba(255, 255, 255, 0.8);
  }
  
  .color-label {
    color: rgba(255, 255, 255, 0.8);
    font-size: 13px;
  }
  
  .reset-btn {
    width: 100%;
    padding: 12px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    border-radius: 6px;
    color: white;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .reset-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }
  
  .reset-btn:active {
    transform: translateY(0);
  }
  
  /* Scrollbar styling */
  .controls::-webkit-scrollbar {
    width: 6px;
  }
  
  .controls::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }
  
  .controls::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 3px;
  }
  
  .controls::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.5);
  }
</style>