import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { routes } from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';

const app = express();
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN, 
  credentials: true 
}));
app.use(express.json({ limit: '2mb' }));
app.use('/api', routes);
app.use(errorHandler);

const port = Number(process.env.PORT ?? 3333);
app.listen(port, () => console.log(`AtletaTrack API running on port ${port}`));
