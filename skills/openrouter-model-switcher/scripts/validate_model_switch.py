#!/usr/bin/env python3
"""
OpenRouter Model Switcher Validator

This script validates the OpenRouter model configuration and helps troubleshoot
common issues with model switching via environment variables.

Usage:
    python validate_model_switch.py                    # Check current configuration
    python validate_model_switch.py --model <model>    # Validate specific model format
    python validate_model_switch.py --test             # Test model connectivity

Examples:
    python validate_model_switch.py --model openrouter/xiaomi/mimo-v2-flash
    python validate_model_switch.py --test
"""

import os
import sys
import json
import re
from pathlib import Path

# Valid model patterns - support multiple providers
VALID_PATTERNS = [
    # OpenRouter models (with or without openrouter/ prefix)
    r'^(openrouter/)?[a-z0-9_-]+/[a-z0-9_.-]+(:[a-z0-9_-]+)?$',
    r'^(openrouter/)?[a-z0-9_-]+/[a-z0-9_.-]+$',
    # Direct provider models (anthropic, openai, deepseek, etc.)
    r'^[a-z0-9_-]+/[a-z0-9_.-]+(:[a-z0-9_-]+)?$',
    r'^[a-z0-9_-]+/[a-z0-9_.-]+$'
]

# Supported providers
SUPPORTED_PROVIDERS = [
    'openrouter', 'anthropic', 'openai', 'deepseek', 'together', 
    'perplexity', 'moonshot', 'kimi-code', 'minimax', 'qwen-portal',
    'ollama', 'xiaomi', 'venice', 'synthetic', 'stepfun', 'meta-llama'
]

def validate_model_format(model_id: str) -> tuple[bool, str]:
    """Validate if model ID follows correct format for any supported provider."""
    if not model_id:
        return False, "Model ID is empty"
    
    # Check if it contains provider/model format
    if '/' not in model_id:
        return False, f"Model ID must be in 'provider/model' format, got: {model_id}"
    
    # Extract provider and model parts
    parts = model_id.split('/', 1)
    provider = parts[0].lower()
    model = parts[1]
    
    # OpenRouter models can have any provider (stepfun, xiaomi, meta-llama, etc.)
    # If model starts with openrouter/ or provider is a known OpenRouter sub-provider
    openrouter_subproviders = ['stepfun', 'xiaomi', 'meta-llama', 'mistralai', 'google', 'anthropic']
    
    if provider == 'openrouter' or provider in openrouter_subproviders:
        # OpenRouter model - always valid if format is correct
        for pattern in VALID_PATTERNS:
            if re.match(pattern, model_id, re.IGNORECASE):
                return True, f"Valid OpenRouter model format"
        return False, f"Invalid OpenRouter model format: {model_id}"
    
    # For direct providers, check if provider is supported
    if provider not in SUPPORTED_PROVIDERS:
        return False, f"Unsupported provider: {provider}. Supported: {', '.join(SUPPORTED_PROVIDERS)}"
    
    # Check pattern
    for pattern in VALID_PATTERNS:
        if re.match(pattern, model_id, re.IGNORECASE):
            return True, f"Valid {provider} model format"
    
    return False, f"Invalid model ID format: {model_id}"

def check_environment_variables() -> dict:
    """Check relevant environment variables for all supported providers."""
    env_vars = {
        'OPENROUTER_API_KEY': os.getenv('OPENROUTER_API_KEY'),
        'ANTHROPIC_API_KEY': os.getenv('ANTHROPIC_API_KEY'),
        'OPENAI_API_KEY': os.getenv('OPENAI_API_KEY'),
        'DEEPSEEK_API_KEY': os.getenv('DEEPSEEK_API_KEY'),
        'TOGETHER_API_KEY': os.getenv('TOGETHER_API_KEY'),
        'PERPLEXITY_API_KEY': os.getenv('PERPLEXITY_API_KEY'),
        'MODEL_NAME': os.getenv('MODEL_NAME'),
        'MODEL_ID': os.getenv('MODEL_ID')
    }
    
    # Add provider-specific model environment variables
    for provider in ['ANTHROPIC', 'OPENAI', 'DEEPSEEK', 'TOGETHER', 'PERPLEXITY']:
        env_vars[f'{provider}_MODEL'] = os.getenv(f'{provider}_MODEL')
    
    return env_vars

def validate_config_file(config_path: str = "/tmp/openclaw/openclaw.json") -> dict:
    """Validate the OpenClaw configuration file."""
    result = {
        'exists': False,
        'valid_json': False,
        'content': None,
        'model_primary': None,
        'errors': []
    }
    
    path = Path(config_path)
    if not path.exists():
        result['errors'].append(f"Config file not found: {config_path}")
        return result
    
    result['exists'] = True
    
    try:
        with open(config_path, 'r') as f:
            content = json.load(f)
        result['valid_json'] = True
        result['content'] = content
        
        # Extract model primary
        model_primary = content.get('agents', {}).get('defaults', {}).get('model', {}).get('primary')
        result['model_primary'] = model_primary
        
        if not model_primary:
            result['errors'].append("No model.primary configured in agents.defaults")
        
    except json.JSONDecodeError as e:
        result['errors'].append(f"Invalid JSON: {e}")
    except Exception as e:
        result['errors'].append(f"Error reading config: {e}")
    
    return result

def print_status(message: str, status: str = "INFO"):
    """Print formatted status message."""
    symbols = {
        "INFO": "📋",
        "OK": "✅",
        "WARN": "⚠️",
        "ERROR": "❌",
        "TEST": "🧪"
    }
    symbol = symbols.get(status, "•")
    print(f"{symbol} {message}")

def main():
    print("\n" + "="*60)
    print("OpenRouter Model Switcher Validator")
    print("="*60 + "\n")
    
    # Check environment variables
    print_status("Checking environment variables...")
    env = check_environment_variables()
    
    # Check API keys for all providers
    api_keys_checked = 0
    for provider in ['openrouter', 'anthropic', 'openai', 'deepseek', 'together', 'perplexity']:
        env_var = f'{provider.upper()}_API_KEY'
        api_key = env.get(env_var)
        if api_key:
            print_status(f"{provider.upper()}_API_KEY is set", "OK")
            api_keys_checked += 1
        else:
            print_status(f"{provider.upper()}_API_KEY is NOT set", "WARN")
    
    if api_keys_checked == 0:
        print_status("No provider API keys found", "ERROR")
    
    # Check model configurations
    model_name = env.get('MODEL_NAME')
    model_id = env.get('MODEL_ID')
    
    if model_name:
        valid, msg = validate_model_format(model_name)
        if valid:
            print_status(f"MODEL_NAME format valid: {model_name}", "OK")
        else:
            print_status(f"MODEL_NAME format invalid: {msg}", "ERROR")
    else:
        print_status("MODEL_NAME is not set", "WARN")
    
    if model_id:
        valid, msg = validate_model_format(model_id)
        if valid:
            print_status(f"MODEL_ID format valid: {model_id}", "OK")
        else:
            print_status(f"MODEL_ID format invalid: {msg}", "ERROR")
    else:
        print_status("MODEL_ID is not set", "WARN")
    
    # Check provider-specific model variables
    for provider in ['ANTHROPIC', 'OPENAI', 'DEEPSEEK', 'TOGETHER', 'PERPLEXITY']:
        model_env = f'{provider}_MODEL'
        model_val = env.get(model_env)
        if model_val:
            valid, msg = validate_model_format(f"{provider.lower()}/{model_val}")
            if valid:
                print_status(f"{model_env} format valid: {model_val}", "OK")
            else:
                print_status(f"{model_env} format invalid: {msg}", "ERROR")
    
    # Check consistency
    if model_name and model_id and model_name != model_id:
        print_status(f"MODEL_NAME and MODEL_ID differ: {model_name} vs {model_id}", "WARN")
    
    # Validate config file
    print_status("\nChecking OpenClaw configuration...")
    config_result = validate_config_file()
    
    if config_result['exists']:
        print_status("Config file exists", "OK")
    else:
        print_status("Config file not found", "ERROR")
    
    if config_result['valid_json']:
        print_status("Config JSON is valid", "OK")
    else:
        print_status("Config JSON is invalid", "ERROR")
        for error in config_result['errors']:
            print_status(f"  • {error}", "ERROR")
    
    if config_result['model_primary']:
        valid, msg = validate_model_format(config_result['model_primary'])
        if valid:
            print_status(f"Config model.primary valid: {config_result['model_primary']}", "OK")
        else:
            print_status(f"Config model.primary invalid: {msg}", "ERROR")
    
    # Summary
    print("\n" + "="*60)
    print("Validation Summary")
    print("="*60)
    
    issues = []
    
    # Check at least one API key is set
    has_any_api_key = any([
        env.get('OPENROUTER_API_KEY'),
        env.get('ANTHROPIC_API_KEY'),
        env.get('OPENAI_API_KEY'),
        env.get('DEEPSEEK_API_KEY'),
        env.get('TOGETHER_API_KEY'),
        env.get('PERPLEXITY_API_KEY')
    ])
    
    if not has_any_api_key:
        issues.append("No provider API keys set")
    
    if model_name and not validate_model_format(model_name)[0]:
        issues.append(f"MODEL_NAME invalid: {model_name}")
    if model_id and not validate_model_format(model_id)[0]:
        issues.append(f"MODEL_ID invalid: {model_id}")
    if not config_result['valid_json']:
        issues.append("Config file invalid")
    if config_result['model_primary'] and not validate_model_format(config_result['model_primary'])[0]:
        issues.append(f"Config model.primary invalid: {config_result['model_primary']}")
    
    if issues:
        print_status("Issues found:", "ERROR")
        for issue in issues:
            print_status(f"  ❌ {issue}", "")
        print("\n💡 To fix:")
        print("1. Set at least one provider API key (OPENROUTER_API_KEY, ANTHROPIC_API_KEY, etc.)")
        print("2. Set MODEL_NAME with provider prefix (e.g., openrouter/meta-llama/llama-3.3-70b:free)")
        print("3. Or use provider-specific MODEL variables (e.g., ANTHROPIC_MODEL=claude-sonnet-4-5)")
        print("4. Redeploy with: railway up")
    else:
        print_status("All checks passed! Model configuration looks correct.", "OK")
        print("\n🎉 Ready to use. Supported providers: " + ", ".join(SUPPORTED_PROVIDERS))
        print("   If issues persist, check application logs.")
    
    return 0 if not issues else 1

if __name__ == "__main__":
    sys.exit(main())
