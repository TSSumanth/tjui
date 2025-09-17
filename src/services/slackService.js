import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003';

/**
 * Send daily summary notification to Slack
 * @returns {Promise<Object>} - API response
 */
export const sendDailySummary = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/slack/daily-summary`);
    return response.data;
  } catch (error) {
    console.error('Error sending daily summary:', error);
    throw error;
  }
};

/**
 * Test daily summary functionality
 * @returns {Promise<Object>} - API response
 */
export const testDailySummary = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/slack/test-daily-summary`);
    return response.data;
  } catch (error) {
    console.error('Error testing daily summary:', error);
    throw error;
  }
};

