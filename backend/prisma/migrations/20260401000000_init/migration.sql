CREATE TYPE "AthleteProfile" AS ENUM (
  'explosive',
  'endurance',
  'lowIntensity',
  'highImpactLoad',
  'balanced'
);
CREATE TYPE "AlertSeverity" AS ENUM ('low','medium','high');
CREATE TABLE "Athlete" (
  "id" TEXT NOT NULL,
  "position" TEXT,
  "groups" TEXT,
  "profile" "AthleteProfile" NOT NULL DEFAULT 'balanced',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Athlete_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Performance" (
  "id" SERIAL NOT NULL,
  "athleteId" TEXT NOT NULL,
  "startDate" TIMESTAMP(3) NOT NULL,
  "startTime" TEXT,
  "startTimeSeconds" DOUBLE PRECISION,
  "endTimeSeconds" DOUBLE PRECISION,
  "weekStartDate" TIMESTAMP(3),
  "monthStartDate" TIMESTAMP(3),
  "segmentName" TEXT,
  "durationMins" DOUBLE PRECISION,
  "sessionLoad" DOUBLE PRECISION,
  "workload" DOUBLE PRECISION,
  "workloadVolume" DOUBLE PRECISION,
  "workloadIntensity" DOUBLE PRECISION,
  "distanceM" DOUBLE PRECISION,
  "metresPerMinute" DOUBLE PRECISION,
  "highIntensityRunningM" DOUBLE PRECISION,
  "highIntensityEvents" DOUBLE PRECISION,
  "sprintDistanceM" DOUBLE PRECISION,
  "rawTopSpeedKph" DOUBLE PRECISION,
  "noOfSprints" DOUBLE PRECISION,
  "topSpeedKph" DOUBLE PRECISION,
  "avgSpeedKph" DOUBLE PRECISION,
  "accelerations" DOUBLE PRECISION,
  "decelerations" DOUBLE PRECISION,
  "percentageMaxSpeed" DOUBLE PRECISION,
  "percentageRawMaxSpeedKph" DOUBLE PRECISION,
  "maxSpeed90Events" DOUBLE PRECISION,
  "maxSpeed90DistanceM" DOUBLE PRECISION,
  "maxSpeed90DurationSecs" DOUBLE PRECISION,
  "rawMaxSpeed90Events" DOUBLE PRECISION,
  "rawMaxSpeed90DistanceM" DOUBLE PRECISION,
  "rawMaxSpeed90DurationSecs" DOUBLE PRECISION,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Performance_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Alert" (
  "id" SERIAL NOT NULL,
  "athleteId" TEXT NOT NULL,
  "metric" TEXT NOT NULL,
  "severity" "AlertSeverity" NOT NULL,
  "dropPercent" DOUBLE PRECISION NOT NULL,
  "historical" DOUBLE PRECISION NOT NULL,
  "recent" DOUBLE PRECISION NOT NULL,
  "message" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Athlete_position_idx" ON "Athlete"("position");
CREATE INDEX "Athlete_groups_idx" ON "Athlete"("groups");
CREATE INDEX "Performance_athleteId_idx" ON "Performance"("athleteId");
CREATE INDEX "Performance_startDate_idx" ON "Performance"("startDate");
CREATE INDEX "Performance_segmentName_idx" ON "Performance"("segmentName");
CREATE INDEX "Alert_athleteId_idx" ON "Alert"("athleteId");
CREATE INDEX "Alert_active_idx" ON "Alert"("active");
CREATE INDEX "Alert_severity_idx" ON "Alert"("severity");
ALTER TABLE "Performance" ADD CONSTRAINT "Performance_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "Athlete"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "Athlete"("id") ON DELETE CASCADE ON UPDATE CASCADE;
