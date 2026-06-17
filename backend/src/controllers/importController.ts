import { Request, Response } from 'express';
import { AppError } from '../middlewares/errorHandler.js';
import { importFile } from '../services/importService.js';

export async function importController(req: Request, res: Response) {
  if (!req.file) throw new AppError(400, 'Envie um arquivo .xlsx ou .csv no campo file.');
  const result = await importFile(req.file);
  return res.status(201).json(result);
}
