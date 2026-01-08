// src/controllers/healthController.ts
import {type Request, type Response } from 'express';

type HealthState = {
  userId: string;
  health: number; // 0–100
  maxHealth: number;
};

const healthStore = new Map<string, HealthState>();

export const initializeHealth = (req: Request, res: Response) => {
  const { userId } = req.params as { userId: string };
  
  const existing = healthStore.get(userId);
  if (existing) {
    return res.status(200).json(existing);
  }
  
  const newHealth: HealthState = {
    userId,
    health: 100,
    maxHealth: 100
  };
  
  healthStore.set(userId, newHealth);
  return res.status(201).json(newHealth);
};

export const getHealth = (req: Request, res: Response) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  const health = healthStore.get(userId);
  if (!health) {
    return res.status(404).json({ error: 'Health not found' });
  }

  return res.status(200).json(health);
};

export const updateHealth = (req: Request, res: Response) => {
  const { userId } = req.params;
  const { health, maxHealth } = req.body as Partial<HealthState>;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  if (typeof health !== 'number') {
    return res.status(400).json({ error: 'health must be a number' });
  }

  const existing = healthStore.get(userId) ?? {
    userId,
    health: 100,
    maxHealth: maxHealth ?? 100,
  };

  const newState: HealthState = {
    ...existing,
    health,
    maxHealth: maxHealth ?? existing.maxHealth,
  };

  healthStore.set(userId, newState);

  return res.status(200).json(newState);
};
