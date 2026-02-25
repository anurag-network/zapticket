#!/bin/bash

# ZapTicket Deployment Script
# Supports both Docker Compose and Kubernetes deployments

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo ""
    echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  ${1}${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓ ${1}${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ ${1}${NC}"
}

print_error() {
    echo -e "${RED}✗ ${1}${NC}"
}

check_command() {
    if ! command -v $1 &> /dev/null; then
        print_error "$1 is not installed"
        return 
    return 1
    fi0
}

# Main menu
show_menu() {
    print_header "ZapTicket Deployment Manager"
    
    echo "Choose your deployment method:"
    echo ""
    echo "  1. 🚢 Docker Compose (Recommended for local/single server)"
    echo "  2. ☸ Kubernetes (Recommended for production/clusters)"
    echo "  3. 🔨 Build only (Build Docker images)"
    echo "  4. 📦 Pull from registry (For Kubernetes)"
    echo ""
    echo "  0. Exit"
    echo ""
    read -p "Enter your choice [0-4]: " choice
    echo ""
}

# Docker Compose deployment
deploy_docker() {
    print_header "Deploying with Docker Compose"
    
    # Check Docker
    if ! check_command "docker"; then
        print_error "Docker is required. Install from: https://docs.docker.com/get-docker/"
        return 1
    fi
    
    if ! check_command "docker-compose" && ! docker compose version &> /dev/null; then
        print_error "Docker Compose is required."
        return 1
    fi
    
    # Check if .env exists
    if [ ! -f .env ]; then
        print_warning ".env file not found. Creating from example..."
        cp .env.example .env
        print_warning "Please update .env with your settings before continuing!"
        echo ""
        read -p "Continue with default values? (y/n): " confirm
        if [ "$confirm" != "y" ]; then
            return 0
        fi
    fi
    
    # Pull latest images or build
    echo ""
    echo "Building and starting containers..."
    echo ""
    
    if docker compose version &> /dev/null; then
        docker compose up -d --build
    else
        docker-compose up -d --build
    fi
    
    echo ""
    print_success "ZapTicket deployed successfully!"
    echo ""
    echo "Access the application:"
    echo "  - Web UI: http://localhost:3000"
    echo "  - API:    http://localhost:3001"
    echo "  - MinIO:  http://localhost:9000 (console: http://localhost:9001)"
    echo ""
    
    # Show status
    if docker compose version &> /dev/null; then
        docker compose ps
    else
        docker-compose ps
    fi
}

# Docker Compose stop
stop_docker() {
    print_header "Stopping Docker Compose services"
    
    if docker compose version &> /dev/null; then
        docker compose down
    else
        docker-compose down
    fi
    
    print_success "Services stopped"
}

# Docker Compose remove
remove_docker() {
    print_header "Removing Docker Compose services and data"
    
    print_warning "This will remove all containers and data volumes!"
    read -p "Are you sure? (yes/no): " confirm
    
    if [ "$confirm" == "yes" ]; then
        if docker compose version &> /dev/null; then
            docker compose down -v --remove-orphans
        else
            docker-compose down -v --remove-orphans
        fi
        print_success "All services and data removed"
    fi
}

# Kubernetes deployment
deploy_kubernetes() {
    print_header "Deploying with Kubernetes"
    
    # Check kubectl
    if ! check_command "kubectl"; then
        print_error "kubectl is required. Install from: https://kubernetes.io/docs/tasks/tools/"
        return 1
    fi
    
    # Check if cluster is accessible
    if ! kubectl cluster-info &> /dev/null; then
        print_error "Cannot connect to Kubernetes cluster"
        return 1
    fi
    
    # Check if context is set
    print_success "Connected to Kubernetes cluster"
    
    # Update secrets
    print_warning "Please update secrets in k8s/02-secrets.yaml before deploying!"
    echo ""
    read -p "Continue? (y/n): " confirm
    if [ "$confirm" != "y" ]; then
        return 0
    fi
    
    # Build and push images
    echo ""
    read -p "Build and push images to registry? (y/n): " build_choice
    if [ "$build_choice" == "y" ]; then
        build_images
    fi
    
    # Update image references in k8s files
    read -p "Enter registry URL (e.g., docker.io/youruser): " registry
    if [ -n "$registry" ]; then
        # Update image references
        sed -i "s|your-registry|$registry|g" k8s/20-api.yaml k8s/21-web.yaml
    fi
    
    # Deploy
    echo ""
    echo "Deploying to Kubernetes..."
    kubectl apply -k k8s/
    
    echo ""
    print_success "ZapTicket deployed to Kubernetes!"
    echo ""
    echo "Check status with:"
    echo "  kubectl get pods -n zapticket"
    echo "  kubectl get svc -n zapticket"
    echo ""
    
    # Show pods
    kubectl get pods -n zapticket
}

# Kubernetes remove
remove_kubernetes() {
    print_header "Removing Kubernetes deployment"
    
    print_warning "This will remove all resources from namespace zapticket!"
    read -p "Are you sure? (yes/no): " confirm
    
    if [ "$confirm" == "yes" ]; then
        kubectl delete -k k8s/ --ignore-not-found
        print_success "All Kubernetes resources removed"
    fi
}

# Build Docker images
build_images() {
    print_header "Building Docker Images"
    
    read -p "Enter registry URL (or press Enter for local): " registry
    read -p "Enter image tag [latest]: " tag
    tag=${tag:-latest}
    
    registry=${registry:-}
    
    echo ""
    echo "Building API image..."
    docker build -t ${registry}zapticket-api:${tag} -f apps/api/Dockerfile .
    
    echo "Building Web image..."
    docker build -t ${registry}zapticket-web:${tag} -f apps/web/Dockerfile .
    
    if [ -n "$registry" ]; then
        echo ""
        echo "Pushing images to registry..."
        docker push ${registry}zapticket-api:${tag}
        docker push ${registry}zapticket-web:${tag}
    fi
    
    print_success "Images built successfully"
}

# Pull images for Kubernetes
pull_images() {
    print_header "Pulling Docker Images for Kubernetes"
    
    read -p "Enter registry URL: " registry
    read -p "Enter image tag [latest]: " tag
    tag=${tag:-latest}
    
    echo ""
    echo "Pulling images..."
    docker pull ${registry}zapticket-api:${tag}
    docker pull ${registry}zapticket-web:${tag}
    
    print_success "Images pulled successfully"
}

# Show status
show_status() {
    print_header "ZapTicket Status"
    
    echo "Docker Compose:"
    if docker compose version &> /dev/null; then
        docker compose ps 2>/dev/null || echo "  Not running"
    else
        docker-compose ps 2>/dev/null || echo "  Not running"
    fi
    
    echo ""
    echo "Kubernetes:"
    if kubectl get ns zapticket &> /dev/null; then
        kubectl get pods,svc -n zapticket 2>/dev/null || echo "  Not deployed"
    else
        echo "  Not deployed"
    fi
}

# Show logs
show_logs() {
    echo "Select service to view logs:"
    echo "  1. API (Docker)"
    echo "  2. Web (Docker)"
    echo "  3. API (Kubernetes)"
    echo "  4. Web (Kubernetes)"
    read -p "Choice: " choice
    
    case $choice in
        1) docker logs zapticket-api -f --tail 100 ;;
        2) docker logs zapticket-web -f --tail 100 ;;
        3) kubectl logs -n zapticket -l app=api -f --tail 100 ;;
        4) kubectl logs -n zapticket -l app=web -f --tail 100 ;;
    esac
}

# Main loop
while true; do
    show_menu
    case $choice in
        1) deploy_docker ;;
        2) deploy_kubernetes ;;
        3) build_images ;;
        4) pull_images ;;
        0) echo "Goodbye!"; exit 0 ;;
        "status") show_status ;;
        "logs") show_logs ;;
        "stop") stop_docker ;;
        "remove") remove_docker ;;
        *) print_error "Invalid option" ;;
    esac
    echo ""
done
