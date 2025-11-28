#!/bin/bash

# Smart Group Evaluator - Automated Vercel Deployment Script

echo "🚀 Starting automated deployment..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to deploy frontend
deploy_frontend() {
    echo -e "${BLUE}📦 Deploying Frontend...${NC}"
    cd client
    
    # Deploy to Vercel
    npx vercel --prod --yes \
        --name smart-group-evaluator-frontend \
        --build-env VITE_API_URL=$BACKEND_URL/api
    
    FRONTEND_URL=$(npx vercel --prod --yes 2>&1 | grep -o 'https://[^ ]*')
    echo -e "${GREEN}✅ Frontend deployed: $FRONTEND_URL${NC}"
    cd ..
}

# Function to deploy backend
deploy_backend() {
    echo -e "${BLUE}📦 Deploying Backend...${NC}"
    cd server
    
    # Deploy to Vercel
    npx vercel --prod --yes \
        --name smart-group-evaluator-backend \
        --env MONGODB_URI=$MONGODB_URI \
        --env JWT_SECRET=$JWT_SECRET \
        --env JWT_EXPIRE=$JWT_EXPIRE \
        --env NODE_ENV=production \
        --env CLIENT_URL=$FRONTEND_URL
    
    BACKEND_URL=$(npx vercel --prod --yes 2>&1 | grep -o 'https://[^ ]*')
    echo -e "${GREEN}✅ Backend deployed: $BACKEND_URL${NC}"
    cd ..
}

# Main deployment
echo "Please provide the following information:"

# Get MongoDB URI
echo -n "MongoDB URI (from MongoDB Atlas): "
read MONGODB_URI

# Generate JWT Secret if not provided
echo -n "JWT Secret (press Enter to auto-generate): "
read JWT_SECRET
if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET=$(openssl rand -base64 32)
    echo "Generated JWT Secret: $JWT_SECRET"
fi

JWT_EXPIRE="7d"

# Deploy backend first
deploy_backend

# Deploy frontend with backend URL
deploy_frontend

# Final output
echo -e "${GREEN}"
echo "================================"
echo "🎉 Deployment Complete!"
echo "================================"
echo "Frontend: $FRONTEND_URL"
echo "Backend: $BACKEND_URL"
echo ""
echo "⚠️  Don't forget to:"
echo "1. Add 0.0.0.0/0 to MongoDB Atlas Network Access"
echo "2. Test your application"
echo "3. Set up custom domain (optional)"
echo -e "${NC}"
