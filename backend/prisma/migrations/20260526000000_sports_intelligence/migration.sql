CREATE TABLE IF NOT EXISTS "InjuryHistory" (
  "id" SERIAL PRIMARY KEY,
  "athleteId" TEXT NOT NULL REFERENCES "Athlete"("id") ON DELETE CASCADE,
  "injuryDate" TIMESTAMP(3) NOT NULL,
  "type" TEXT NOT NULL,
  "severity" TEXT NOT NULL,
  "daysOut" INTEGER NOT NULL DEFAULT 0,
  "bodyRegion" TEXT NOT NULL,
  "notes" TEXT,
  "status" TEXT NOT NULL DEFAULT 'Recovered',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "InjuryHistory_athleteId_idx" ON "InjuryHistory"("athleteId");
CREATE INDEX IF NOT EXISTS "InjuryHistory_injuryDate_idx" ON "InjuryHistory"("injuryDate");
CREATE INDEX IF NOT EXISTS "InjuryHistory_bodyRegion_idx" ON "InjuryHistory"("bodyRegion");

CREATE TABLE IF NOT EXISTS "AthleteRiskScore" (
  "id" SERIAL PRIMARY KEY,
  "athleteId" TEXT NOT NULL REFERENCES "Athlete"("id") ON DELETE CASCADE,
  "riskScore" INTEGER NOT NULL,
  "riskLevel" TEXT NOT NULL,
  "mainFactors" TEXT[] NOT NULL,
  "explanation" TEXT NOT NULL,
  "recommendation" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "AthleteRiskScore_athleteId_idx" ON "AthleteRiskScore"("athleteId");
CREATE INDEX IF NOT EXISTS "AthleteRiskScore_riskLevel_idx" ON "AthleteRiskScore"("riskLevel");
CREATE INDEX IF NOT EXISTS "AthleteRiskScore_createdAt_idx" ON "AthleteRiskScore"("createdAt");

CREATE TABLE IF NOT EXISTS "PerformanceAlert" (
  "id" SERIAL PRIMARY KEY,
  "athleteId" TEXT NOT NULL REFERENCES "Athlete"("id") ON DELETE CASCADE,
  "metric" TEXT NOT NULL,
  "severity" TEXT NOT NULL,
  "score" INTEGER NOT NULL,
  "currentValue" DOUBLE PRECISION NOT NULL,
  "baselineValue" DOUBLE PRECISION NOT NULL,
  "dropPercent" DOUBLE PRECISION NOT NULL,
  "explanation" TEXT NOT NULL,
  "recommendation" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "PerformanceAlert_athleteId_idx" ON "PerformanceAlert"("athleteId");
CREATE INDEX IF NOT EXISTS "PerformanceAlert_severity_idx" ON "PerformanceAlert"("severity");
CREATE INDEX IF NOT EXISTS "PerformanceAlert_active_idx" ON "PerformanceAlert"("active");

CREATE TABLE IF NOT EXISTS "ImportLog" (
  "id" SERIAL PRIMARY KEY,
  "fileName" TEXT NOT NULL,
  "fileType" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "importedRows" INTEGER NOT NULL DEFAULT 0,
  "ignoredRows" INTEGER NOT NULL DEFAULT 0,
  "duplicateRows" INTEGER NOT NULL DEFAULT 0,
  "missingColumns" TEXT[] NOT NULL,
  "errors" TEXT[] NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "WorkloadMetric" (
  "id" SERIAL PRIMARY KEY,
  "athleteId" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "acuteLoad" DOUBLE PRECISION NOT NULL,
  "chronicLoad" DOUBLE PRECISION NOT NULL,
  "acwr" DOUBLE PRECISION NOT NULL,
  "monotony" DOUBLE PRECISION NOT NULL,
  "strain" DOUBLE PRECISION NOT NULL,
  "readinessScore" DOUBLE PRECISION,
  "fatigueScore" DOUBLE PRECISION,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "WorkloadMetric_athleteId_idx" ON "WorkloadMetric"("athleteId");
CREATE INDEX IF NOT EXISTS "WorkloadMetric_date_idx" ON "WorkloadMetric"("date");

CREATE TABLE IF NOT EXISTS "AthleteBaseline" (
  "id" SERIAL PRIMARY KEY,
  "athleteId" TEXT NOT NULL,
  "metric" TEXT NOT NULL,
  "value" DOUBLE PRECISION NOT NULL,
  "windowDays" INTEGER NOT NULL DEFAULT 28,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AthleteBaseline_athleteId_metric_key" UNIQUE ("athleteId", "metric")
);
CREATE INDEX IF NOT EXISTS "AthleteBaseline_athleteId_idx" ON "AthleteBaseline"("athleteId");

CREATE TABLE IF NOT EXISTS "TeamBenchmark" (
  "id" SERIAL PRIMARY KEY,
  "metric" TEXT NOT NULL,
  "value" DOUBLE PRECISION NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "TeamBenchmark_metric_idx" ON "TeamBenchmark"("metric");

CREATE TABLE IF NOT EXISTS "PositionBenchmark" (
  "id" SERIAL PRIMARY KEY,
  "position" TEXT NOT NULL,
  "metric" TEXT NOT NULL,
  "value" DOUBLE PRECISION NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "PositionBenchmark_position_idx" ON "PositionBenchmark"("position");
CREATE INDEX IF NOT EXISTS "PositionBenchmark_metric_idx" ON "PositionBenchmark"("metric");
