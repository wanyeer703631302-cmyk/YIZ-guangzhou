#!/bin/bash

# Deployment Script
# Usage: bash deploy.sh [target]
# Targets: static (default), vercel, netlify, docker

set -e

TARGET=${1:-static}
PROJECT_NAME=$(basename "$PWD")
BUILD_DIR="dist"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if build exists
check_build() {
  if [ ! -d "$BUILD_DIR" ]; then
    print_info "Build directory not found. Building..."
    npm run build
  fi
}

# Deploy to static hosting
deploy_static() {
  print_info "Deploying to static hosting..."
  
  check_build
  
  # Check if dist/index.html exists
  if [ ! -f "$BUILD_DIR/index.html" ]; then
    print_error "index.html not found in $BUILD_DIR"
    exit 1
  fi
  
  print_success "Build ready for deployment!"
  print_info "Build location: $(pwd)/$BUILD_DIR"
  print_info "You can now deploy this folder to any static hosting service."
  print_info ""
  print_info "Recommended services:"
  print_info "  - Vercel: npx vercel --prod"
  print_info "  - Netlify: npx netlify deploy --prod --dir=$BUILD_DIR"
  print_info "  - GitHub Pages: Push to gh-pages branch"
}

# Deploy to Vercel
deploy_vercel() {
  print_info "Deploying to Vercel..."
  
  check_build
  
  if ! command -v vercel &> /dev/null; then
    print_info "Installing Vercel CLI..."
    npm install -g vercel
  fi
  
  vercel --prod
  print_success "Deployed to Vercel!"
}

# Deploy to Netlify
deploy_netlify() {
  print_info "Deploying to Netlify..."
  
  check_build
  
  if ! command -v netlify &> /dev/null; then
    print_info "Installing Netlify CLI..."
    npm install -g netlify-cli
  fi
  
  netlify deploy --prod --dir="$BUILD_DIR"
  print_success "Deployed to Netlify!"
}

# Build Docker image
deploy_docker() {
  print_info "Building Docker image..."
  
  check_build
  
  # Create Dockerfile if not exists
  if [ ! -f "Dockerfile" ]; then
    print_info "Creating Dockerfile..."
    cat > Dockerfile << 'EOF'
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
EOF
  fi
  
  # Create nginx.conf if not exists
  if [ ! -f "nginx.conf" ]; then
    print_info "Creating nginx.conf..."
    cat > nginx.conf << 'EOF'
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF
  fi
  
  docker build -t "$PROJECT_NAME:latest" .
  print_success "Docker image built: $PROJECT_NAME:latest"
  print_info "Run with: docker run -p 8080:80 $PROJECT_NAME:latest"
}

# Main
case $TARGET in
  static)
    deploy_static
    ;;
  vercel)
    deploy_vercel
    ;;
  netlify)
    deploy_netlify
    ;;
  docker)
    deploy_docker
    ;;
  *)
    print_error "Unknown target: $TARGET"
    print_info "Usage: bash deploy.sh [static|vercel|netlify|docker]"
    exit 1
    ;;
esac
