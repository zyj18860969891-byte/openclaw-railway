#!/bin/bash

echo "=== Copying template files ==="

# Create directory if it doesn't exist
mkdir -p /app/docs/reference/templates

# Check if source files exist
if [ -f "docs/reference/templates/IDENTITY.md" ]; then
    echo "Source IDENTITY.md found"
    cp -v docs/reference/templates/IDENTITY.md /app/docs/reference/templates/
else
    echo "Source IDENTITY.md not found, creating a minimal one"
    cat > /app/docs/reference/templates/IDENTITY.md << 'EOF'
- Name: Default Agent
- Creature: protocol droid
- Vibe: helpful
- Emoji: 🤖
EOF
fi

# Verify the file was copied
echo "=== Verifying IDENTITY.md ==="
if [ -f "/app/docs/reference/templates/IDENTITY.md" ]; then
    echo "✅ IDENTITY.md found with $(wc -l < /app/docs/reference/templates/IDENTITY.md) lines"
    head -5 /app/docs/reference/templates/IDENTITY.md
else
    echo "❌ IDENTITY.md missing!"
    exit 1
fi

echo "=== Template files copied successfully ==="