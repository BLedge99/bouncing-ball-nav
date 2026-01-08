import express, { type Express, type Request, type Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import healthRoutes from './routes/healthRoutes.js';
import completionRoutes from './routes/completionRoutes.js'; 
import positionRoutes from './routes/positionRoutes.js';


// ... rest of your code

dotenv.config();

const app: Express = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic route for testing
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'API is running' });
});

// Attach imported routes
app.use('/api', healthRoutes);
app.use('/api', completionRoutes);
app.use('/api', positionRoutes);

app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});


export default app;