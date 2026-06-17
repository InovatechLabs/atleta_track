FieldVision — Plataforma de Análise de Desempenho Físico com IA
Projeto full stack focado na análise de desempenho físico de atletas de futebol de alto rendimento. A plataforma combina a ingestão robusta de dados via planilhas (Excel/CSV), persistência relacional e um motor de Inteligência Artificial dedicado (Microsserviço) para detecção de anomalias e clusterização de perfis, apresentados em um dashboard responsivo.

🚀 Arquitetura e Stack Tecnológico
O projeto adota uma arquitetura distribuída, separando as responsabilidades da plataforma web das rotinas de Machine Learning.

Frontend: React 18 + TypeScript + Tailwind CSS + Recharts

Backend (Core): Node.js + Express + TypeScript (Arquitetura em MVC/Services)

Banco de Dados & ORM: PostgreSQL 16 + Prisma ORM

Motor de IA (Microsserviço): Python + FastAPI + scikit-learn (K-Means e Isolation Forest)

Processamento de Dados: Multer + XLSX + csv-parser

⚙️ Como executar o ambiente completo
Para que a plataforma funcione integralmente, incluindo as predições de inteligência artificial, você precisará rodar a plataforma principal (via Docker) e o motor de IA em paralelo.

Passo 1: Iniciar o Sistema Principal (Node.js + React + Postgres)
Acesse a pasta principal do projeto (fieldvision_main) e levante os containers:

Bash
docker compose up -d --build
Acessos disponibilizados:

Frontend: http://localhost:5173

API (Healthcheck): http://localhost:3333/api/health

Banco de Dados: localhost:5432

Passo 2: Iniciar o Motor de IA (fv-categorizing)
O serviço de inteligência artificial deve estar ativo para processar a clusterização e as anomalias durante a importação de dados.

Abra um novo terminal e navegue até a pasta do microsserviço: cd fv-categorizing

Instale as dependências: pip install -r requirements.txt --trusted-host pypi.org --trusted-host pypi.python.org --trusted-host files.pythonhosted.org

Inicie o servidor da API:

Bash
python -m uvicorn main:app --reload --port 8000
O motor de IA ficará disponível em http://localhost:8000 aguardando as requisições do Node.js.

🧠 Inteligência Artificial Explicável (Explainable AI)
O FieldVision utiliza o conceito de IA Explicável. O microsserviço em Python toma as decisões complexas, enquanto o Node.js atua como uma camada estatística que traduz essas decisões em insights claros para a comissão técnica.

1. Perfilamento Automático de Atletas (K-Means)
Logo após a importação de uma planilha, o sistema principal agrega as métricas de cada jogador e as envia para o endpoint /predict do motor de IA. O algoritmo K-Means agrupa o atleta em um de cinco clusters não-supervisionados:

Explosivo: Alto número de sprints e velocidade máxima.

Alta Resistência: Elevada distância total e volume de trabalho contínuo.

Baixa Intensidade: Baixa carga de trabalho e distância.

Alta Carga de Impacto: Elevado número de acelerações/desacelerações bruscas.

Equilibrado: Atuação consistente sem extremos evidentes.

2. Detecção de Queda de Desempenho (Isolation Forest)
Durante a importação de novas partidas, o backend em Node.js isola o histórico recente de cada jogador (médias de base) e envia junto com a partida atual para a rota /detect-anomaly do motor de IA.

A Decisão: O modelo Isolation Forest avalia os vetores e decide automaticamente se a sessão atual é uma anomalia (ponto fora da curva).

A Explicação: Caso a IA confirme a anomalia, o Node.js calcula a porcentagem exata da queda (ex: "Queda de 24% em relação à média") para categorizar a severidade do alerta (Baixo, Médio ou Alto) e apresentá-lo de forma digerível no dashboard.

📊 Importação de Dados e Endpoints
Na tela Importar, envie um arquivo .xlsx, .xls ou .csv. O projeto exige o cumprimento de colunas oficiais para o processamento padrão.

Arquivos de teste disponíveis no repositório:

samples/fieldvision_sample.xlsx

samples/fieldvision_sample.csv

Colunas obrigatórias mínimas: Athlete ID e Start Date.

Endpoints da API Principal (Node.js)
POST /api/import — Importa planilhas em batch via multipart/form-data.

GET /api/athletes — Lista de atletas.

GET /api/performances — Registros de desempenho (suporta filtros complexos).

GET /api/dashboard — Indicadores e KPIs agregados.

GET /api/compare?ids=A,B — Comparativo analítico entre perfis.

GET /api/alerts — Lista de alertas gerados pela IA.

Filtros Aceitos (Dashboard e Performances)
Os endpoints de consulta aceitam query params para granularidade analítica:
athleteId, position, group, segment, startDate, endDate.

Exemplo de uso:

Bash
GET /api/dashboard?position=Forward&startDate=2026-01-01&endDate=2026-03-31
Aviso: O sistema opera estritamente com dados reais e não injeta dados mockados no código. O dashboard e os gráficos permanecerão zerados até a primeira importação bem-sucedida de uma planilha pela comissão técnica.
