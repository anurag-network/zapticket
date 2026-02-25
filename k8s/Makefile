.PHONY: help deploy undeploy build push restart logs status

NAMESPACE=zapticket
REGISTRY=your-registry
TAG=latest

help:
	@echo "ZapTicket Kubernetes Deployment"
	@echo ""
	@echo "Available commands:"
	@echo "  make deploy        - Deploy to Kubernetes"
	@echo "  make undeploy      - Remove from Kubernetes"
	@echo "  make build         - Build Docker images"
	@echo "  make push          - Push Docker images to registry"
	@echo "  make restart       - Restart deployments"
	@echo "  make logs          - View API logs"
	@echo "  make status        - Check deployment status"

deploy:
	kubectl apply -k ./k8s/

undeploy:
	kubectl delete -k ./k8s/

build:
	docker build -t $(REGISTRY)/zapticket-api:$(TAG) -f apps/api/Dockerfile .
	docker build -t $(REGISTRY)/zapticket-web:$(TAG) -f apps/web/Dockerfile .

push:
	docker push $(REGISTRY)/zapticket-api:$(TAG)
	docker push $(REGISTRY)/zapticket-web:$(TAG)

restart:
	kubectl rollout restart deployment/api -n $(NAMESPACE)
	kubectl rollout restart deployment/web -n $(NAMESPACE)

logs:
	kubectl logs -n $(NAMESPACE) -l app=api --tail=100 -f

logs-web:
	kubectl logs -n $(NAMESPACE) -l app=web --tail=100 -f

status:
	kubectl get all -n $(NAMESPACE)

pods:
	kubectl get pods -n $(NAMESPACE) -w

services:
	kubectl get svc -n $(NAMESPACE)

ingress:
	kubectl get ingress -n $(NAMESPACE)

secrets:
	@echo "Update secrets in k8s/02-secrets.yaml before deploying!"
	@echo "Important: Change all default passwords and keys!"
