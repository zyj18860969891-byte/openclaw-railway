#!/usr/bin/env python3
"""
OpenRouter Model Switcher - Quick Setup

This script helps you quickly set up and test the OpenRouter model switcher skill.

Usage:
    python quick_setup.py                    # Interactive setup
    python quick_setup.py --model <model>    # Direct model setup
    python quick_setup.py --test             # Test current configuration
"""

import os
import sys
import json
import subprocess
from pathlib import Path

class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    END = '\033[0m'
    BOLD = '\033[1m'

def print_header(text):
    print(f"\n{Colors.HEADER}{Colors.BOLD}{'='*60}")
    print(f" {text}")
    print(f"{'='*60}{Colors.END}\n")

def print_success(text):
    print(f"{Colors.GREEN}✅ {text}{Colors.END}")

def print_warning(text):
    print(f"{Colors.WARNING}⚠️  {text}{Colors.END}")

def print_error(text):
    print(f"{Colors.FAIL}❌ {text}{Colors.END}")

def print_info(text):
    print(f"{Colors.CYAN}ℹ️  {text}{Colors.END}")

def run_command(cmd, capture_output=False):
    """Run a shell command and return output."""
    try:
        if capture_output:
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
            return result.returncode, result.stdout, result.stderr
        else:
            result = subprocess.run(cmd, shell=True)
            return result.returncode, "", ""
    except Exception as e:
        return 1, "", str(e)

def check_railway_cli():
    """Check if Railway CLI is installed and logged in."""
    print_info("Checking Railway CLI...")
    
    code, stdout, stderr = run_command("railway --version", capture_output=True)
    if code != 0:
        print_error("Railway CLI is not installed or not in PATH")
        print_info("Install from: https://docs.railway.app/develop/cli")
        return False
    
    print_success(f"Railway CLI found: {stdout.strip()}")
    
    # Check if logged in
    code, stdout, stderr = run_command("railway whoami", capture_output=True)
    if code != 0:
        print_warning("Not logged in to Railway. Please run: railway login")
        return False
    
    print_success(f"Logged in as: {stdout.strip()}")
    return True

def check_project():
    """Check if we're in a Railway project directory."""
    print_info("Checking project configuration...")
    
    # Check for railway.toml
    if not Path("railway.toml").exists():
        print_error("railway.toml not found. Are you in the project root?")
        return False
    
    print_success("railway.toml found")
    return True

def get_current_config():
    """Get current model configuration for all providers."""
    print_info("Fetching current configuration...")
    
    env_vars = {
        'OPENROUTER_API_KEY': None,
        'ANTHROPIC_API_KEY': None,
        'OPENAI_API_KEY': None,
        'DEEPSEEK_API_KEY': None,
        'TOGETHER_API_KEY': None,
        'PERPLEXITY_API_KEY': None,
        'MODEL_NAME': None,
        'MODEL_ID': None,
        'ANTHROPIC_MODEL': None,
        'OPENAI_MODEL': None,
        'DEEPSEEK_MODEL': None,
        'TOGETHER_MODEL': None,
        'PERPLEXITY_MODEL': None
    }
    
    for var in env_vars:
        code, stdout, stderr = run_command(f"railway variables --get {var}", capture_output=True)
        if code == 0 and stdout.strip():
            env_vars[var] = stdout.strip()
    
    return env_vars

def validate_model(model):
    """Validate model format for any provider."""
    if not model:
        return False, "Model is empty"
    
    # Check if it has provider/model format
    if '/' not in model:
        return False, f"Model must be in 'provider/model' format, got: {model}"
    
    parts = model.split('/')
    if len(parts) < 2:
        return False, f"Model format incorrect: {model}"
    
    provider = parts[0].lower()
    supported_providers = [
        'openrouter', 'anthropic', 'openai', 'deepseek', 'together',
        'perplexity', 'moonshot', 'kimi-code', 'minimax', 'qwen-portal',
        'ollama', 'xiaomi', 'venice', 'synthetic'
    ]
    
    if provider not in supported_providers:
        return False, f"Unsupported provider: {provider}. Supported: {', '.join(supported_providers)}"
    
    return True, f"Valid {provider} model"

def set_model(model, provider=None):
    """Set the model environment variables."""
    print_info(f"Setting model to: {model}")
    
    # Validate format
    valid, msg = validate_model(model)
    if not valid:
        print_error(f"Invalid model format: {msg}")
        return False
    
    # Determine provider from model if not provided
    if not provider:
        provider = model.split('/')[0].lower()
    
    # Set environment variables based on provider
    cmds = []
    
    # Always set generic MODEL_NAME
    cmds.append(f'railway variables --set "MODEL_NAME={model}"')
    
    # Set provider-specific variables
    provider_vars = {
        'anthropic': 'ANTHROPIC_MODEL',
        'openai': 'OPENAI_MODEL',
        'deepseek': 'DEEPSEEK_MODEL',
        'together': 'TOGETHER_MODEL',
        'perplexity': 'PERPLEXITY_MODEL'
    }
    
    if provider in provider_vars:
        cmds.append(f'railway variables --set "{provider_vars[provider]}={model.split("/")[1]}"')
    
    # For OpenRouter, also set MODEL_ID for backward compatibility
    if provider == 'openrouter':
        cmds.append(f'railway variables --set "MODEL_ID={model}"')
    
    for cmd in cmds:
        code, stdout, stderr = run_command(cmd)
        if code != 0:
            print_error(f"Failed to set variable: {cmd}")
            return False
    
    print_success(f"Model set to: {model}")
    return True

def deploy():
    """Deploy the application."""
    print_info("Deploying application...")
    print_warning("This may take a few minutes...")
    
    code, stdout, stderr = run_command("railway up")
    return code == 0

def interactive_setup():
    """Interactive setup wizard."""
    print_header("Universal Model Switcher - Quick Setup")
    
    # Check prerequisites
    if not check_railway_cli():
        return False
    
    if not check_project():
        return False
    
    # Show current config
    current = get_current_config()
    print_header("Current Configuration")
    
    if current['MODEL_NAME']:
        print(f"  Current model: {current['MODEL_NAME']}")
    else:
        print("  No model set (will use default)")
    
    # Check API keys
    api_keys = {
        'OpenRouter': current['OPENROUTER_API_KEY'],
        'Anthropic': current['ANTHROPIC_API_KEY'],
        'OpenAI': current['OPENAI_API_KEY'],
        'DeepSeek': current['DEEPSEEK_API_KEY'],
        'Together': current['TOGETHER_API_KEY'],
        'Perplexity': current['PERPLEXITY_API_KEY']
    }
    
    available_providers = []
    for provider, key in api_keys.items():
        if key:
            print_success(f"  {provider} API key is set")
            available_providers.append(provider.lower())
        else:
            print_warning(f"  {provider} API key is NOT set")
    
    if not available_providers:
        print_error("No provider API keys set!")
        print_info("Please set at least one API key first:")
        print_info("  railway variables --set 'OPENROUTER_API_KEY=your-key'")
        print_info("  or: railway variables --set 'ANTHROPIC_API_KEY=your-key'")
        return False
    
    # Provider selection
    print_header("Select Provider")
    provider_map = {
        '1': ('openrouter', 'OpenRouter'),
        '2': ('anthropic', 'Anthropic Claude'),
        '3': ('openai', 'OpenAI GPT'),
        '4': ('deepseek', 'DeepSeek'),
        '5': ('together', 'Together AI'),
        '6': ('perplexity', 'Perplexity AI')
    }
    
    for key, (id, name) in provider_map.items():
        status = "✅" if id in available_providers else "❌"
        print(f"  {key}. {name} {status}")
    
    choice = input("\n  Enter choice (1-6): ").strip()
    
    if choice not in provider_map:
        print_error("Invalid choice")
        return False
    
    provider, provider_name = provider_map[choice]
    
    if provider not in available_providers:
        print_error(f"{provider_name} API key not set")
        print_info(f"Please set {provider.upper()}_API_KEY first")
        return False
    
    # Model selection based on provider
    print_header(f"Select {provider_name} Model")
    
    common_models = {
        'openrouter': [
            ('openrouter/xiaomi/mimo-v2-flash', 'Xiaomi MiMo V2 Flash'),
            ('openrouter/stepfun/step-3.5-flash:free', 'StepFun Step 3.5 Flash (Free)'),
            ('openrouter/meta-llama/llama-3.3-70b:free', 'Meta Llama 3.3 70B (Free)')
        ],
        'anthropic': [
            ('anthropic/claude-sonnet-4-5', 'Claude Sonnet 4.5'),
            ('anthropic/claude-opus-4-5', 'Claude Opus 4.5'),
            ('anthropic/claude-3-5-sonnet-20241022', 'Claude 3.5 Sonnet')
        ],
        'openai': [
            ('openai/gpt-4-turbo-preview', 'GPT-4 Turbo'),
            ('openai/gpt-4o', 'GPT-4o'),
            ('openai/gpt-3.5-turbo', 'GPT-3.5 Turbo')
        ],
        'deepseek': [
            ('deepseek/deepseek-chat', 'DeepSeek Chat'),
            ('deepseek/deepseek-coder', 'DeepSeek Coder')
        ],
        'together': [
            ('together/meta-llama/Llama-3.3-70B-Instruct-Turbo', 'Llama 3.3 70B Instruct'),
            ('together/mistralai/Mixtral-8x7B-Instruct-v0.1', 'Mixtral 8x7B')
        ],
        'perplexity': [
            ('perplexity/llama-3.1-sonar-large-128k-online', 'Sonar Large 128k'),
            ('perplexity/llama-3.1-sonar-small-128k-online', 'Sonar Small 128k')
        ]
    }
    
    models = common_models.get(provider, [])
    
    print(f"  Common {provider_name} models:")
    for i, (model_id, name) in enumerate(models, 1):
        print(f"  {i}. {name}")
    print(f"  {len(models) + 1}. Custom model")
    
    choice = input(f"\n  Enter choice (1-{len(models) + 1}): ").strip()
    
    try:
        choice_idx = int(choice) - 1
        if 0 <= choice_idx < len(models):
            model = models[choice_idx][0]
        elif choice_idx == len(models):
            custom_model = input(f"  Enter model ID (e.g., {provider}/model-name): ").strip()
            if not custom_model.startswith(f"{provider}/"):
                custom_model = f"{provider}/{custom_model}"
            model = custom_model
        else:
            print_error("Invalid choice")
            return False
    except ValueError:
        print_error("Invalid input")
        return False
    
    # Set model
    if not set_model(model, provider):
        return False
    
    # Deploy
    print_header("Deployment")
    deploy_choice = input("  Deploy now? (y/N): ").strip().lower()
    if deploy_choice == 'y':
        if deploy():
            print_success("Deployment successful!")
            print_info("Check logs: railway logs --follow")
            return True
        else:
            print_error("Deployment failed")
            return False
    else:
        print_info("Skipping deployment. Run 'railway up' manually when ready.")
        return True

def main():
    if len(sys.argv) > 1:
        if sys.argv[1] == '--test':
            # Test current configuration
            print_header("Configuration Test")
            config = get_current_config()
            
            issues = []
            
            # Check for any API key
            api_keys = ['OPENROUTER_API_KEY', 'ANTHROPIC_API_KEY', 'OPENAI_API_KEY', 
                       'DEEPSEEK_API_KEY', 'TOGETHER_API_KEY', 'PERPLEXITY_API_KEY']
            has_api_key = any(config[key] for key in api_keys)
            
            if not has_api_key:
                issues.append("No provider API keys set")
            
            if not config['MODEL_NAME']:
                issues.append("MODEL_NAME not set")
            else:
                valid, msg = validate_model(config['MODEL_NAME'])
                if not valid:
                    issues.append(f"MODEL_NAME invalid: {msg}")
            
            if issues:
                print_error("Issues found:")
                for issue in issues:
                    print_error(f"  • {issue}")
                return 1
            else:
                print_success("Configuration looks good!")
                print_info(f"Current model: {config['MODEL_NAME']}")
                return 0
        
        elif sys.argv[1] == '--model' and len(sys.argv) > 2:
            # Direct model setup
            model = sys.argv[2]
            provider = None
            if len(sys.argv) > 3 and sys.argv[2] == '--provider':
                provider = sys.argv[3]
                model = sys.argv[4] if len(sys.argv) > 4 else None
            
            if model and set_model(model, provider):
                print_success("Model set successfully")
                return 0
            else:
                return 1
        
        else:
            print("Usage: python quick_setup.py [--test] [--model <model>] [--provider <provider>]")
            return 1
    
    else:
        # Interactive mode
        return 0 if interactive_setup() else 1

if __name__ == "__main__":
    sys.exit(main())
