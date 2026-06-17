import { Performance } from '@prisma/client';
import { avg, clamp } from './metricUtils.js';
import { WorkloadAnalyticsService } from './WorkloadAnalyticsService.js';

export class ReadinessService {
  static calculate(performances: Performance[]) {
    const snapshots = WorkloadAnalyticsService.buildSnapshots(performances);
    const latest = snapshots.at(-1);
    if (!latest) return { readinessScore: 75, fatigueScore: 25, factors: ['No workload history available'], recommendation: 'Import GPS history to improve readiness confidence.' };

    const recent = performances.slice(-4);
    const previous = performances.slice(Math.max(0, performances.length - 10), Math.max(0, performances.length - 4));
    const topSpeedDrop = avg(previous.map(p => p.topSpeedKph)) > 0 ? ((avg(previous.map(p => p.topSpeedKph)) - avg(recent.map(p => p.topSpeedKph))) / avg(previous.map(p => p.topSpeedKph))) * 100 : 0;

    let fatigueScore = 0;
    const factors: string[] = [];
    if (latest.acwr > 1.5) { fatigueScore += 25; factors.push('ACWR above recommended range'); }
    if (latest.monotony > 2) { fatigueScore += 20; factors.push('High workload monotony'); }
    if (latest.strain > 6000) { fatigueScore += 20; factors.push('Elevated weekly strain'); }
    if (topSpeedDrop > 8) { fatigueScore += 15; factors.push('Top speed trending down'); }
    if (latest.workloadDeviation > 25) { fatigueScore += 15; factors.push('Current workload above individual baseline'); }

    fatigueScore = clamp(fatigueScore);
    return {
      readinessScore: clamp(100 - fatigueScore),
      fatigueScore,
      factors: factors.length ? factors : ['Workload and performance markers are stable'],
      recommendation: fatigueScore >= 60 ? 'Reduce high-intensity exposure and prioritize recovery over the next 48-72 hours.' : 'Maintain planned training load and keep monitoring acute changes.',
    };
  }
}
