import { Performance } from '@prisma/client';

export type NumericValue = number | null | undefined;

export const avg = (values: NumericValue[]): number => {
  const valid = values.filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
  return valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : 0;
};

export const sum = (values: NumericValue[]): number => values.reduce<number>((total, value) => total + (typeof value === 'number' && Number.isFinite(value) ? value : 0), 0);

export const clamp = (value: number, min = 0, max = 100): number => Math.min(max, Math.max(min, value));

export const pctChange = (current: number, baseline: number): number => baseline > 0 ? ((current - baseline) / baseline) * 100 : 0;

export const dropPct = (current: number, baseline: number): number => baseline > 0 ? ((baseline - current) / baseline) * 100 : 0;

export const stdDev = (values: number[]): number => {
  const valid = values.filter(Number.isFinite);
  if (valid.length < 2) return 0;
  const mean = avg(valid);
  const variance = avg(valid.map(v => (v - mean) ** 2));
  return Math.sqrt(variance);
};

export const rollingAverage = (values: number[], windowSize: number): number[] => values.map((_, index) => avg(values.slice(Math.max(0, index - windowSize + 1), index + 1)));

export const ewma = (values: number[], alpha = 0.35): number[] => {
  const result: number[] = [];
  values.forEach((value, index) => {
    result[index] = index === 0 ? value : alpha * value + (1 - alpha) * result[index - 1];
  });
  return result;
};

export const sessionLoadValue = (p: Performance): number => p.sessionLoad ?? p.workload ?? ((p.distanceM ?? 0) / 10) + ((p.highIntensityRunningM ?? 0) / 5) + ((p.sprintDistanceM ?? 0) / 3) + ((p.accelerations ?? 0) * 2) + ((p.decelerations ?? 0) * 2);

export const dateKey = (date: Date): string => date.toISOString().slice(0, 10);

export const startOfWeekUtc = (date: Date): Date => {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() - day + 1);
  return d;
};

export function classifyRisk(score: number): 'Low Risk' | 'Moderate Risk' | 'High Risk' | 'Critical Risk' {
  if (score >= 85) return 'Critical Risk';
  if (score >= 70) return 'High Risk';
  if (score >= 45) return 'Moderate Risk';
  return 'Low Risk';
}

export function classifyAlert(score: number): 'Info' | 'Warning' | 'Critical' {
  if (score >= 70) return 'Critical';
  if (score >= 40) return 'Warning';
  return 'Info';
}
