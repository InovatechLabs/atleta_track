import { Router } from 'express';
import multer from 'multer';
import { importController } from '../controllers/importController.js';
import { listAthletes, athleteDetails, compare } from '../controllers/athleteController.js';
import { listPerformances } from '../controllers/performanceController.js';
import { dashboard, homepreview } from '../controllers/dashboardController.js';
import { listAlerts, listPerformanceAlerts, refreshAlerts } from '../controllers/alertController.js';
import { calculateInjuryRisk, calculateTeamRisk, createInjury, importInjuries, listInjuries } from '../controllers/injuryController.js';

const upload = multer({ dest: 'uploads/', limits: { fileSize: 20 * 1024 * 1024 } });
export const routes = Router();

routes.get('/health', (_req, res) => res.json({ ok: true, service: 'FieldVision API' }));
routes.post('/import', upload.single('file'), importController);
routes.get('/athletes', listAthletes);
routes.get('/athletes/:id', athleteDetails);
routes.get('/performances', listPerformances);
routes.get('/dashboard', dashboard);
routes.get('/compare', compare);
routes.get('/alerts', listAlerts);
routes.get('/alerts/performance', listPerformanceAlerts);
routes.post('/alerts/recalculate', refreshAlerts);
routes.get('/injuries', listInjuries);
routes.post('/injuries', createInjury);
routes.post('/injuries/import', upload.single('file'), importInjuries);
routes.get('/injury-risk', calculateTeamRisk);
routes.get('/injury-risk/:athleteId', calculateInjuryRisk);
routes.get('/previews', homepreview);
