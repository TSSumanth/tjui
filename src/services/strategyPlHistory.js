import axios from 'axios';
import { API_URLS } from '../config/api';

const BASE_URL = API_URLS.BASE_URL;

// Get P/L history for a specific strategy
export const getStrategyPlHistory = async (strategyId, options = {}) => {
  try {
    const { startDate, endDate, limit = 1000, strategyType = 'regular' } = options;
    const params = new URLSearchParams();
    
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (limit) params.append('limit', limit);
    if (strategyType) params.append('strategyType', strategyType);

    const response = await axios.get(
      `${BASE_URL}/api/strategy-pl-history/${strategyId}?${params.toString()}`
    );
    
    return response.data;
  } catch (error) {
    console.error('Error fetching strategy P/L history:', error);
    throw error;
  }
};

// Save P/L history for a strategy
export const saveStrategyPlHistory = async (plData) => {
  try {
    const response = await axios.post(`${BASE_URL}/api/strategy-pl-history/`, plData);
    return response.data;
  } catch (error) {
    console.error('Error saving strategy P/L history:', error);
    throw error;
  }
};

// Get P/L history for multiple strategies
export const getMultipleStrategiesPlHistory = async (strategyIds, options = {}) => {
  try {
    const { startDate, endDate, limit = 1000, strategyType = 'regular' } = options;
    const params = new URLSearchParams();
    
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (limit) params.append('limit', limit);

    const response = await axios.post(
      `${BASE_URL}/api/strategy-pl-history/multiple?${params.toString()}`,
      { strategyIds, strategyType }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error fetching multiple strategies P/L history:', error);
    throw error;
  }
};

// Cleanup old P/L history data
export const cleanupOldPlHistory = async (daysToKeep = 30) => {
  try {
    const response = await axios.delete(
      `${BASE_URL}/api/strategy-pl-history/cleanup?daysToKeep=${daysToKeep}`
    );
    return response.data;
  } catch (error) {
    console.error('Error cleaning up old P/L history:', error);
    throw error;
  }
};

// Helper function to format P/L history data for Recharts
export const formatPlHistoryForChart = (plHistoryData) => {
  if (!plHistoryData || !Array.isArray(plHistoryData)) {
    return [];
  }

  // Sort by timestamp (oldest first for chart)
  const sortedData = [...plHistoryData].sort((a, b) => 
    new Date(a.timestamp) - new Date(b.timestamp)
  );

  // Format for Recharts - array of objects with timestamp and values
  return sortedData.map(item => ({
    timestamp: new Date(item.timestamp),
    'P/L': parseFloat(item.total_pl),
    'Market Price': parseFloat(item.market_price)
  }));
};

// Helper function to get P/L statistics
export const getPlStatistics = (plHistoryData) => {
  if (!plHistoryData || !Array.isArray(plHistoryData) || plHistoryData.length === 0) {
    return {
      currentPl: 0,
      maxPl: 0,
      minPl: 0,
      avgPl: 0,
      totalRecords: 0
    };
  }

  const plValues = plHistoryData.map(item => parseFloat(item.total_pl));
  const currentPl = plValues[0] || 0; // First record (most recent)
  const maxPl = Math.max(...plValues);
  const minPl = Math.min(...plValues);
  const avgPl = plValues.reduce((sum, val) => sum + val, 0) / plValues.length;

  return {
    currentPl,
    maxPl,
    minPl,
    avgPl,
    totalRecords: plHistoryData.length
  };
};
