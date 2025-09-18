import axios from "axios";
import { API_URLS } from '../config/api';

export const addNewStockTrade = async (tradeDetails) => {
    try {
        const response = await axios.post(`${API_URLS.TRADES}/stock`, tradeDetails);
        return {
            created: true,
            tradeid: response.data.tradeid,
            ...response.data
        };
    } catch (error) {
        console.error("Error creating stock trade:", error);
        throw error;
    }
};

export const updateStockTrade = async (e) => {
    try {
        console.log('updateStockTrade called with:', e);
        const response = await axios.patch(`${API_URLS.TRADES}/stock`, e, {
            params: {
                id: e.tradeid
            }
        });
        console.log('updateStockTrade response:', response);
        if (!(response.status === 200)) {
            console.error('updateStockTrade failed - non-200 status:', response.status);
            return { "created": false, error: `HTTP ${response.status}` }
        }
        return { "created": true, ...response.data };
    } catch (e) {
        console.error('updateStockTrade error:', e);
        return { "created": false, error: e.message }
    }
};

export const getStockTrades = async (params = {}) => {
    try {
        const response = await axios.get(`${API_URLS.TRADES}/stock`, {
            params: {
                status: params.status?.toUpperCase(),
                minimumreturn: params.minimumreturn,
                maximumreturn: params.maximumreturn,
                tradeid: params.id,
                id: params.id,
                createdafter: params.createdafter,
                createdbefore: params.createdbefore
            }
        });

        if (response.status === 200) {
            return response.data;
        }

        console.warn('Unexpected response status:', response.status);
        return [];
    } catch (error) {
        console.error('Error fetching stock trades:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });

        if (error.response?.status === 404) {
            throw new Error('Trade service endpoint not found. Please check if the backend server is running.');
        } else if (error.response?.status === 500) {
            throw new Error('Server error: ' + (error.response.data?.message || 'Unknown error'));
        } else if (!error.response) {
            throw new Error('Network error: Unable to connect to the trade service. Please check if the backend server is running.');
        }

        throw new Error(`Unable to get trades: ${error.response?.data?.message || error.message}`);
    }
};

export const getStockTradesbyId = async (id) => {
    try {
        const response = await axios.get(`${API_URLS.TRADES}/stock`, {
            params: {
                id: Array.isArray(id) ? id : [id]
            }
        });
        if (response.status === 200) {
            return response.data;
        }
        return [];
    } catch (error) {
        console.error('Error fetching stock trades:', error);
    }
}


export const deleteStockTrade = async (tradeid) => {
    try {
        const response = await axios.delete(`${API_URLS.TRADES}/stock`, {
            params: {
                id: tradeid
            }
        });
        if (response.status === 204) {
            return true
        }
        else return false;
    } catch (e) {
        console.error(e)
    }
};

export const addNewOptionTrade = async (tradeDetails) => {
    try {
        const response = await axios.post(`${API_URLS.TRADES}/option`, tradeDetails);
        return {
            created: true,
            tradeid: response.data.tradeid,
            ...response.data
        };
    } catch (error) {
        console.error("Error creating option trade:", error);
        throw error;
    }
};

export const getOptionTrades = async (e) => {
    try {
        const response = await axios.get(`${API_URLS.TRADES}/option`, {
            params: {
                status: e.status,
                minimumreturn: e.minimumreturn,
                maximumreturn: e.maximumreturn,
                createdafter: e.createdafter,
                createdbefore: e.createdbefore
            }
        });
        if (response.status === 200) {
            return response.data
        }
        return [];
    } catch (e) {
        throw new Error("Unable to get trades")
    }
};

export const getOptionTradesbyId = async (id) => {
    try {
        const response = await axios.get(`${API_URLS.TRADES}/option`, {
            params: {
                id: Array.isArray(id) ? id : [id]
            }
        });
        if (response.status === 200) {
            return response.data;
        }
        return [];
    } catch (error) {
        console.error('Error fetching option trades:', error);
        throw new Error("Unable to get trades");
    }
};

export const deleteOptionTrade = async (tradeid) => {
    try {
        const response = await axios.delete(`${API_URLS.TRADES}/option`, {
            params: {
                id: tradeid
            }
        });
        if (response.status === 204) {
            return true
        }
        else return false;
    } catch (e) {
        console.error(e)
    }
};

export const updateOptionTrade = async (e) => {
    try {
        console.log('updateOptionTrade called with:', e);
        const response = await axios.patch(`${API_URLS.TRADES}/option`, e, {
            params: {
                id: e.tradeid
            }
        });
        console.log('updateOptionTrade response:', response);
        if (!(response.status === 200)) {
            console.error('updateOptionTrade failed - non-200 status:', response.status);
            return { "created": false, error: `HTTP ${response.status}` }
        }
        return { "created": true, ...response.data };
    } catch (e) {
        console.error('updateOptionTrade error:', e);
        return { "created": false, error: e.message }
    }
};
