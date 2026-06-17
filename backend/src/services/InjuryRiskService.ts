import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { AppError } from '../middlewares/errorHandler.js';
import { clamp, classifyRisk, pctChange } from './metricUtils.js';
import { WorkloadAnalyticsService } from './WorkloadAnalyticsService.js';
import { ReadinessService } from './ReadinessService.js';

export const injurySchema = z.object({
  athleteId: z.string().min(1),
  injuryDate: z.coerce.date(),
  type: z.string().min(1),
  severity: z.string().min(1),
  bodyRegion: z.string().min(1),
  daysOut: z.coerce.number().int().min(0).optional().default(0),
  status: z.string().optional().default('Recovered'),
  notes: z.string().optional().nullable(),
});

export class InjuryRiskService {
  static async createInjury(input: unknown) {
    const data = injurySchema.parse(input);
    await prisma.athlete.upsert({ where: { id: data.athleteId }, update: {}, create: { id: data.athleteId } });
    return (prisma as any).injuryHistory.create({ data });
  }

  static async listInjuries(athleteId?: string) {
    return (prisma as any).injuryHistory.findMany({ where: athleteId ? { athleteId } : undefined, orderBy: { injuryDate: 'desc' } });
  }

  static async calculateForAthlete(athleteId: string) {
    const athlete = await prisma.athlete.findUnique({ where: { id: athleteId }, include: { performances: { orderBy: { startDate: 'asc' } } } });
    if (!athlete) throw new AppError(404, 'Athlete not found.');

    const injuries = await (prisma as any).injuryHistory.findMany({ where: { athleteId }, orderBy: { injuryDate: 'desc' } });
    const snapshots = WorkloadAnalyticsService.buildSnapshots(athlete.performances);
    const latest = snapshots.at(-1);
    const readiness = ReadinessService.calculate(athlete.performances);
    const recent = athlete.performances.slice(-3);
    const baseline = athlete.performances.slice(Math.max(0, athlete.performances.length - 12), Math.max(0, athlete.performances.length - 3));

    let score = 10;
    const mainFactors: string[] = [];

    if (latest) {
      if (latest.acwr > 1.5) { score += 25; mainFactors.push(`ACWR is elevated at ${latest.acwr.toFixed(2)}`); }
      else if (latest.acwr >= 1.25) { score += 12; mainFactors.push(`ACWR is approaching the upper safe zone at ${latest.acwr.toFixed(2)}`); }
      if (latest.monotony > 2) { score += 14; mainFactors.push('High monotony indicates limited load variation'); }
      if (latest.strain > 6000) { score += 14; mainFactors.push('Weekly strain is elevated'); }
      if (latest.workloadDeviation > 30) { score += 16; mainFactors.push(`Workload is ${latest.workloadDeviation.toFixed(0)}% above baseline`); }
    }

    const recentTop = recent.reduce((a, p) => a + (p.topSpeedKph ?? 0), 0) / (recent.length || 1);
    const baseTop = baseline.reduce((a, p) => a + (p.topSpeedKph ?? 0), 0) / (baseline.length || 1);
    const speedChange = pctChange(recentTop, baseTop);
    if (speedChange < -8) { score += 12; mainFactors.push(`Top speed dropped ${Math.abs(speedChange).toFixed(0)}% versus baseline`); }

    const recentSprint = recent.reduce((a, p) => a + (p.sprintDistanceM ?? 0), 0) / (recent.length || 1);
    const baseSprint = baseline.reduce((a, p) => a + (p.sprintDistanceM ?? 0), 0) / (baseline.length || 1);
    const sprintChange = pctChange(recentSprint, baseSprint);
    if (sprintChange > 30) { score += 12; mainFactors.push(`Sprint distance increased ${sprintChange.toFixed(0)}% versus baseline`); }

    const now = new Date();
    const recentInjury = injuries.find((inj: any) => (now.getTime() - new Date(inj.injuryDate).getTime()) / 86400000 <= 60);
    if (recentInjury) { score += 20; mainFactors.push(`Recent ${recentInjury.bodyRegion} injury history`); }
    const recurrentRegion = injuries.length ? injuries.filter((inj: any) => inj.bodyRegion === injuries[0].bodyRegion).length : 0;
    if (recurrentRegion >= 2) { score += 10; mainFactors.push(`Recurrent injury pattern in ${injuries[0].bodyRegion}`); }
    if (readiness.fatigueScore > 60) { score += 10; mainFactors.push('Fatigue score is high'); }

    score = clamp(score);
    const riskLevel = classifyRisk(score);
    const explanation = mainFactors.length
      ? `The athlete shows ${mainFactors.slice(0, 3).join(', ')}. This combination increases injury susceptibility and should be reviewed by the performance staff.`
      : 'The athlete does not show major workload, fatigue or injury-history risk signals in the available data.';
    const recommendation = score >= 70
      ? 'Reduce high-speed exposure, review recovery markers and consider individual load management for the next 72 hours.'
      : score >= 45
      ? 'Monitor acute workload and recovery response before increasing training intensity.'
      : 'Maintain the planned workload and continue routine monitoring.';

    const payload = { athleteId, riskScore: Math.round(score), riskLevel, mainFactors, explanation, recommendation, readinessScore: readiness.readinessScore, fatigueScore: readiness.fatigueScore, latestWorkload: latest };

    await (prisma as any).athleteRiskScore.create({ data: { athleteId, riskScore: payload.riskScore, riskLevel, mainFactors, explanation, recommendation } }).catch(() => null);
    return payload;
  }

  static async calculateAll() {
    const athletes = await prisma.athlete.findMany({ select: { id: true } });
    return Promise.all(athletes.map(a => this.calculateForAthlete(a.id)));
  }
}
