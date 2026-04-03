.PHONY: help setup dev build start crawler ingest query clean docker-up docker-down

help:
	@echo "Doc-Speak Commands"
	@echo "=================="
	@echo "setup          - Install dependencies and setup environment"
	@echo "dev            - Start dev server (crawler + web app)"
	@echo "web            - Start web app only"
	@echo "crawler        - Start crawler only"
	@echo "ingest-all     - Ingest all vendors"
	@echo "ingest-vendor  - Ingest specific vendor (make ingest-vendor VENDOR=vendor-a)"
	@echo "query          - Test query from CLI (make query QUERY='Your question' VENDORS='vendor-a'"
	@echo "db-migrate     - Run database migrations"
	@echo "db-studio      - Open Prisma Studio"
	@echo "build          - Build for production"
	@echo "start          - Start production server"
	@echo "clean          - Remove build artifacts and node_modules"
	@echo "ollama-pull    - Pull required Ollama models"
	@echo "docker-up      - Start Docker containers"
	@echo "docker-down    - Stop Docker containers"

setup:
	@echo "Running setup..."
	@bash setup.sh

dev:
	npm run dev

web:
	npm run server:dev

crawler:
	npm run crawler:run

ingest-all:
	npm run crawler:build
	node dist/cli/ingest.js all

ingest-vendor:
	@if [ -z "$(VENDOR)" ]; then \
		echo "Usage: make ingest-vendor VENDOR=vendor-a"; \
		exit 1; \
	fi
	npm run crawler:build
	node dist/cli/ingest.js $(VENDOR)

query:
	@if [ -z "$(QUERY)" ] || [ -z "$(VENDORS)" ]; then \
		echo "Usage: make query QUERY='Your question' VENDORS='vendor-a vendor-b'"; \
		exit 1; \
	fi
	npm run crawler:build
	node dist/cli/query.js "$(QUERY)" $(VENDORS)

db-migrate:
	npm run db:migrate

db-studio:
	npm run db:studio

build:
	npm run build

start:
	npm start

clean:
	rm -rf node_modules dist .next
	rm -f rag_chat.db

ollama-pull:
	@echo "Pulling Ollama models..."
	ollama pull nomic-embed-text
	ollama pull mistral
	ollama list

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down
