import { Performance } from '@prisma/client';
import { avg, clamp, dateKey, ewma, sessionLoadValue, startOfWeekUtc, stdDev, sum } from './metricUtils.js';

export type WorkloadSnapshot = {
  athleteId: string;
  date: string;
  acuteLoad: number;
  chronicLoad: number;
  acwr: number;
  monotony: number;
  strain: number;
  rolling3: number;
  rolling7: number;
  ewma: number;
  sprintLoad: number;
  accelerationLoad: number;
  decelerationLoad: number;
  highIntensityDistance: number;
  playerLoad: number;
  workloadDeviation: number;
};

export class WorkloadAnalyticsService {
  static buildSnapshots(performances: Performance[]): WorkloadSnapshot[] {
    const ordered = [...performances].sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
    const loads = ordered.map(sessionLoadValue);
    const ewmaValues = ewma(loads);

    return ordered.map((p, index) => {
      const currentDate = p.startDate;
      const acuteStart = new Date(currentDate); acuteStart.setUTCDate(acuteStart.getUTCDate() - 6);
      const chronicStart = new Date(currentDate); chronicStart.setUTCDate(chronicStart.getUTCDate() - 27);
      const acuteSessions = ordered.filter(x => x.startDate >= acuteStart && x.startDate <= currentDate);
      const chronicSessions = ordered.filter(x => x.startDate >= chronicStart && x.startDate <= currentDate);
      const acuteLoad = sum(acuteSessions.map(sessionLoadValue));
      const chronicLoad = sum(chronicSessions.map(sessionLoadValue)) / 4;
      const recentLoads = loads.slice(Math.max(0, index - 6), index + 1);
      const dailyMean = avg(recentLoads);
      const dailySd = stdDev(recentLoads);
      const monotony = dailySd > 0 ? dailyMean / dailySd : dailyMean > 0 ? 2.5 : 0;
      const strain = acuteLoad * monotony;
      const baseline28 = avg(loads.slice(Math.max(0, index - 27), index + 1));
      const current = sessionLoadValue(p);

      return {
        athleteId: p.athleteId,
        date: dateKey(currentDate),
        acuteLoad,
        chronicLoad,
        acwr: chronicLoad > 0 ? acuteLoad / chronicLoad : 0,
        monotony,
        strain,
        rolling3: avg(loads.slice(Math.max(0, index - 2), index + 1)),
        rolling7: avg(loads.slice(Math.max(0, index - 6), index + 1)),
        ewma: ewmaValues[index] ?? current,
        sprintLoad: (p.sprintDistanceM ?? 0) + (p.noOfSprints ?? 0) * 8,
        accelerationLoad: (p.accelerations ?? 0) * 2,
        decelerationLoad: (p.decelerations ?? 0) * 2.2,
        highIntensityDistance: p.highIntensityRunningM ?? 0,
        playerLoad: clamp(current / 10, 0, 100),
        workloadDeviation: baseline28 > 0 ? ((current - baseline28) / baseline28) * 100 : 0,
      };
    });
  }

  static weeklyLoad(performances: Performance[]) {
    const map = new Map<string, number[]>();
    for (const p of performances) {
      const week = dateKey(startOfWeekUtc(p.startDate));
      if (!map.has(week)) map.set(week, []);
      map.get(week)!.push(sessionLoadValue(p));
    }
    return [...map.entries()].map(([week, values]) => ({ week, load: sum(values), avgLoad: avg(values) })).sort((a, b) => a.week.localeCompare(b.week));
  }
}
