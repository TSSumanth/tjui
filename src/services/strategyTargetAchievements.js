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

// Check if max loss has been triggered for a strategy
export const checkMaxLossTriggered = async (strategyId) => {
    try {
        const response = await axios.get(`${API_URLS.STRATEGY_TARGET_ACHIEVEMENTS}/max-loss/check`, {
            params: { strategy_id: strategyId }
        });
        return response.data;
    } catch (error) {
        console.error('Error checking max loss triggered:', error);
        throw error;
    }
};

// Update max loss value for a strategy
export const updateMaxLossValue = async (strategyId, maxLossValue) => {
    try {
        const response = await axios.put(`${API_URLS.STRATEGY_TARGET_ACHIEVEMENTS}/max-loss/update`, {
            strategy_id: strategyId,
            max_loss_value: maxLossValue
        });
        return response.data;
    } catch (error) {
        console.error('Error updating max loss value:', error);
        throw error;
    }
};

// Trigger max loss for a strategy
export const triggerMaxLoss = async (strategyId, maxLossValue) => {
    try {
        const response = await axios.post(`${API_URLS.STRATEGY_TARGET_ACHIEVEMENTS}/max-loss/trigger`, {
            strategy_id: strategyId,
            max_loss_value: maxLossValue
        });
        return response.data;
    } catch (error) {
        console.error('Error triggering max loss:', error);
        throw error;
    }
};

// Get both target and max loss values for a strategy
export const getStrategyTargetAndMaxLoss = async (strategyId) => {
    try {
        const response = await axios.get(`${API_URLS.STRATEGY_TARGET_ACHIEVEMENTS}/target-maxloss/${strategyId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching strategy target and max loss:', error);
        throw error;
    }
};
