// src/controllers/positionController.ts
import { type Request, type Response } from 'express';

type PositionState = {
  userId: string;
  level: number;
  position: { x: number; y: number; z: number };
};

const positionStore = new Map<string, PositionState>();

export const getPosition = (req: Request, res: Response) => {
  const { userId } = req.params;
  const level = Number(req.query.level ?? 1);

  const key = `${userId}:${level}`;
  const pos = positionStore.get(key);

  if (!pos) {
    return res.status(200).json({
      userId,
      level,
      position: { x: 0, y: 0, z: 0 }
    });
  }

  return res.status(200).json(pos);
};

export const savePosition = (req: Request, res: Response) => {
  const { userId } = req.params;
  const { level, position } = req.body as Partial<PositionState>;

  if (
    !userId ||
    typeof level !== 'number' ||
    !position ||
    typeof position.x !== 'number' ||
    typeof position.y !== 'number' ||
    typeof position.z !== 'number'
  ) {
    return res.status(400).json({ error: 'Invalid position payload' });
  }

  const key = `${userId}:${level}`;
  const state: PositionState = {
    userId,
    level,
    position,
  };

  positionStore.set(key, state);

  return res.status(201).json(state);
};
