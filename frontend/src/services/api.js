import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// User management
export const createUserSession = async () => {
  try {
    const response = await api.post('/users');
    return response.data;
  } catch (error) {
    console.error('Error creating user session:', error);
    throw error;
  }
};

// Valuation
export const submitValuation = async (userId, inputData) => {
  try {
    const response = await api.post('/valuate', {
      userId,
      inputData,
    });
    return response.data;
  } catch (error) {
    console.error('Error submitting valuation:', error);
    throw error;
  }
};

export const getValuation = async (valuationId) => {
  try {
    const response = await api.get(`/valuations/${valuationId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching valuation:', error);
    throw error;
  }
};

export const updateValuation = async (valuationId, inputData) => {
  try {
    const response = await api.put(`/valuations/${valuationId}`, {
      inputData,
    });
    return response.data;
  } catch (error) {
    console.error('Error updating valuation:', error);
    throw error;
  }
};

export const markImprovementAsCompleted = async (valuationId, improvementKey) => {
  try {
    const response = await api.post(
      `/valuations/${valuationId}/improvements/${improvementKey}`
    );
    return response.data;
  } catch (error) {
    console.error('Error marking improvement as completed:', error);
    throw error;
  }
};

export const getUserValuations = async (userId) => {
  try {
    const response = await api.get(`/users/${userId}/valuations`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user valuations:', error);
    throw error;
  }
};

export const checkHealth = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    console.error('Error checking API health:', error);
    throw error;
  }
};
