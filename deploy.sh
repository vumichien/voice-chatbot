#!/bin/bash

# Voice Chatbot Deployment Script
# Quick deployment script for both backend and frontend

set -e  # Exit on error

echo "=========================================="
echo "Voice Chatbot Deployment Script"
echo "=========================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}Error: Vercel CLI not found${NC}"
    echo "Install it with: npm install -g vercel"
    exit 1
fi

# Function to deploy backend
deploy_backend() {
    echo -e "${YELLOW}Deploying Backend...${NC}"
    cd backend

    if vercel --prod; then
        echo -e "${GREEN}✓ Backend deployed successfully${NC}"
        echo ""
        echo "Backend URL: https://backend-vumichies-projects.vercel.app"
        echo ""
    else
        echo -e "${RED}✗ Backend deployment failed${NC}"
        exit 1
    fi

    cd ..
}

# Function to deploy frontend
deploy_frontend() {
    echo -e "${YELLOW}Deploying Frontend...${NC}"
    cd frontend

    # Check if .env exists
    if [ ! -f .env ]; then
        echo -e "${YELLOW}Creating .env file...${NC}"
        echo "VITE_API_URL=https://backend-vumichies-projects.vercel.app/api" > .env
    fi

    # Build locally first
    echo -e "${YELLOW}Building frontend...${NC}"
    if npm run build; then
        echo -e "${GREEN}✓ Build successful${NC}"
    else
        echo -e "${RED}✗ Build failed${NC}"
        exit 1
    fi

    # Deploy
    if vercel --prod; then
        echo -e "${GREEN}✓ Frontend deployed successfully${NC}"
        echo ""
        echo "Frontend URL: https://frontend-vumichies-projects.vercel.app"
        echo ""
    else
        echo -e "${RED}✗ Frontend deployment failed${NC}"
        exit 1
    fi

    cd ..
}

# Function to test deployments
test_deployments() {
    echo -e "${YELLOW}Testing deployments...${NC}"

    # Test backend health
    echo "Testing backend health endpoint..."
    if curl -s https://backend-vumichies-projects.vercel.app/api/health | grep -q "ok"; then
        echo -e "${GREEN}✓ Backend health check passed${NC}"
    else
        echo -e "${RED}✗ Backend health check failed${NC}"
    fi

    echo ""
    echo -e "${GREEN}Deployment complete!${NC}"
    echo ""
    echo "Frontend: https://frontend-vumichies-projects.vercel.app"
    echo "Backend:  https://backend-vumichies-projects.vercel.app"
    echo ""
}

# Main menu
echo "What would you like to deploy?"
echo "1) Backend only"
echo "2) Frontend only"
echo "3) Both (backend first, then frontend)"
echo "4) Exit"
echo ""
read -p "Enter choice [1-4]: " choice

case $choice in
    1)
        deploy_backend
        test_deployments
        ;;
    2)
        deploy_frontend
        test_deployments
        ;;
    3)
        deploy_backend
        deploy_frontend
        test_deployments
        ;;
    4)
        echo "Exiting..."
        exit 0
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac
