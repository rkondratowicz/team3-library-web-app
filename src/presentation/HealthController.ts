import type { Request, Response } from 'express';
import type { GreetingResponse } from '../shared/types.js';

export class HealthController {
  // GET /health - Health check endpoint
  healthCheck = (_req: Request, res: Response): void => {
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      service: 'Library API'
    });
  };

  // GET /greet - Greeting endpoint
  greet = (req: Request, res: Response<GreetingResponse>): void => {
    const personName: string = (req.query.q as string) || 'Guest';
    res.json({ message: `Hello, ${personName}!` });
  };
}