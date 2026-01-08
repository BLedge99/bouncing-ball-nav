// src/controllers/completionController.ts
import { type Request, type Response } from 'express';

type CompletionState = {
  userId: string;
  currentLevel: number;
  highestLevelCompleted: number;
};

const completionStore = new Map<string, CompletionState>();

export const getCompletion = (req: Request, res: Response) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  const state = completionStore.get(userId);
  if (!state) {
    return res.status(404).json({ error: 'Progress not found' });
  }

  return res.status(200).json(state);
};

export const saveCompletion = (req: Request, res: Response) => {
  const { userId } = req.params;
  const { currentLevel, highestLevelCompleted } =
    req.body as Partial<CompletionState>;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  if (typeof currentLevel !== 'number') {
    return res.status(400).json({ error: 'currentLevel must be a number' });
  }

  const existing = completionStore.get(userId) ?? {
    userId,
    currentLevel: 1,
    highestLevelCompleted: 0,
  };

  const newState: CompletionState = {
    ...existing,
    currentLevel,
    highestLevelCompleted:
      typeof highestLevelCompleted === 'number'
        ? highestLevelCompleted
        : Math.max(existing.highestLevelCompleted, currentLevel),
  };

  completionStore.set(userId, newState);

  return res.status(200).json(newState);
};
