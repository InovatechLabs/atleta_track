import { Request, Response } from 'express';
import { prisma } from '../utils/prisma.js';
import { PerformanceDropService } from '../services/PerformanceDropService.js';

export async function listAlerts(_req: Request, res: Response) {
  const alerts = await prisma.alert.findMany({ where: { active: true }, include: { athlete: true }, orderBy: { createdAt: 'desc' } });
  res.json(alerts);
}

export async function listPerformanceAlerts(_req: Request, res: Response) {
  res.json(await PerformanceDropService.list());
}

export async function refreshAlerts(_req: Request, res: Response) {
  const alerts = await PerformanceDropService.recalculate();
  res.json({ message: 'Performance alerts recalculated successfully.', createdAlerts: alerts.length });
}
