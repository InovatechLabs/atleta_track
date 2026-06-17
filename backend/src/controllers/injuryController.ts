import { Request, Response } from 'express';
import fs from 'node:fs';
import csv from 'csv-parser';
import * as XLSX from 'xlsx';
import { InjuryRiskService } from '../services/InjuryRiskService.js';
import { AppError } from '../middlewares/errorHandler.js';
import { normalizeKey } from '../utils/parse.js';

export async function createInjury(req: Request, res: Response) {
  const injury = await InjuryRiskService.createInjury(req.body);
  res.status(201).json(injury);
}

export async function listInjuries(req: Request, res: Response) {
  const athleteId = typeof req.query.athleteId === 'string' ? req.query.athleteId : undefined;
  res.json(await InjuryRiskService.listInjuries(athleteId));
}

export async function calculateInjuryRisk(req: Request, res: Response) {
  const athleteId = String(req.params.athleteId ?? '');
  if (!athleteId) throw new AppError(400, 'Athlete ID is required.');
  res.json(await InjuryRiskService.calculateForAthlete(athleteId));
}

export async function calculateTeamRisk(_req: Request, res: Response) {
  res.json(await InjuryRiskService.calculateAll());
}


async function readCsvRows(path: string): Promise<Record<string, unknown>[]> {
  return new Promise((resolve, reject) => {
    const rows: Record<string, unknown>[] = [];
    fs.createReadStream(path).pipe(csv()).on('data', row => rows.push(row)).on('end', () => resolve(rows)).on('error', reject);
  });
}

function readXlsxRows(path: string): Record<string, unknown>[] {
  const workbook = XLSX.read(fs.readFileSync(path), { cellDates: true, type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { defval: null });
}

function normalizeInjuryRow(row: Record<string, unknown>) {
  const map = new Map(Object.entries(row).map(([k, v]) => [normalizeKey(k), v]));
  const pick = (...names: string[]) => names.map(n => map.get(normalizeKey(n))).find(v => v !== undefined && v !== null && v !== '');
  return {
    athleteId: pick('athleteId', 'Athlete ID', 'Player ID'),
    injuryDate: pick('injuryDate', 'Injury Date', 'Date'),
    type: pick('type', 'Injury Type'),
    severity: pick('severity', 'Severity'),
    daysOut: pick('daysOut', 'Days Out', 'Time Lost'),
    bodyRegion: pick('bodyRegion', 'Body Region', 'Region'),
    notes: pick('notes', 'Observations', 'Notes'),
    status: pick('status', 'Status'),
  };
}

export async function importInjuries(req: Request, res: Response) {
  if (!req.file) throw new AppError(400, 'Upload .csv, .xlsx or .xls in the file field.');
  const ext = req.file.originalname.split('.').pop()?.toLowerCase();
  const rows = ext === 'csv' ? await readCsvRows(req.file.path) : readXlsxRows(req.file.path);
  const created = [];
  const errors: string[] = [];
  for (const [index, row] of rows.entries()) {
    try {
      created.push(await InjuryRiskService.createInjury(normalizeInjuryRow(row)));
    } catch (error) {
      errors.push(`Row ${index + 2}: invalid injury record`);
    }
  }
  res.status(201).json({ importedRows: created.length, ignoredRows: rows.length - created.length, errors });
}
