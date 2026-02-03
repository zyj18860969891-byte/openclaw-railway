#!/bin/bash

echo "=== Copying template files ==="

# Create directory if it doesn't exist
mkdir -p /app/docs/reference/templates

# Copy all template files
echo "Copying all template files..."
cp -v docs/reference/templates/*.md /app/docs/reference/templates/ 2>/dev/null || echo "Some files may not exist"

# Check if critical files exist and create them if missing
CRITICAL_FILES=("IDENTITY.md" "USER.md" "AGENTS.md" "TOOLS.md" "SOUL.md")
for file in "${CRITICAL_FILES[@]}"; do
    if [ ! -f "/app/docs/reference/templates/$file" ]; then
        echo "Creating minimal $file..."
        case $file in
            "IDENTITY.md")
                cat > /app/docs/reference/templates/$file << 'EOF'
- Name: Default Agent
- Creature: protocol droid
- Vibe: helpful
- Emoji: 🤖
EOF
                ;;
            "USER.md")
                cat > /app/docs/reference/templates/$file << 'EOF'
- Name: User
- Type: human
- Description: The end user of the system
EOF
                ;;
            "AGENTS.md")
                cat > /app/docs/reference/templates/$file << 'EOF'
# Agents Template

This file defines the agent configuration and capabilities.
EOF
                ;;
            "TOOLS.md")
                cat > /app/docs/reference/templates/$file << 'EOF'
# Tools Template

This file defines the available tools and their usage.
EOF
                ;;
            "SOUL.md")
                cat > /app/docs/reference/templates/$file << 'EOF'
# Soul Template

This file defines the agent's personality and characteristics.
EOF
                ;;
        esac
    fi
done

# Verify the files were copied
echo "=== Verifying template files ==="
ls -la /app/docs/reference/templates/

# Check for critical files
for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "/app/docs/reference/templates/$file" ]; then
        echo "✅ $file found with $(wc -l < /app/docs/reference/templates/$file) lines"
    else
        echo "❌ $file missing!"
        exit 1
    fi
done

echo "=== Template files copied successfully ==="