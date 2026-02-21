import cors from 'cors';
import express from 'express';
import apiRoutes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api', apiRoutes);
app.get('/health', (_req, res) => res.json({ ok: true }));
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
