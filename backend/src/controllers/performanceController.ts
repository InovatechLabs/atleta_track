import { Request, Response } from 'express';
import { PerformanceRepository } from '../repositories/performanceRepository.js';

export async function listPerformances(req: Request, res: Response) {
  res.json(await PerformanceRepository.list(req.query as Record<string, string>));
}
