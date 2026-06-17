import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
  constructor(public statusCode: number, message: string, public details?: unknown) {
    super(message);
  }
}

export function errorHandler(error: Error, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ message: error.message, details: error.details });
  }
  if (error instanceof ZodError) {
    return res.status(400).json({ message: 'Invalid request payload.', details: error.flatten() });
  }
  console.error(error);
  return res.status(500).json({ message: 'Internal server error' });
}
