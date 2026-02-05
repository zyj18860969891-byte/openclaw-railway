#!/usr/bin/env python3
"""
Test script for OpenRouter Model Switcher Skill

This script tests the basic functionality of the skill without requiring
actual Railway deployment.
"""

import sys
import os
from pathlib import Path

# Add scripts directory to path
scripts_dir = Path(__file__).parent / "scripts"
sys.path.insert(0, str(scripts_dir))

def test_validate_script():
    """Test the validate_model_switch.py script."""
    print("🧪 Testing validate_model_switch.py...")
    
    try:
        # Import the script
        from validate_model_switch import validate_model_format, check_environment_variables
        
        # Test model format validation
        test_cases = [
            ("openrouter/xiaomi/mimo-v2-flash", True),
            ("openrouter/stepfun/step-3.5-flash:free", True),
            ("openrouter/meta-llama/llama-3.3-70b:free", True),
            ("xiaomi/mimo-v2-flash", True),  # OpenRouter without prefix (now supported)
            ("stepfun/step-3.5-flash:free", True),  # OpenRouter without prefix (now supported)
            ("meta-llama/llama-3.3-70b:free", True),  # OpenRouter without prefix
            ("anthropic/claude-sonnet-4-5", True),  # Anthropic model
            ("openai/gpt-4-turbo-preview", True),  # OpenAI model
            ("deepseek/deepseek-chat", True),  # DeepSeek model
            ("", False),  # Empty
            ("openrouter/", False),  # Incomplete
            ("claude-sonnet-4-5", False),  # Missing provider
            ("invalid-provider/model", False),  # Unsupported provider (not in direct providers list)
        ]
        
        for model, expected in test_cases:
            valid, msg = validate_model_format(model)
            if valid == expected:
                print(f"  ✅ {model}: {'valid' if valid else 'invalid'} (as expected)")
            else:
                print(f"  ❌ {model}: expected {'valid' if expected else 'invalid'}, got {'valid' if valid else 'invalid'}")
                return False
        
        print("  ✅ All format validation tests passed!")
        return True
        
    except Exception as e:
        print(f"  ❌ Error testing validate script: {e}")
        return False

def test_quick_setup_script():
    """Test the quick_setup.py script."""
    print("\n🧪 Testing quick_setup.py...")
    
    try:
        # Check if file exists and is importable
        quick_setup_path = scripts_dir / "quick_setup.py"
        if not quick_setup_path.exists():
            print(f"  ❌ quick_setup.py not found at {quick_setup_path}")
            return False
        
        # Check shebang
        with open(quick_setup_path, 'r', encoding='utf-8') as f:
            first_line = f.readline().strip()
            if not first_line.startswith('#!/usr/bin/env python3'):
                print(f"  ❌ Invalid shebang: {first_line}")
                return False
        
        print("  ✅ quick_setup.py exists and has correct shebang")
        
        # Check for required functions
        with open(quick_setup_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        required_functions = [
            'check_railway_cli',
            'check_project', 
            'get_current_config',
            'validate_model',
            'set_model',
            'deploy',
            'interactive_setup'
        ]
        
        for func in required_functions:
            if f'def {func}' in content:
                print(f"  ✅ Function '{func}' found")
            else:
                print(f"  ❌ Function '{func}' missing")
                return False
        
        print("  ✅ All required functions present!")
        return True
        
    except Exception as e:
        print(f"  ❌ Error testing quick setup script: {e}")
        return False

def test_skill_structure():
    """Test the overall skill directory structure."""
    print("\n🧪 Testing skill directory structure...")
    
    skill_dir = Path(__file__).parent
    required_files = [
        "SKILL.md",
        "README.md", 
        "QUICK_REFERENCE.md",
        "scripts/__init__.py",
        "scripts/validate_model_switch.py",
        "scripts/quick_setup.py"
    ]
    
    for file_path in required_files:
        full_path = skill_dir / file_path
        if full_path.exists():
            print(f"  ✅ {file_path} exists")
        else:
            print(f"  ❌ {file_path} missing")
            return False
    
    # Check SKILL.md metadata
    skill_md = skill_dir / "SKILL.md"
    with open(skill_md, 'r', encoding='utf-8') as f:
        content = f.read()
        
    required_metadata = [
        'name: openrouter-model-switcher',
        'description:',
        'metadata:'
    ]
    
    for meta in required_metadata:
        if meta.lower() in content.lower():
            print(f"  ✅ SKILL.md contains '{meta}'")
        else:
            print(f"  ❌ SKILL.md missing '{meta}'")
            return False
    
    print("  ✅ Skill structure is complete!")
    return True

def main():
    print("="*60)
    print("OpenRouter Model Switcher Skill - Test Suite")
    print("="*60 + "\n")
    
    tests = [
        test_skill_structure,
        test_validate_script,
        test_quick_setup_script
    ]
    
    results = []
    for test in tests:
        try:
            result = test()
            results.append(result)
        except Exception as e:
            print(f"  ❌ Test failed with exception: {e}")
            results.append(False)
    
    print("\n" + "="*60)
    print("Test Results Summary")
    print("="*60)
    
    passed = sum(results)
    total = len(results)
    
    if all(results):
        print(f"✅ All {total} tests passed!")
        print("\n🎉 Skill is ready to use!")
        return 0
    else:
        print(f"❌ {passed}/{total} tests passed")
        print("\n⚠️  Please fix the failing tests before using the skill.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
