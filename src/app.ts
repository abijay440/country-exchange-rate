import dotenv from 'dotenv';
dotenv.config({ path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env' });

import express, { Express } from 'express';
import countryRoutes from './routes/country.routes';
import { getStatus, getSummaryImage } from './controllers/country.controller';

const app: Express = express();

app.use(express.json());

app.use('/countries', countryRoutes);
app.get('/status', getStatus);
app.get('/countries/image', getSummaryImage);

export default app;
