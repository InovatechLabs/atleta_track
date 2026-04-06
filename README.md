# AtletaTrack — Sistema de Análise de Desempenho de Atletas

> ABP 2026-1 · 5.º DSM · FATEC Jacareí · Parceiro: Leandro Spinola

Sistema de informações para análise de desempenho físico de atletas de futebol, com identificação automática de perfis (K-Means) e detecção de quedas de desempenho (Isolation Forest).

---

## Sumário

- [Tecnologias](#tecnologias)
- [Rodando localmente (Docker)](#rodando-localmente)
- [Rodando sem Docker](#rodando-sem-docker)
- [Deploy em produção](#deploy-em-produção)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Requisitos atendidos](#requisitos-atendidos)

---

## Tecnologias

| Camada | Stack |
|--------|-------|
| Frontend | React 18 + TypeScript + Tailwind CSS + Chart.js |
| Backend | Python 3.11 + FastAPI + SQLAlchemy + Alembic |
| IA / ML | scikit-learn (K-Means + Isolation Forest) |
| Banco | PostgreSQL 16 + Redis 7 |
| Armazenamento | AWS S3 (modelos ML + datasets) |
| Containerização | Docker + Docker Compose |
| CI/CD | GitHub Actions |
| Segurança | JWT HS256 · TLS 1.3 · AES-256-GCM (RP04) |

---

## Rodando localmente

### Pré-requisitos

- [Docker](https://www.docker.com/) ≥ 24
- [Docker Compose](https://docs.docker.com/compose/) ≥ 2.20

### 1. Clonar e configurar

```bash
git clone https://github.com/seu-usuario/atletatrack.git
cd atletatrack

# Copiar e editar variáveis de ambiente
cp backend/.env.example backend/.env
# Edite backend/.env com suas configurações reais
```

### 2. Subir os serviços

```bash
docker compose up -d
```

Isso vai:
1. Subir PostgreSQL e Redis
2. Aplicar migrações Alembic automaticamente
3. Rodar o seed com dados de exemplo (22 rodadas, 15 atletas)
4. Iniciar o backend FastAPI em http://localhost:8000
5. Iniciar o frontend React em http://localhost:3000

### 3. Acessar

| Serviço | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| API docs (Swagger) | http://localhost:8000/docs |
| API docs (ReDoc) | http://localhost:8000/redoc |

**Credenciais de demo:**
```
Email:  admin@atletatrack.app
Senha:  atletatrack123
```

### 4. Acompanhar logs

```bash
# Todos os serviços
docker compose logs -f

# Só o backend
docker compose logs -f backend
```

---

## Rodando sem Docker

### Backend

```bash
cd backend

# Criar ambiente virtual
python -m venv venv
source venv/bin/activate   # Linux/Mac
# venv\Scripts\activate    # Windows

# Instalar dependências
pip install -r requirements.txt

# Configurar variáveis de ambiente
cp .env.example .env
# Edite .env com sua URL de PostgreSQL local

# Aplicar migrações
alembic upgrade head

# Rodar seed
python seed.py

# Iniciar servidor
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend

# Instalar dependências
npm install

# Iniciar em modo desenvolvimento
npm run dev
# Disponível em http://localhost:3000
```

---

## Importar dados de partida

### Via interface web

1. Acesse **Importar dados** no menu lateral
2. Selecione a partida (ou crie uma nova)
3. Faça upload do arquivo CSV
4. O sistema roda a detecção de anomalias automaticamente

### Via API

```bash
# 1. Fazer login
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -d "username=admin@atletatrack.app&password=atletatrack123" \
  | jq -r .access_token)

# 2. Criar partida
GAME_ID=$(curl -s -X POST http://localhost:8000/api/games/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"round_number":23,"opponent":"Flamengo","date":"2026-04-13T20:00:00","home_away":"home"}' \
  | jq -r .id)

# 3. Importar CSV
curl -X POST http://localhost:8000/api/games/$GAME_ID/import \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@backend/sample_data_rodada23.csv"
```

### Formato do CSV

```csv
athlete_id,minutes_played,distance_km,sprint_distance_m,high_intensity_run_m,max_speed_kmh,accelerations,decelerations,work_load_index,heart_rate_avg,heart_rate_max
1,90,11.2,890,1620,34.8,24,20,92.0,162,191
2,85,10.1,720,1380,32.1,20,18,81.0,157,185
```

---

## Rodar perfis IA (K-Means)

```bash
curl -X POST http://localhost:8000/api/athletes/classify-profiles \
  -H "Authorization: Bearer $TOKEN"
```

Retorna o mapa `{athlete_id: profile_type}` com os 4 perfis identificados.

---

## Testes

```bash
cd backend
pip install pytest httpx
pytest tests/ -v
```

---

## Deploy em produção

### AWS / qualquer VPS com Docker

```bash
# No servidor
git clone https://github.com/seu-usuario/atletatrack.git /opt/atletatrack
cd /opt/atletatrack

# Configurar variáveis de produção
cp backend/.env.example backend/.env
# Edite com SECRET_KEY forte, credenciais AWS, domínio real

# Colocar certificados TLS em infra/nginx/certs/
# fullchain.pem e privkey.pem (ex: via Let's Encrypt / Certbot)

# Subir em modo produção
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### CI/CD automático (GitHub Actions)

Configure os secrets no repositório:

| Secret | Descrição |
|--------|-----------|
| `DOCKER_USERNAME` | Usuário Docker Hub |
| `DOCKER_PASSWORD` | Token Docker Hub |
| `DEPLOY_HOST` | IP ou hostname do servidor |
| `DEPLOY_USER` | Usuário SSH |
| `DEPLOY_SSH_KEY` | Chave SSH privada |

O pipeline roda automaticamente a cada push na `main`.

---

## Estrutura do projeto

```
atletatrack/
├── backend/
│   ├── app/
│   │   ├── api/routes/       # Controllers (auth, athletes, games, alerts, profiles)
│   │   ├── core/             # Config, database, security
│   │   ├── ml/               # ML Service (K-Means + Isolation Forest) — RP01
│   │   ├── models/           # SQLAlchemy models + Pydantic schemas
│   │   ├── repositories/     # Repository pattern — RP06
│   │   ├── services/         # Business logic (import ETL, alerts Observer)
│   │   └── main.py
│   ├── alembic/              # Migrações de banco
│   ├── tests/                # Testes pytest
│   ├── seed.py               # Dados de exemplo
│   ├── sample_data_rodada23.csv
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/       # Layout, componentes compartilhados
│   │   ├── hooks/            # useAuth (Zustand)
│   │   ├── pages/            # Dashboard, Profiles, Compare, Alerts, Athletes, Import
│   │   └── services/         # API client (axios)
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── infra/
│   ├── docker/               # init.sql
│   └── nginx/                # nginx.prod.conf
├── .github/workflows/        # CI/CD (GitHub Actions)
├── docker-compose.yml
├── docker-compose.prod.yml
└── README.md
```

---

## Requisitos atendidos

| ID | Requisito | Status |
|----|-----------|--------|
| RF01 | Importar dataset histórico | ✅ ImportService + pipeline ETL |
| RF02 | Importar novos dados de partidas | ✅ Endpoint POST /api/games/{id}/import |
| RF03 | Identificar perfis automaticamente | ✅ K-Means (4 clusters) |
| RF04 | Comparar atletas | ✅ GET /api/athletes/compare/{a}/{b} |
| RF05 | Detectar queda de desempenho | ✅ Isolation Forest |
| RF06 | Emitir alertas automáticos | ✅ Padrão Observer |
| RF07 | Dashboard com visualizações | ✅ Chart.js (linha, radar, donut) |
| RF08 | Acesso mobile | ✅ Interface responsiva |
| RNF01 | Interface responsiva | ✅ Tailwind CSS mobile-first |
| RNF02 | Segurança | ✅ JWT + TLS + AES-256 |
| RNF03 | Performance | ✅ Redis cache + workers async |
| RNF04 | Integridade dos dados | ✅ Validação ETL + ACID |
| RNF05 | Clareza das análises | ✅ Dashboards com contexto |
| RP01 | IA obrigatória | ✅ scikit-learn |
| RP02 | Cloud | ✅ PostgreSQL RDS + Redis + S3 |
| RP03 | Mobile responsivo | ✅ Tailwind + Nginx |
| RP04 | Criptografia | ✅ TLS 1.3 + AES-256-GCM + JWT |
| RP05 | Desenvolvimento incremental | ✅ 3 sprints definidas |
| RP06 | Padrão arquitetural | ✅ MVC + Repository + Strategy + Observer |
| RP07 | Documentação | ✅ README + docx de documentação |
