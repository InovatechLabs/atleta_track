# FieldVision reviewed project

This version keeps the existing visual identity and English UI while adding a professional sports-intelligence backend layer for GPS workload analysis, injury risk and performance-drop alerts.

## What changed

### Backend
- Added explainable `InjuryRiskService` with risk score from 0 to 100 and levels: `Low Risk`, `Moderate Risk`, `High Risk`, `Critical Risk`.
- Added `PerformanceDropService` comparing the current session with rolling 3-session, 7-session and baseline windows.
- Added `WorkloadAnalyticsService` for ACWR, acute load, chronic load, rolling average, EWMA, monotony, strain, sprint load, acceleration load, deceleration load and workload deviation.
- Added `ReadinessService` for readiness score and fatigue score.
- Improved GPS import pipeline with CSV/XLSX support, smart column aliases, required-column validation, duplicate-session detection and `ImportLog` persistence.
- Added injury history manual creation and spreadsheet import.
- Added Prisma models and migration for injury history, risk scores, performance alerts, import logs, workload metrics, athlete baselines and benchmarks.
- Standardized new API responses in English.

### Frontend
- Kept the visual identity.
- Improved the Alerts page UX, copy, empty state and severity badges.
- Extended frontend API types to accept new workload, readiness and risk nodes returned by the dashboard and athlete details endpoints.

## Files added or heavily changed

- `backend/prisma/schema.prisma`
- `backend/prisma/migrations/20260526000000_sports_intelligence/migration.sql`
- `backend/src/services/InjuryRiskService.ts`
- `backend/src/services/PerformanceDropService.ts`
- `backend/src/services/WorkloadAnalyticsService.ts`
- `backend/src/services/ReadinessService.ts`
- `backend/src/services/metricUtils.ts`
- `backend/src/services/importService.ts`
- `backend/src/controllers/injuryController.ts`
- `backend/src/controllers/alertController.ts`
- `backend/src/routes/index.ts`
- `backend/src/middlewares/errorHandler.ts`
- `frontend/src/pages/AlertsPage.tsx`
- `frontend/src/types/models.ts`

## How to run

From the project root:

```bash
docker compose up -d db
```

Backend:

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Default API URL used by frontend:

```text
http://localhost:3000/api
```

If your backend is on port 3333, create/update `frontend/.env`:

```env
VITE_API_URL=http://localhost:3333/api
```

## New endpoints

### Manual injury creation

`POST /api/injuries`

```json
{
  "athleteId": "ATH-001",
  "injuryDate": "2026-04-15",
  "type": "Muscle strain",
  "severity": "Moderate",
  "daysOut": 14,
  "bodyRegion": "Hamstring",
  "status": "Recovered",
  "notes": "Returned to full training after rehab block."
}
```

### Import injury history

`POST /api/injuries/import`

Multipart form-data field: `file`

Accepted columns include:

```text
Athlete ID, Injury Date, Injury Type, Severity, Days Out, Body Region, Status, Notes
```

### List injuries

```http
GET /api/injuries
GET /api/injuries?athleteId=ATH-001
```

### Calculate injury risk

```http
GET /api/injury-risk
GET /api/injury-risk/ATH-001
```

Example response:

```json
{
  "athleteId": "ATH-001",
  "riskScore": 82,
  "riskLevel": "High Risk",
  "mainFactors": [
    "ACWR is elevated at 1.67",
    "Recent Hamstring injury history",
    "Top speed dropped 10% versus baseline"
  ],
  "explanation": "The athlete shows ACWR is elevated at 1.67, Recent Hamstring injury history, Top speed dropped 10% versus baseline. This combination increases injury susceptibility and should be reviewed by the performance staff.",
  "recommendation": "Reduce high-speed exposure, review recovery markers and consider individual load management for the next 72 hours."
}
```

### Performance alerts

```http
GET /api/alerts
GET /api/alerts/performance
POST /api/alerts/recalculate
```

### Dashboard additions

`GET /api/dashboard` now also returns:

- `riskAnalysis`
- `readinessAnalysis`
- `workloadMetrics`
- `weeklyLoad`
- existing dashboard nodes remain backward compatible

## Algorithm notes

### Injury risk

The initial version is intentionally interpretable. It does not pretend to be a medical diagnosis or black-box neural model. It scores risk using:

- ACWR and workload deviation;
- monotony and strain;
- top-speed decline;
- sprint-distance spike;
- recent injury history;
- recurrent injury by body region;
- fatigue/readiness score.

### Performance drop

The alert engine compares:

- current session vs last 3 sessions;
- current session vs last 7 sessions;
- current session vs individual baseline;
- multiple metrics including top speed, sprint distance, high-intensity distance, accelerations, total volume, workload and session load.

### Readiness/fatigue

Readiness is calculated as `100 - fatigueScore`, where fatigue is increased by ACWR elevation, high monotony, high strain, top-speed decline and workload deviation.

## Pending recommended next steps

- Add a dedicated frontend Injury Risk page.
- Add radar chart by athlete vs position benchmark.
- Add scheduled recalculation job after each import.
- Add unit tests for the analytics services.
- Add authentication/authorization before SaaS production use.
- Replace the current optional local AI classification dependency with an internal deterministic fallback or hosted model.
