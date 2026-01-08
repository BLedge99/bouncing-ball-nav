import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const getUserId = (): string => {
  let userId = localStorage.getItem('userId');
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('userId', userId);
  }
  return userId;
};

export const getPosition = async (userId: string, level: number = 1) => {
  const response = await axios.get(`${API_BASE_URL}/position/${userId}`, {
    params: { level }
  });
  return response.data;
};

export const savePosition = async (
  userId: string, 
  level: number, 
  position: { x: number; y: number; z: number }
) => {
  const response = await axios.post(`${API_BASE_URL}/position/${userId}`, {
    level,
    position
  });
  return response.data;
};

export const getHealth = async (userId: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/health/${userId}`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return initializeHealth(userId);
    }
    throw error;
  }
};

export const initializeHealth = async (userId: string) => {
  const response = await axios.post(`${API_BASE_URL}/health/${userId}/init`);
  return response.data;
};

export const updateHealth = async (userId: string, health: number, maxHealth?: number) => {
  const response = await axios.put(`${API_BASE_URL}/health/${userId}`, {
    health,
    maxHealth
  });
  return response.data;
};

export const getCompletion = async (userId: string) => {
  const response = await axios.get(`${API_BASE_URL}/completion/${userId}`);
  return response.data;
};

export const saveCompletion = async (
  userId: string, 
  currentLevel: number, 
  highestLevelCompleted?: number
) => {
  const response = await axios.post(`${API_BASE_URL}/completion/${userId}`, {
    currentLevel,
    highestLevelCompleted
  });
  return response.data;
};