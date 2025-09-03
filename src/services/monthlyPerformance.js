import { API_URLS } from '../config/api';

/**
 * Monthly Performance API Service
 * Handles all API calls related to monthly performance tracking
 */

const MONTHLY_PERFORMANCE_API = API_URLS.MONTHLY_PERFORMANCE;

/**
 * Get current month performance data
 * @returns {Promise<Object>} Current month performance data
 */
export const getCurrentMonthPerformance = async () => {
    try {
        const response = await fetch(`${MONTHLY_PERFORMANCE_API}/current`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching current month performance:', error);
        throw error;
    }
};

/**
 * Get monthly performance data for a specific year/month
 * @param {number} year - Year (e.g., 2025)
 * @param {number} month - Month (1-12)
 * @returns {Promise<Object>} Monthly performance data
 */
export const getMonthlyPerformance = async (year, month) => {
    try {
        let url = MONTHLY_PERFORMANCE_API;
        if (year && month) {
            url += `?year=${year}&month=${month}`;
        } else if (year) {
            url += `?year=${year}`;
        }

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching monthly performance:', error);
        throw error;
    }
};

/**
 * Create or update monthly performance data
 * @param {Object} performanceData - Performance data to save
 * @param {number} performanceData.year - Year
 * @param {number} performanceData.month - Month (1-12)
 * @param {string} performanceData.month_name - Month name (e.g., 'September')
 * @param {number} performanceData.expected_return - Expected return percentage
 * @param {number} performanceData.actual_return - Actual return percentage
 * @param {number} performanceData.account_balance - Current account balance
 * @returns {Promise<Object>} Response from API
 */
export const saveMonthlyPerformance = async (performanceData) => {
    try {
        const response = await fetch(MONTHLY_PERFORMANCE_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(performanceData),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error saving monthly performance:', error);
        throw error;
    }
};

/**
 * Update monthly performance data (PUT method)
 * @param {Object} performanceData - Performance data to update
 * @returns {Promise<Object>} Response from API
 */
export const updateMonthlyPerformance = async (performanceData) => {
    try {
        const response = await fetch(MONTHLY_PERFORMANCE_API, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(performanceData),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error updating monthly performance:', error);
        throw error;
    }
};
