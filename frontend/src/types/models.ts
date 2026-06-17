export type Athlete = {
  id: string;
  position?: string;
  groups?: string;
  profile: string;
};

export type Alert = {
  id: number;
  athleteId: string;
  metric: string;
  severity: string;
  dropPercent: number;
  historical: number;
  recent: number;
  message: string;
  createdAt: string;
};

export type Dashboard = {
  summary: {
    totalAthletes: number;
    totalSessions: number;
    avgDistance: number;
    avgSessionLoad: number;
    avgTopSpeed: number;
    activeAlerts: number;
  };
  workloadEvolution: Array<{ date: string; workload: number; distance: number }>;
  rankingByWorkload: Array<any>;
  rankingByIntensity: Array<any>;
  distanceByAthlete: Array<{ athleteId: string; value: number }>;
  sprintByAthlete: Array<{ athleteId: string; value: number }>;
  topSpeedByAthlete: Array<{ athleteId: string; value: number }>;
  profileDistribution: Array<{ profile: string; total: number }>;
  alerts: Alert[];
};

// Extended types for new API nodes (backward compatible)
type FatigueItem = {
  athleteId: string;
  dropPercent: number;
  firstHalfHIR: number;
  secondHalfHIR: number;
};

type RadarItem = {
  subject: string;
  fullMark: number;
  balanced: number;
  explosive: number;
  highImpactLoad: number;
  endurance: number;
  lowIntensity: number;
};

type RiskItem = {
  athleteId: string;
  workload?: number;
  decelerations?: number;
  riskScore?: number;
  riskLevel?: string;
  mainFactors?: string[];
  explanation?: string;
  recommendation?: string;
};

type ReadinessItem = { athleteId: string; readinessScore: number; fatigueScore: number; factors: string[]; recommendation: string };
type WorkloadMetric = { athleteId: string; date: string; acuteLoad: number; chronicLoad: number; acwr: number; monotony: number; strain: number; readinessScore?: number; fatigueScore?: number };

export type ExtendedDashboard = Dashboard & {
  fatigueAnalysis?: FatigueItem[];
  radarData?: RadarItem[];
  riskAnalysis?: RiskItem[];
  readinessAnalysis?: ReadinessItem[];
  workloadMetrics?: WorkloadMetric[];
  weeklyLoad?: Array<{ week: string; load: number; avgLoad: number }>;
};

export type AthleteDetails = { athlete: { id: string; position?: string; group?: string; profile: string }; averages: Record<string, number>; evolution: Array<any>; alerts: Alert[]; injuries?: Array<any>; riskScores?: Array<any>; workloadMetrics?: WorkloadMetric[]; readiness?: ReadinessItem };
