import type { OpenClawConfig } from "./types.js";

/**
 * Control UI Configuration Preservation
 * 
 * This module ensures that controlUi configuration is preserved
 * during config save/load operations to prevent pairing issues.
 */

// Default controlUi configuration
const DEFAULT_CONTROL_UI_CONFIG = {
  enabled: true,
  allowInsecureAuth: true,
  dangerouslyDisableDeviceAuth: true,
};

/**
 * Preserve or restore controlUi configuration in the given config
 * This ensures that even if config.save operations remove the controlUi config,
 * it will be restored with the required settings for proper Control UI operation.
 */
export function preserveControlUiConfig(config: OpenClawConfig): OpenClawConfig {
  const result = { ...config };
  
  // Ensure gateway exists
  if (!result.gateway) {
    result.gateway = {};
  }
  
  // Preserve or restore controlUi configuration
  if (!result.gateway.controlUi) {
    console.log("🔧 Control UI config missing, restoring with defaults...");
    result.gateway.controlUi = { ...DEFAULT_CONTROL_UI_CONFIG };
  } else {
    // Ensure required settings are present
    const currentControlUi = result.gateway.controlUi;
    result.gateway.controlUi = {
      ...DEFAULT_CONTROL_UI_CONFIG,
      ...currentControlUi,
      // Ensure critical settings are enabled
      allowInsecureAuth: currentControlUi.allowInsecureAuth ?? true,
      dangerouslyDisableDeviceAuth: currentControlUi.dangerouslyDisableDeviceAuth ?? true,
    };
  }
  
  console.log("✅ Control UI configuration preserved:", result.gateway.controlUi);
  return result;
}

/**
 * Check if controlUi configuration is properly configured
 */
export function isControlUiConfigured(config: OpenClawConfig): boolean {
  const controlUi = config.gateway?.controlUi;
  if (!controlUi) return false;
  
  return (
    controlUi.enabled === true &&
    controlUi.allowInsecureAuth === true &&
    controlUi.dangerouslyDisableDeviceAuth === true
  );
}

/**
 * Get the current controlUi configuration with defaults applied
 */
export function getControlUiConfig(config: OpenClawConfig) {
  const controlUi = config.gateway?.controlUi || {};
  return {
    ...DEFAULT_CONTROL_UI_CONFIG,
    ...controlUi,
  };
}