.PHONY: up down logs shell-backend shell-db test seed migrate reset

## Subir todos os serviços
up:
	docker compose up -d
	@echo "✅ Serviços iniciados"
	@echo "   Frontend : http://localhost:3000"
	@echo "   API docs : http://localhost:8000/docs"

## Parar todos os serviços
down:
	docker compose down

## Logs em tempo real
logs:
	docker compose logs -f

## Shell no backend
shell-backend:
	docker compose exec backend bash

## Shell no banco
shell-db:
	docker compose exec db psql -U atletatrack -d atletatrack

## Rodar testes
test:
	docker compose exec backend pytest tests/ -v

## Rodar seed manualmente
seed:
	docker compose exec backend python seed.py

## Aplicar migrações
migrate:
	docker compose exec backend alembic upgrade head

## Nova migração
migration:
	docker compose exec backend alembic revision --autogenerate -m "$(msg)"

## Resetar banco (cuidado!)
reset:
	docker compose down -v
	docker compose up -d
	@echo "⚠ Banco resetado e serviços reiniciados"

## Build de produção
build-prod:
	docker compose -f docker-compose.yml -f docker-compose.prod.yml build

## Subir em produção
up-prod:
	docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

## Rodar K-Means (classificar perfis)
classify:
	@TOKEN=$$(curl -s -X POST http://localhost:8000/api/auth/login \
		-d "username=admin@atletatrack.app&password=atletatrack123" \
		| python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])") && \
	curl -s -X POST http://localhost:8000/api/athletes/classify-profiles \
		-H "Authorization: Bearer $$TOKEN" | python3 -m json.tool
