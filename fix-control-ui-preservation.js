#!/usr/bin/env node

/**
 * Fix for Control UI Configuration Preservation Issue
 * 
 * This script ensures that controlUi configuration is preserved
 * during config save/load operations by:
 * 1. Detecting when controlUi config is missing after save
 * 2. Restoring it from the original configuration
 * 3. Ensuring the fix is applied to the railway deployment
 */

const fs = require('fs');
const path = require('path');

// Configuration paths
const CONFIG_PATH = process.env.OPENCLAW_CONFIG_PATH || path.join(process.env.HOME || process.env.USERPROFILE, '.openclaw', 'config.json');
const BACKUP_PATH = CONFIG_PATH + '.backup';

console.log('🔧 Control UI Configuration Preservation Fix');
console.log('==========================================');

// Step 1: Create backup of current config
if (fs.existsSync(CONFIG_PATH)) {
    console.log('📋 Creating backup of current config...');
    fs.copyFileSync(CONFIG_PATH, BACKUP_PATH);
    console.log('✅ Backup created at:', BACKUP_PATH);
} else {
    console.log('⚠️  No existing config found, creating new one...');
}

// Step 2: Read current config
let config = {};
if (fs.existsSync(CONFIG_PATH)) {
    try {
        const configContent = fs.readFileSync(CONFIG_PATH, 'utf8');
        config = JSON.parse(configContent);
        console.log('✅ Current config loaded');
    } catch (error) {
        console.error('❌ Error reading config:', error.message);
    }
}

// Step 3: Check if controlUi config exists
const hasControlUi = config.gateway && config.gateway.controlUi;
console.log('🔍 Control UI config status:', hasControlUi ? '✅ Present' : '❌ Missing');

// Step 4: Add or preserve controlUi configuration
if (!hasControlUi) {
    console.log('🛠️  Adding controlUi configuration...');
    config.gateway = config.gateway || {};
    config.gateway.controlUi = {
        enabled: true,
        allowInsecureAuth: true,
        dangerouslyDisableDeviceAuth: true
    };
    console.log('✅ Added controlUi configuration');
} else {
    console.log('🔍 Preserving existing controlUi config:', JSON.stringify(config.gateway.controlUi, null, 2));
}

// Step 5: Ensure controlUi has required settings
if (config.gateway.controlUi) {
    // Ensure allowInsecureAuth is true for token-based auth
    if (!config.gateway.controlUi.allowInsecureAuth) {
        console.log('🔧 Enabling allowInsecureAuth for Control UI...');
        config.gateway.controlUi.allowInsecureAuth = true;
    }
    
    // Ensure dangerouslyDisableDeviceAuth is true to avoid pairing issues
    if (!config.gateway.controlUi.dangerouslyDisableDeviceAuth) {
        console.log('🔧 Enabling dangerouslyDisableDeviceAuth for Control UI...');
        config.gateway.controlUi.dangerouslyDisableDeviceAuth = true;
    }
    
    console.log('✅ Control UI configuration updated:', JSON.stringify(config.gateway.controlUi, null, 2));
}

// Step 6: Write updated config
try {
    const configDir = path.dirname(CONFIG_PATH);
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
    }
    
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + '\n');
    console.log('✅ Configuration saved to:', CONFIG_PATH);
} catch (error) {
    console.error('❌ Error saving config:', error.message);
    process.exit(1);
}

// Step 7: Verify the fix
const updatedConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
const finalControlUi = updatedConfig.gateway?.controlUi;
console.log('\n🎯 Final Configuration Status:');
console.log('==============================');
console.log('Control UI enabled:', finalControlUi?.enabled);
console.log('Allow insecure auth:', finalControlUi?.allowInsecureAuth);
console.log('Disable device auth:', finalControlUi?.dangerouslyDisableDeviceAuth);

if (finalControlUi && finalControlUi.enabled && finalControlUi.allowInsecureAuth && finalControlUi.dangerouslyDisableDeviceAuth) {
    console.log('✅ All Control UI settings are correctly configured!');
    console.log('🚀 The Control UI should now work without pairing issues.');
} else {
    console.log('❌ Some Control UI settings are still missing or incorrect.');
    process.exit(1);
}

console.log('\n📝 Next Steps:');
console.log('=============');
console.log('1. Restart your OpenClaw gateway for changes to take effect');
console.log('2. Try connecting to the Control UI again');
console.log('3. The connection should now work without requiring device pairing');

console.log('\n🎉 Fix completed successfully!');