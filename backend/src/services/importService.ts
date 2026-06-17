import fs from 'node:fs';
import csv from 'csv-parser';
import * as XLSX from 'xlsx';
import { prisma } from '../utils/prisma.js';
import { AppError } from '../middlewares/errorHandler.js';
import { normalizeKey, toDate, toNumber, toText } from '../utils/parse.js';
import { classifyAthletes } from './analyticsService.js';
import { PerformanceDropService } from './PerformanceDropService.js';

const requiredCanonical = ['athleteId', 'startDate'];

const columnAliases: Record<string, string[]> = {
  athleteId: ['Athlete ID', 'Player ID', 'Player', 'Athlete'],
  position: ['Athlete Position', 'Position'],
  groups: ['Athlete Groups', 'Group', 'Team Group'],
  startDate: ['Start Date', 'Date', 'Session Date'],
  startTime: ['Start Time'],
  startTimeSeconds: ['Start Time (s)'],
  endTimeSeconds: ['End Time (s)'],
  weekStartDate: ['Week Start Date'],
  monthStartDate: ['Month Start Date'],
  segmentName: ['Segment Name', 'Period', 'Session Segment'],
  durationMins: ['Duration (mins)', 'Duration', 'Minutes'],
  sessionLoad: ['Session Load', 'Training Load'],
  workload: ['Workload', 'Player Load'],
  workloadVolume: ['Workload Volume'],
  workloadIntensity: ['Workload Intensity', 'Relative Intensity'],
  distanceM: ['Distance (m)', 'Total Distance', 'Distance'],
  metresPerMinute: ['Metres per Minute (m)', 'Meters per Minute', 'm/min'],
  highIntensityRunningM: ['High Intensity Running (m)', 'High Intensity Distance', 'High Speed Running'],
  highIntensityEvents: ['No. of High Intensity Events', 'High Intensity Events'],
  sprintDistanceM: ['Sprint Distance (m)', 'Sprint Distance', 'High Speed Running'],
  rawTopSpeedKph: ['Raw Top Speed (kph)', 'Raw Max Velocity'],
  noOfSprints: ['No. of Sprints', 'Sprints', 'Sprint Count'],
  topSpeedKph: ['Top Speed (kph)', 'Max Velocity', 'Top Speed', 'Peak Speed'],
  avgSpeedKph: ['Avg Speed (kph)', 'Average Speed'],
  accelerations: ['Accelerations', 'Accel Count'],
  decelerations: ['Decelerations', 'Decel Count'],
  percentageMaxSpeed: ['Percentage of Max Speed'],
  percentageRawMaxSpeedKph: ['Percentage of Raw Max Speed KPH'],
  maxSpeed90Events: ['90% of Max Speed Events'],
  maxSpeed90DistanceM: ['90% of Max Speed Distance (m)'],
  maxSpeed90DurationSecs: ['90% of Max Speed Duration (secs)'],
  rawMaxSpeed90Events: ['90% of Raw Max Speed Events'],
  rawMaxSpeed90DistanceM: ['90% of Raw Max Speed Distance (m)'],
  rawMaxSpeed90DurationSecs: ['90% of Raw Max Speed Duration (secs)'],
};

const allExpectedAliases = Object.values(columnAliases).map(v => v[0]);

function makeGetter(row: Record<string, unknown>) {
  const normalized = new Map<string, unknown>();
  Object.entries(row).forEach(([key, value]) => normalized.set(normalizeKey(key), value));
  return (canonical: string) => {
    const aliases = columnAliases[canonical] ?? [canonical];
    for (const alias of aliases) {
      const value = normalized.get(normalizeKey(alias));
      if (value !== undefined && value !== null && value !== '') return value;
    }
    return null;
  };
}

function mapRow(row: Record<string, unknown>) {
  const get = makeGetter(row);
  const athleteId = toText(get('athleteId'));
  const startDate = toDate(get('startDate'));
  if (!athleteId || !startDate) return null;

  return {
    athlete: { id: athleteId, position: toText(get('position')), groups: toText(get('groups')) },
    performance: {
      athleteId,
      startDate,
      startTime: toText(get('startTime')),
      startTimeSeconds: toNumber(get('startTimeSeconds')),
      endTimeSeconds: toNumber(get('endTimeSeconds')),
      weekStartDate: toDate(get('weekStartDate')),
      monthStartDate: toDate(get('monthStartDate')),
      segmentName: toText(get('segmentName')) ?? 'Whole Session',
      durationMins: toNumber(get('durationMins')),
      sessionLoad: toNumber(get('sessionLoad')),
      workload: toNumber(get('workload')),
      workloadVolume: toNumber(get('workloadVolume')),
      workloadIntensity: toNumber(get('workloadIntensity')),
      distanceM: toNumber(get('distanceM')),
      metresPerMinute: toNumber(get('metresPerMinute')),
      highIntensityRunningM: toNumber(get('highIntensityRunningM')),
      highIntensityEvents: toNumber(get('highIntensityEvents')),
      sprintDistanceM: toNumber(get('sprintDistanceM')),
      rawTopSpeedKph: toNumber(get('rawTopSpeedKph')),
      noOfSprints: toNumber(get('noOfSprints')),
      topSpeedKph: toNumber(get('topSpeedKph')),
      avgSpeedKph: toNumber(get('avgSpeedKph')),
      accelerations: toNumber(get('accelerations')),
      decelerations: toNumber(get('decelerations')),
      percentageMaxSpeed: toNumber(get('percentageMaxSpeed')),
      percentageRawMaxSpeedKph: toNumber(get('percentageRawMaxSpeedKph')),
      maxSpeed90Events: toNumber(get('maxSpeed90Events')),
      maxSpeed90DistanceM: toNumber(get('maxSpeed90DistanceM')),
      maxSpeed90DurationSecs: toNumber(get('maxSpeed90DurationSecs')),
      rawMaxSpeed90Events: toNumber(get('rawMaxSpeed90Events')),
      rawMaxSpeed90DistanceM: toNumber(get('rawMaxSpeed90DistanceM')),
      rawMaxSpeed90DurationSecs: toNumber(get('rawMaxSpeed90DurationSecs')),
    },
  };
}

async function readCsv(path: string): Promise<Record<string, unknown>[]> {
  return new Promise((resolve, reject) => {
    const rows: Record<string, unknown>[] = [];
    fs.createReadStream(path).pipe(csv()).on('data', row => rows.push(row)).on('end', () => resolve(rows)).on('error', reject);
  });
}

function readXlsx(path: string): Record<string, unknown>[] {
  const fileBuffer = fs.readFileSync(path);
  const workbook = XLSX.read(fileBuffer, { cellDates: true, type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { defval: null });
}

function validateColumns(rows: Record<string, unknown>[]) {
  if (!rows.length) throw new AppError(400, 'The uploaded file is empty.');
  const columns = Object.keys(rows[0]).map(normalizeKey);
  const hasCanonical = (canonical: string) => (columnAliases[canonical] ?? []).some(alias => columns.includes(normalizeKey(alias)));
  const missingRequired = requiredCanonical.filter(c => !hasCanonical(c));
  if (missingRequired.length) throw new AppError(400, 'Required columns are missing.', missingRequired);
  return allExpectedAliases.filter(c => !columns.includes(normalizeKey(c)));
}

export async function importFile(file: Express.Multer.File) {
  const ext = file.originalname.split('.').pop()?.toLowerCase() ?? '';
  if (!['csv', 'xlsx', 'xls'].includes(ext)) throw new AppError(400, 'Unsupported file format. Upload .csv, .xlsx or .xls.');

  const rows = ext === 'csv' ? await readCsv(file.path) : readXlsx(file.path);
  const missingExpected = validateColumns(rows);
  const parsed = rows.map(mapRow).filter((x): x is NonNullable<ReturnType<typeof mapRow>> => Boolean(x));
  if (!parsed.length) throw new AppError(400, 'No valid records found. Check Athlete ID and Start Date.');

  let importedRows = 0;
  let duplicateRows = 0;

  await prisma.$transaction(async tx => {
    for (const item of parsed) {
      await tx.athlete.upsert({ where: { id: item.athlete.id }, update: { position: item.athlete.position, groups: item.athlete.groups }, create: item.athlete });
      const existing = await tx.performance.findFirst({ where: { athleteId: item.performance.athleteId, startDate: item.performance.startDate, segmentName: item.performance.segmentName } });
      if (existing) { duplicateRows += 1; continue; }
      await tx.performance.create({ data: item.performance });
      importedRows += 1;
    }
  }, { timeout: 20000, maxWait: 5000 });

  await (prisma as any).importLog.create({ data: { fileName: file.originalname, fileType: ext, status: 'success', importedRows, ignoredRows: rows.length - parsed.length, duplicateRows, missingColumns: missingExpected, errors: [] } }).catch(() => null);
  await classifyAthletes();
  await PerformanceDropService.recalculate();
  return { importedRows, ignoredRows: rows.length - parsed.length, duplicateRows, missingExpectedColumns: missingExpected };
}
