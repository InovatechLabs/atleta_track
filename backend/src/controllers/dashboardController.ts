import { Request, Response } from 'express';
import { getDashboard, getHomePreviews } from '../services/analyticsService.js';

export async function dashboard(req: Request, res: Response) {
  res.json(await getDashboard(req.query as Record<string, string>));
}

export async function homepreview(req: Request, res: Response) {
  res.json(await getHomePreviews());
}
