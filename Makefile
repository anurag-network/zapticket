.PHONY: help up down restart build push clean logs status

# Default target
help:
	@echo "ZapTicket Deployment Commands"
	@echo ""
	@echo "Docker Compose Commands:"
	@echo "  make up        - Start all services"
	@echo "  make down      - Stop all services"
	@echo "  make restart   - Restart all services"
	@echo "  make build     - Build Docker images"
	@echo "  make clean     - Remove containers and volumes"
	@echo ""
	@echo "Kubernetes Commands:"
	@echo "  make k8s-apply     - Apply Kubernetes manifests"
	@echo "  make k8s-delete    - Remove Kubernetes resources"
	@echo "  make k8s-logs      - View API logs"
	@echo "  make k8s-logs-web  - View Web logs"
	@echo "  make k8s-status    - Check K8s deployment status"
	@echo ""
	@echo "Utility Commands:"
	@echo "  make logs       - View API logs (Docker)"
	@echo "  make logs-web   - View Web logs (Docker)"
	@echo "  make status     - Check Docker status"
	@echo ""

# ===================
# Docker Compose
# ===================

up:
	@echo "Starting ZapTicket with Docker Compose..."
	docker compose up -d
	@echo ""
	@echo "ZapTicket is running:"
	@echo "  - Web UI: http://localhost:3000"
	@echo "  - API:    http://localhost:3001"

down:
	docker compose down

restart:
	docker compose restart

build:
	docker compose build --no-cache

build-dev:
	docker compose build

push:
	@echo "Pushing images to registry..."
	@echo "Update REGISTRY in .env before running this!"

clean:
	@echo "Stopping and removing all containers and volumes..."
	docker compose down -v

logs:
	docker logs zapticket-api -f --tail 100

logs-web:
	docker logs zapticket-web -f --tail 100

status:
	@echo "Docker Compose Status:"
	@docker compose ps
	@echo ""
	@echo "Kubernetes Status:"
	@kubectl get pods -n zapticket 2>/dev/null || echo "Not deployed to K8s"

# ===================
# Kubernetes
# ===================

NAMESPACE=zapticket

k8s-apply:
	@echo "Deploying to Kubernetes..."
	kubectl apply -k ./k8s/

k8s-delete:
	@echo "Removing from Kubernetes..."
	kubectl delete -k ./k8s/ --ignore-not-found

k8s-restart:
	kubectl rollout restart deployment/api -n $(NAMESPACE)
	kubectl rollout restart deployment/web -n $(NAMESPACE)

k8s-logs:
	kubectl logs -n $(NAMESPACE) -l app=api --tail=100 -f

k8s-logs-web:
	kubectl logs -n $(NAMESPACE) -l app=web --tail=100 -f

k8s-status:
	@echo "Kubernetes Resources:"
	kubectl get all -n $(NAMESPACE)

k8s-pods:
	kubectl get pods -n $(NAMESPACE) -w

k8s-services:
	kubectl get svc -n $(NAMESPACE)

k8s-ingress:
	kubectl get ingress -n $(NAMESPACE)

# ===================
# Development
# ===================

dev:
	docker compose -f docker-compose.dev.yml up

dev-build:
	docker compose -f docker-compose.dev.yml build

dev-clean:
	docker compose -f docker-compose.dev.yml down -v
