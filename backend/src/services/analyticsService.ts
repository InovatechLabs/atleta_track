import { AthleteProfile, AlertSeverity, Performance } from '@prisma/client';
import { prisma } from '../utils/prisma.js';
import { buildPerformanceWhere, QueryFilters } from '../utils/filters.js';
import { WorkloadAnalyticsService } from './WorkloadAnalyticsService.js';
import { ReadinessService } from './ReadinessService.js';
import { InjuryRiskService } from './InjuryRiskService.js';

type PerfMetric = keyof Pick<
  Performance,
  | 'distanceM'
  | 'sessionLoad'
  | 'sprintDistanceM'
  | 'topSpeedKph'
  | 'avgSpeedKph'
  | 'accelerations'
  | 'decelerations'
  | 'workload'
  | 'workloadIntensity'
  | 'metresPerMinute'
  | 'highIntensityRunningM'
  | 'noOfSprints'
>;

const avg = (values: Array<number | null | undefined>): number => {
  const valid = values.filter(
    (v): v is number => typeof v === 'number' && Number.isFinite(v)
  );

  return valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : 0;
};

async function groupedAverages(filters: QueryFilters) {
  const performances = await prisma.performance.findMany({
    where: buildPerformanceWhere(filters),
    include: {
      athlete: true,
    },
    orderBy: {
      startDate: 'asc',
    },
  });

  return performances;
}

type PerformanceWithAthlete = Awaited<ReturnType<typeof groupedAverages>>[number];

export async function classifyAthletes() {
  const athletes = await prisma.athlete.findMany({
    include: {
      performances: true,
    },
  });

  for (const athlete of athletes) {
   const p = athlete.performances.filter(perf => perf.segmentName === 'Whole Session');
    
    if (!p.length) continue;

    const validTopSpeeds = p.map((x) => x.topSpeedKph).filter((v) => v != null);
    const maxTopSpeed = validTopSpeeds.length > 0 ? Math.max(...validTopSpeeds) : 0;

    const metrics = {
      distance: avg(p.map((x) => x.distanceM)),
      workload: avg(p.map((x) => x.workload)),
      highIntensityEvents: avg(p.map((x) => x.highIntensityEvents)), 
      highIntensityRunning: avg(p.map((x) => x.highIntensityRunningM)), 
      sprintDistance: avg(p.map((x) => x.sprintDistanceM)),
      topSpeed: maxTopSpeed,
      accelerations: avg(p.map((x) => x.accelerations)),
      decelerations: avg(p.map((x) => x.decelerations)),
      sprints: avg(p.map((x) => x.noOfSprints)),
    };

    let profileName: AthleteProfile = 'balanced'; 

    try {
      const response = await fetch('http://127.0.0.1:8000/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          distance_m: metrics.distance,
          workload: metrics.workload,
          high_intensity_running_m: metrics.highIntensityRunning || 0,
          sprint_distance_m: metrics.sprintDistance,
          top_speed_kph: metrics.topSpeed,
          accelerations: metrics.accelerations,
          decelerations: metrics.decelerations,
          no_of_sprints: metrics.sprints,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const profileMapNode: Record<string, AthleteProfile> = {
          "Low Intensity": "lowIntensity",
          "Balanced": "balanced",
          "Explosive": "explosive",
          "High Endurance": "endurance",
          "High Impact Load": "highImpactLoad" 
        };

        profileName = profileMapNode[data.profile] || 'balanced';
      } else {
        console.error(`Erro da IA para o atleta ${athlete.id}: Status ${response.status}`);
      }
    } catch (error) {
      console.error(`Falha ao conectar com a IA local: ${error}`);
    }
    await prisma.athlete.update({
      where: {
        id: athlete.id,
      },
      data: {
        profile: profileName,
      },
    });
  }
  
  console.log("Classificação por IA concluída!");
}

export async function detectDrops() {
  await prisma.alert.updateMany({
    where: {
      active: true,
    },
    data: {
      active: false,
    },
  });

  const athletes = await prisma.athlete.findMany({
    include: {
      performances: {
        orderBy: {
          startDate: 'asc',
        },
      },
    },
  });

  const metrics: Array<{ field: PerfMetric; label: string }> = [
    { field: 'distanceM', label: 'Distance' },
    { field: 'sessionLoad', label: 'Session Load' },
    { field: 'sprintDistanceM', label: 'Sprint Distance' },
    { field: 'topSpeedKph', label: 'Top Speed' },
    { field: 'avgSpeedKph', label: 'Average Speed' },
    { field: 'accelerations', label: 'Accelerations' },
    { field: 'decelerations', label: 'Decelerations' },
  ];

  for (const athlete of athletes) {
    const p = athlete.performances;

    if (p.length < 4) continue;

    const recent = p.slice(-1);
    const history = p.slice(0, -1);

    for (const metric of metrics) {
      const historical = avg(
        history.map((x) => x[metric.field] as number | null)
      );

      const recentAvg = avg(
        recent.map((x) => x[metric.field] as number | null)
      );

      if (historical <= 0 || recentAvg <= 0) continue;

      const dropPercent = ((historical - recentAvg) / historical) * 100;

      if (dropPercent >= 15) {
        const severity: AlertSeverity =
          dropPercent >= 30 ? 'high' : dropPercent >= 20 ? 'medium' : 'low';

        await prisma.alert.create({
          data: {
            athleteId: athlete.id,
            metric: metric.label,
            severity,
            dropPercent,
            historical,
            recent: recentAvg,
            message: `Athlete ${athlete.id} experienced a drop of ${dropPercent.toFixed(
              1
            )}% in ${metric.label}.`,
          },
        });
      }
    }
  }
}

export async function getDashboard(filters: QueryFilters) {
  const performances = await groupedAverages(filters);
  const athleteIds = new Set(performances.map((p) => p.athleteId));
  const activeAlerts = await prisma.alert.count({ where: { active: true } });

  const byDate = new Map<string, { workload: number[]; distance: number[] }>();
  const byAthlete = new Map<string, PerformanceWithAthlete[]>();


  const firstHalfMap = new Map<string, number[]>(); 
  const secondHalfMap = new Map<string, number[]>();

  for (const p of performances) {
    const key = p.startDate.toISOString().slice(0, 10);

    if (!byDate.has(key)) byDate.set(key, { workload: [], distance: [] });
    byDate.get(key)!.workload.push(p.workload ?? 0);
    byDate.get(key)!.distance.push(p.distanceM ?? 0);

    if (!byAthlete.has(p.athleteId)) byAthlete.set(p.athleteId, []);
    byAthlete.get(p.athleteId)!.push(p);

    const segment = (p as any).segmentName; 
    if (segment === 'First Half') {
      if (!firstHalfMap.has(p.athleteId)) firstHalfMap.set(p.athleteId, []);
      firstHalfMap.get(p.athleteId)!.push(p.highIntensityRunningM ?? 0);
    } else if (segment === 'Second Half') {
      if (!secondHalfMap.has(p.athleteId)) secondHalfMap.set(p.athleteId, []);
      secondHalfMap.get(p.athleteId)!.push(p.highIntensityRunningM ?? 0);
    }
  }

  const athleteRanking = [...byAthlete.entries()]
    .map(([athleteId, items]) => {
      const first = items[0];
      return {
        athleteId,
        position: first?.athlete?.position ?? null,
        group: first?.athlete?.groups ?? null,
        profile: first?.athlete?.profile ?? 'balanced',
        avgDistance: avg(items.map((x) => x.distanceM)),
        avgSessionLoad: avg(items.map((x) => x.sessionLoad)),
        avgWorkload: avg(items.map((x) => x.workload)),
        avgIntensity: avg(items.map((x) => x.workloadIntensity)),
        avgSprintDistance: avg(items.map((x) => x.sprintDistanceM)),
        avgTopSpeed: avg(items.map((x) => x.topSpeedKph)),
        avgSprints: avg(items.map((x) => x.noOfSprints)),
        avgDecelerations: avg(items.map((x) => x.decelerations)),
        avgHighIntensity: avg(items.map((x) => x.highIntensityRunningM)), 
      };
    })
    .sort((a, b) => b.avgWorkload - a.avgWorkload);

  const riskAnalysis = athleteRanking.map(a => ({
    athleteId: a.athleteId,
    profile: a.profile,
    workload: a.avgWorkload,
    decelerations: a.avgDecelerations,
    riskScore: (a.avgWorkload * 0.6) + (a.avgDecelerations * 0.4) 
  }));

  // Card "Critical Alert: Drop in Performance" — SOMENTE Isolation Forest.
  // Os alertas ativos sao recriados pelo PerformanceDropService (modelo) a cada
  // import/recalculo, entao representam exclusivamente a saida do Isolation Forest.
  const modelDropAlerts = await prisma.alert.findMany({
    where: { active: true },
    orderBy: { dropPercent: 'desc' },
    take: 5,
  });
  const fatigueAnalysis = modelDropAlerts.map(a => ({
    athleteId: a.athleteId,
    metric: a.metric,
    baseline: a.historical,   // media historica do atleta (base do modelo)
    current: a.recent,        // valor da sessao atual avaliada
    dropPercent: a.dropPercent,
    severity: a.severity,
  }));


 const radarMap = {
    'Top Speed': { subject: 'Top Speed', fullMark: 35, explosive: 0, endurance: 0, lowIntensity: 0, highImpactLoad: 0, balanced: 0 },
    'Sprints': { subject: 'Sprints', fullMark: 20, explosive: 0, endurance: 0, lowIntensity: 0, highImpactLoad: 0, balanced: 0 },
    'HIR': { subject: 'HIR', fullMark: 1000, explosive: 0, endurance: 0, lowIntensity: 0, highImpactLoad: 0, balanced: 0 },
    'Workload': { subject: 'Workload', fullMark: 1000, explosive: 0, endurance: 0, lowIntensity: 0, highImpactLoad: 0, balanced: 0 },
    'Accelerations': { subject: 'Accelerations', fullMark: 60, explosive: 0, endurance: 0, lowIntensity: 0, highImpactLoad: 0, balanced: 0 }
  };

  const profileCountsRadar: Record<string, number> = {};

  athleteRanking.forEach(a => {
    const p = a.profile;
    profileCountsRadar[p] = (profileCountsRadar[p] || 0) + 1;
    
    radarMap['Top Speed'][p] += a.avgTopSpeed;
    radarMap['Sprints'][p] += a.avgSprints;
    radarMap['HIR'][p] += a.avgHighIntensity;
    radarMap['Workload'][p] += a.avgWorkload;
    radarMap['Accelerations'][p] += a.avgDecelerations; 
  });

  const radarData = Object.values(radarMap).map(metric => {
    Object.keys(profileCountsRadar).forEach(prof => {
      if (profileCountsRadar[prof] > 0) {
        (metric as any)[prof] = Number(((metric as any)[prof] / profileCountsRadar[prof]).toFixed(1));
      }
    });
    return metric;
  });

  const profileDistribution = await prisma.athlete.groupBy({ by: ['profile'], _count: { profile: true } });
  const alerts = await prisma.alert.findMany({ where: { active: true }, include: { athlete: true }, orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }], take: 10 });
  const workloadSnapshots = [...byAthlete.entries()].flatMap(([, items]) => WorkloadAnalyticsService.buildSnapshots(items));
  const latestReadiness = [...byAthlete.entries()].map(([athleteId, items]) => ({ athleteId, ...ReadinessService.calculate(items) }));
  const weeklyLoad = WorkloadAnalyticsService.weeklyLoad(performances);
  const riskScores = await Promise.all([...athleteIds].slice(0, 25).map(id => InjuryRiskService.calculateForAthlete(id).catch(() => null)));

  return {
    summary: {
      totalAthletes: athleteIds.size,
      totalSessions: performances.length,
      avgDistance: avg(performances.map((p) => p.distanceM)),
      avgSessionLoad: avg(performances.map((p) => p.sessionLoad)),
      avgTopSpeed: avg(performances.map((p) => p.topSpeedKph)),
      activeAlerts,
    },
    workloadEvolution: [...byDate.entries()].map(([date, values]) => ({ date, workload: avg(values.workload), distance: avg(values.distance) })),
    rankingByWorkload: athleteRanking.slice(0, 10),
    rankingByIntensity: [...athleteRanking].sort((a, b) => b.avgIntensity - a.avgIntensity).slice(0, 10),
    distanceByAthlete: athleteRanking.slice(0, 12).map((a) => ({ athleteId: a.athleteId, value: a.avgDistance })),
    sprintByAthlete: athleteRanking.slice(0, 12).map((a) => ({ athleteId: a.athleteId, value: a.avgSprintDistance })),
    topSpeedByAthlete: athleteRanking.slice(0, 12).map((a) => ({ athleteId: a.athleteId, value: a.avgTopSpeed })),
    profileDistribution: profileDistribution.map((p) => ({ profile: p.profile, total: p._count.profile })),
    alerts,
  
    riskAnalysis: riskScores.filter(Boolean).length ? riskScores.filter(Boolean) : riskAnalysis,
    readinessAnalysis: latestReadiness,
    workloadMetrics: workloadSnapshots.slice(-120),
    weeklyLoad,
    fatigueAnalysis,
    radarData
  };
}

export async function getAthleteDetails(athleteId: string) {
  const athlete = await prisma.athlete.findUnique({
    where: {
      id: athleteId,
    },
    include: {
      performances: {
        orderBy: {
          startDate: 'asc',
        },
      },
      alerts: {
        where: { active: true },
        orderBy: { createdAt: 'desc' },
      },
      injuries: { orderBy: { injuryDate: 'desc' }, take: 10 },
      riskScores: { orderBy: { createdAt: 'desc' }, take: 5 },
    },
  });

  if (!athlete) return null;

  const p = athlete.performances;

  return {
    athlete: {
      id: athlete.id,
      position: athlete.position,
      group: athlete.groups,
      profile: athlete.profile,
    },

    averages: {
      distance: avg(p.map((x) => x.distanceM)),
      sessionLoad: avg(p.map((x) => x.sessionLoad)),
      workload: avg(p.map((x) => x.workload)),
      sprintDistance: avg(p.map((x) => x.sprintDistanceM)),
      topSpeed: avg(p.map((x) => x.topSpeedKph)),
      avgSpeed: avg(p.map((x) => x.avgSpeedKph)),
      accelerations: avg(p.map((x) => x.accelerations)),
      decelerations: avg(p.map((x) => x.decelerations)),
    },

    evolution: p.map((x) => ({
      date: x.startDate.toISOString().slice(0, 10),
      distance: x.distanceM,
      workload: x.workload,
      topSpeed: x.topSpeedKph,
      avgSpeed: x.avgSpeedKph,
      accelerations: x.accelerations,
      decelerations: x.decelerations,
    })),

    alerts: athlete.alerts,
    injuries: (athlete as any).injuries ?? [],
    riskScores: (athlete as any).riskScores ?? [],
    workloadMetrics: WorkloadAnalyticsService.buildSnapshots(p),
    readiness: ReadinessService.calculate(p),
  };
}

export async function compareAthletes(ids: string[]) {
  const athletes = await prisma.athlete.findMany({
    where: {
      id: {
        in: ids,
      },
    },
    include: {
      performances: true,
    },
  });

  return athletes.map((a) => ({
    athleteId: a.id,
    position: a.position,
    group: a.groups,
    profile: a.profile,
    distance: avg(a.performances.map((x) => x.distanceM)),
    sprintDistance: avg(a.performances.map((x) => x.sprintDistanceM)),
    workload: avg(a.performances.map((x) => x.workload)),
    workloadIntensity: avg(a.performances.map((x) => x.workloadIntensity)),
    topSpeed: avg(a.performances.map((x) => x.topSpeedKph)),
    avgSpeed: avg(a.performances.map((x) => x.avgSpeedKph)),
    accelerations: avg(a.performances.map((x) => x.accelerations)),
    decelerations: avg(a.performances.map((x) => x.decelerations)),
    highIntensityRunning: avg(a.performances.map((x) => x.highIntensityRunningM)),
    sprints: avg(a.performances.map((x) => x.noOfSprints)),
  }));
}

export async function getHomePreviews() {

  const profileCounts = await prisma.athlete.groupBy({
    by: ['profile'],
    _count: { profile: true },
  });

  const recentPerformances = await prisma.performance.findMany({
    take: 50,
    orderBy: { startDate: 'desc' },
    select: { topSpeedKph: true, distanceM: true }
  });
  
  const avgSpeed = recentPerformances.reduce((acc, curr) => acc + (curr.topSpeedKph ?? 0), 0) / (recentPerformances.length || 1);
  const maxSpeed = Math.max(...recentPerformances.map(p => p.topSpeedKph ?? 0));

  const latestAlerts = await prisma.alert.findMany({
    where: { active: true },
    take: 3,
    orderBy: { createdAt: 'desc' },
    select: { severity: true, metric: true, dropPercent: true }
  });

  return {
    profiles: profileCounts.map(p => ({ profile: p.profile, count: p._count.profile })),
    comparison: {
      avgSpeedKph: avgSpeed.toFixed(1),
      maxSpeedKph: maxSpeed.toFixed(1),
    },
    recentAlerts: latestAlerts
  };
}