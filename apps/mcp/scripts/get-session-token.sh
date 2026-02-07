#!/bin/bash

# Kahuna MCP - Session Token Helper
# This script helps you get a session token for the MCP server.

echo "🔑 Kahuna Session Token Helper"
echo "================================"
echo ""

# API URL (default to localhost)
API_URL="${KAHUNA_API_URL:-http://localhost:3000}"
echo "API URL: $API_URL"
echo ""

# Ask for action
echo "What would you like to do?"
echo "1. Register a new account"
echo "2. Login to existing account"
echo ""
read -p "Enter choice (1 or 2): " choice

echo ""

if [ "$choice" == "1" ]; then
    echo "📝 Register New Account"
    echo "-----------------------"
    read -p "Enter email: " email
    read -s -p "Enter password (min 8 chars): " password
    echo ""
    echo ""
    echo "Registering..."
    
    response=$(curl -s -i -X POST "$API_URL/api/auth/register" \
        -H "Content-Type: application/json" \
        -d "{\"email\": \"$email\", \"password\": \"$password\"}")
    
elif [ "$choice" == "2" ]; then
    echo "🔓 Login to Existing Account"
    echo "----------------------------"
    read -p "Enter email: " email
    read -s -p "Enter password: " password
    echo ""
    echo ""
    echo "Logging in..."
    
    response=$(curl -s -i -X POST "$API_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\": \"$email\", \"password\": \"$password\"}")
else
    echo "❌ Invalid choice"
    exit 1
fi

# Extract the session cookie
# Looking for: Set-Cookie: kahuna.sid=xxxxx; or similar
session_token=$(echo "$response" | grep -i "set-cookie:" | grep -o "kahuna\.sid=[^;]*" | cut -d'=' -f2)

# Also try the signed version (s: prefix)
if [ -z "$session_token" ]; then
    session_token=$(echo "$response" | grep -i "set-cookie:" | grep -o "kahuna\.sid=s%3A[^;]*" | cut -d'=' -f2)
fi

echo ""

# Check if successful
if echo "$response" | grep -q '"success":true'; then
    echo "✅ Success!"
    echo ""
    
    if [ -n "$session_token" ]; then
        echo "🎟️  Your Session Token:"
        echo "----------------------------"
        echo "$session_token"
        echo "----------------------------"
        echo ""
        echo "📋 Copy this to your Claude Desktop config:"
        echo ""
        echo "\"KAHUNA_SESSION_TOKEN\": \"$session_token\""
        echo ""
        echo ""
        echo "📄 Full Claude Desktop Configuration:"
        echo "======================================"
        echo "Edit: ~/Library/Application Support/Claude/claude_desktop_config.json"
        echo ""
        cat << EOF
{
  "mcpServers": {
    "kahuna": {
      "command": "node",
      "args": ["$(pwd)/apps/mcp/dist/index.js"],
      "env": {
        "KAHUNA_API_URL": "$API_URL",
        "KAHUNA_SESSION_TOKEN": "$session_token",
        "ANTHROPIC_API_KEY": "YOUR-ANTHROPIC-KEY-HERE"
      }
    }
  }
}
EOF
        echo ""
        echo "⚠️  Remember to:"
        echo "   1. Replace YOUR-ANTHROPIC-KEY-HERE with your actual Anthropic API key"
        echo "   2. Restart Claude Desktop after saving the config"
    else
        echo "⚠️  Could not extract session token from response."
        echo "Full response headers:"
        echo "$response" | head -20
    fi
else
    echo "❌ Failed!"
    echo ""
    # Extract error message
    error=$(echo "$response" | tail -1)
    echo "Response: $error"
fi
