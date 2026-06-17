import { Request, Response } from 'express';
import { AthleteRepository } from '../repositories/athleteRepository.js';
import { compareAthletes, getAthleteDetails } from '../services/analyticsService.js';
import { AppError } from '../middlewares/errorHandler.js';

export async function listAthletes(_req: Request, res: Response) {
  res.json(await AthleteRepository.list());
}

export async function athleteDetails(req: Request, res: Response) {
  const idParam = req.params.id;

  if (!idParam) {
    throw new AppError(400, 'ID do atleta não informado.');
  }

  const id = String(idParam);

  const data = await getAthleteDetails(id);

  if (!data) {
    throw new AppError(404, 'Atleta não encontrado.');
  }

  res.json(data);
}

export async function compare(req: Request, res: Response) {
  const rawIds = req.query.ids;

  let ids: string[] = [];

  if (typeof rawIds === 'string') {
    ids = rawIds.split(',').map((v) => v.trim());
  } else if (Array.isArray(rawIds)) {
    ids = rawIds.map((v) => String(v));
  }

  ids = ids.filter((v) => v.length > 0);

  if (ids.length < 2) {
    throw new AppError(400, 'Informe pelo menos dois atletas em ?ids=A,B');
  }

  res.json(await compareAthletes(ids));
}