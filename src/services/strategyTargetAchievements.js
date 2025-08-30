import axios from 'axios';
import { API_URLS } from '../config/api';

// Check if target has been achieved for a strategy
export const checkTargetAchievement = async (strategyId, targetValue) => {
    try {
        const response = await axios.get(`${API_URLS.STRATEGY_TARGET_ACHIEVEMENTS}/check`, {
            params: { strategy_id: strategyId, target_value: targetValue }
        });
        return response.data;
    } catch (error) {
        console.error('Error checking target achievement:', error);
        throw error;
    }
};

// Create a new target achievement record
export const createTargetAchievement = async (strategyId, targetValue) => {
    try {
        const response = await axios.post(`${API_URLS.STRATEGY_TARGET_ACHIEVEMENTS}/create`, {
            strategy_id: strategyId,
            target_value: targetValue
        });
        return response.data;
    } catch (error) {
        console.error('Error creating target achievement:', error);
        throw error;
    }
};

// Reset a target achievement (mark as not achieved)
export const resetTargetAchievement = async (strategyId, targetValue) => {
    try {
        const response = await axios.post(`${API_URLS.STRATEGY_TARGET_ACHIEVEMENTS}/reset`, {
            strategy_id: strategyId,
            target_value: targetValue
        });
        return response.data;
    } catch (error) {
        console.error('Error resetting target achievement:', error);
        throw error;
    }
};

// Get target value for a strategy
export const getStrategyTarget = async (strategyId) => {
    try {
        const response = await axios.get(`${API_URLS.STRATEGY_TARGET_ACHIEVEMENTS}/target/${strategyId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching strategy target:', error);
        throw error;
    }
};

// Update target value for a strategy
export const updateTargetValue = async (strategyId, targetValue) => {
    try {
        const response = await axios.put(`${API_URLS.STRATEGY_TARGET_ACHIEVEMENTS}/update`, {
            strategy_id: strategyId,
            target_value: targetValue
        });
        return response.data;
    } catch (error) {
        console.error('Error updating target value:', error);
        throw error;
    }
};

// Get all achievements for a strategy
export const getStrategyAchievements = async (strategyId) => {
    try {
        const response = await axios.get(`${API_URLS.STRATEGY_TARGET_ACHIEVEMENTS}/${strategyId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching strategy achievements:', error);
        throw error;
    }
};
