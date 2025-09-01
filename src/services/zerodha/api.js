import axios from 'axios';
import { API_URLS } from '../../config/api';

const BASE_URL = API_URLS.BASE_URL;

// Create axios instance with base configuration
const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    withCredentials: true,
    mode: 'cors'
});

// Add request interceptor to include auth tokens
api.interceptors.request.use((config) => {
    const accessToken = localStorage.getItem('zerodha_access_token');
    const publicToken = localStorage.getItem('zerodha_public_token');

    if (accessToken && publicToken) {
        config.headers['Authorization'] = `Bearer ${accessToken}`;
        config.headers['X-Zerodha-Public-Token'] = publicToken;
    }

    return config;
});

// Add response interceptor to handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 403) {
            console.error('Access denied:', error.response.data);
        }
        return Promise.reject(error);
    }
);

// API endpoints
export const getLoginUrl = async () => {
    try {
        const response = await api.get('/api/zerodha/login-url');
        if (response.data && response.data.success) {
            return response.data.url;
        } else {
            throw new Error('Failed to get login URL');
        }
    } catch (error) {
        console.error('Error in getLoginUrl:', error);
        throw error;
    }
};

export const handleCallback = async (params) => {
    try {
        const response = await api.get('/api/zerodha/login', { params });
        console.log('Login callback response:', response.data);
        if (response.data && response.data.success) {
            return response.data;
        } else {
            throw new Error('Failed to handle login callback');
        }
    } catch (error) {
        console.error('Error in handleCallback:', error);
        throw error;
    }
};

export const getHoldings = async () => {
    const response = await api.get('/api/zerodha/holdings');
    return response.data;
};

export const getPositions = async () => {
    const response = await api.get('/api/zerodha/positions');
    return response.data;
};

export const getOrders = async () => {
    const response = await api.get('/api/zerodha/orders');
    return response.data;
};

/**
 * Get instruments with advanced filtering
 * 
 * @param {Object} params - Query parameters
 * @param {string} params.search - Search in tradingsymbol (case-insensitive)
 * @param {string} params.name - Filter by instrument name (e.g., 'NIFTY', 'BANKNIFTY')
 * @param {string} params.exchange - Filter by exchange (e.g., 'NFO', 'NSE')
 * @param {string} params.type - Filter by instrument_type (e.g., 'CE', 'PE', 'FUT')
 * @param {number} params.strike - Filter by exact strike value
 * @param {number} params.strike_min - Minimum strike value for range
 * @param {number} params.strike_max - Maximum strike value for range
 * @param {string} params.expiry - Filter by expiry date (YYYY-MM-DD)
 * @param {number} params.page - Pagination page number (default: 1)
 * @param {number} params.pageSize - Results per page (default: 100)
 * 
 * @returns {Promise<Object>} Instruments data with pagination
 * 
 * @example
 * // Get Nifty CE options for specific expiry and strike range
 * getInstruments({
 *   name: 'NIFTY',
 *   exchange: 'NFO',
 *   type: 'CE',
 *   expiry: '2025-09-02',
 *   strike_min: 24000,
 *   strike_max: 25000
 * })
 */
export const getInstruments = async (params = {}) => {
    try {
        const response = await api.get('/api/zerodha/instruments', { params });
        if (!response.data) {
            throw new Error('No data received from instruments API');
        }
        return response.data;
    } catch (error) {
        console.error('Error in getInstruments:', error);
        console.error('Error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
        throw error;
    }
};

/**
 * Get Nifty options for a specific expiry and strike range
 * 
 * @param {string} expiry - Expiry date (YYYY-MM-DD)
 * @param {number} strikeMin - Minimum strike value
 * @param {number} strikeMax - Maximum strike value
 * @param {string} type - Option type ('CE' or 'PE')
 * 
 * @returns {Promise<Object>} Nifty options data
 */
export const getNiftyOptions = async (expiry, strikeMin, strikeMax, type) => {
    return getInstruments({
        name: 'NIFTY',
        exchange: 'NFO',
        type: type,
        expiry: expiry,
        strike_min: strikeMin,
        strike_max: strikeMax
    });
};

/**
 * Get Bank Nifty options for a specific expiry and strike range
 * 
 * @param {string} expiry - Expiry date (YYYY-MM-DD)
 * @param {number} strikeMin - Minimum strike value
 * @param {number} strikeMax - Maximum strike value
 * @param {number} type - Option type ('CE' or 'PE')
 * 
 * @returns {Promise<Object>} Bank Nifty options data
 */
export const getBankNiftyOptions = async (expiry, strikeMin, strikeMax, type) => {
    return getInstruments({
        name: 'BANKNIFTY',
        exchange: 'NFO',
        type: type,
        expiry: expiry,
        strike_min: strikeMin,
        strike_max: strikeMax
    });
};

export const getAccountInfo = async () => {
    try {
        const response = await api.get('/api/zerodha/account');
        if (response.data && response.data.success) {
            return response.data;
        } else {
            throw new Error(response.data?.error || 'Failed to get account info');
        }
    } catch (error) {
        console.error('Error in getAccountInfo:', error.response?.data || error);
        throw error;
    }
};

export const isAuthenticated = () => {
    return !!(localStorage.getItem('zerodha_access_token') && localStorage.getItem('zerodha_public_token'));
};

export const logout = () => {
    localStorage.removeItem('zerodha_access_token');
    localStorage.removeItem('zerodha_public_token');
};

// Regular Order APIs
export const placeRegularOrder = async (orderParams) => {
    try {
        const response = await api.post('/api/zerodha/order', orderParams);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.error || 'Failed to place regular order');
    }
};

export const cancelRegularOrder = async (orderId) => {
    try {
        const response = await api.post(`/api/zerodha/order/${orderId}/cancel`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.error || 'Failed to cancel regular order');
    }
};

export const modifyRegularOrder = async (orderId, data) => {
    try {
        const response = await api.post(`/api/zerodha/order/${orderId}/modify`, data);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.error || 'Failed to modify regular order');
    }
};

// AMO Order APIs
export const placeAmoOrder = async (orderParams) => {
    try {
        const response = await api.post('/api/zerodha/orders/amo', orderParams);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.error || 'Failed to place AMO order');
    }
};

export const cancelAmoOrder = async (orderId) => {
    try {
        const response = await api.delete(`/api/zerodha/orders/amo/${orderId}`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.error || 'Failed to cancel AMO order');
    }
};

export const modifyAmoOrder = async (orderId, data) => {
    try {
        const response = await api.put(`/api/zerodha/orders/amo/${orderId}`, data);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.error || 'Failed to modify AMO order');
    }
};

// Helper function to create close position order params
export const createClosePositionOrder = (position) => {
    const isLong = position.quantity > 0;
    return {
        tradingsymbol: position.tradingsymbol,
        exchange: position.exchange,
        transaction_type: isLong ? 'SELL' : 'BUY',
        quantity: Math.abs(position.quantity),
        product: position.product,
        order_type: 'MARKET'
    };
};

// Helper function to create close holding order params
export const createCloseHoldingOrder = (holding) => {
    return {
        tradingsymbol: holding.tradingsymbol,
        exchange: holding.exchange,
        transaction_type: 'SELL',
        quantity: holding.quantity,
        product: 'CNC', // For holdings, always CNC
        order_type: 'MARKET'
    };
};

// Cancel an open order
export const cancelZerodhaOrder = async (orderId, orderType = 'regular') => {
    try {
        const response = await api.delete(`/api/zerodha/orders/${orderType}/${orderId}`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.error || `Failed to cancel ${orderType} order`);
    }
};

export const getOrderById = async (orderId) => {
    const response = await api.get(`/api/zerodha/order/${orderId}`);
    return response.data;
};

// Refresh instruments (manual trigger)
export const refreshInstruments = async () => {
    const response = await api.post('/api/zerodha/instruments/refresh');
    return response.data;
};

// Get real-time LTP for an instrument
export const getInstrumentLTP = async (exchange, tradingsymbol) => {
    console.log('getInstrumentLTP', exchange, tradingsymbol);
    const response = await api.get('/api/zerodha/instruments/ltp', {
        params: { exchange, tradingsymbol }
    });
    return response.data;
};

// Get real-time LTPs for multiple instruments
export const fetchLTPs = async (instruments) => {
    console.log('fetchLTPs', instruments);
    try {
        console.log('Instruments received for LTP fetch:', instruments);

        // Group instruments by exchange to minimize API calls
        const exchangeGroups = instruments.reduce((acc, instrument) => {
            const { exchange, tradingsymbol } = instrument;
            if (!acc[exchange]) {
                acc[exchange] = [];
            }
            acc[exchange].push(tradingsymbol);
            return acc;
        }, {});

        console.log('Grouped by exchange:', exchangeGroups);

        // Fetch LTPs for each exchange group
        const ltpPromises = Object.entries(exchangeGroups).map(async ([exchange, tradingsymbols]) => {
            console.log(`Fetching LTPs for ${exchange}:`, tradingsymbols);
            const response = await api.get('/api/zerodha/instruments/ltp', {
                params: {
                    exchange,
                    tradingsymbol: tradingsymbols.join(','),
                    _t: Date.now() // Add timestamp to prevent caching
                }
            });
            console.log(`Raw LTP response for ${exchange}:`, response.data);

            // Handle the response data
            if (!response.data || typeof response.data !== 'object') {
                console.error('Invalid response format:', response.data);
                return {};
            }

            return response.data;
        });

        // Wait for all LTP fetches to complete
        const results = await Promise.all(ltpPromises);
        console.log('All LTP results:', results);

        // Combine all results into a single LTP map
        const ltpMap = {};
        results.forEach(result => {
            if (result && typeof result === 'object') {
                Object.entries(result).forEach(([key, value]) => {
                    if (value && value.last_price !== undefined) {
                        const tradingsymbol = key.split(':')[1]; // Remove exchange prefix
                        ltpMap[tradingsymbol] = value.last_price;
                    }
                });
            }
        });

        // Log detailed information for debugging
        console.log('Final LTP map:', ltpMap);
        console.log('Total instruments processed:', instruments.length);
        console.log('Total LTPs fetched:', Object.keys(ltpMap).length);
        
        if (Object.keys(ltpMap).length === 0) {
            console.warn('⚠️ No LTPs were fetched successfully. This might indicate an issue with the backend response.');
        }

        return ltpMap;
    } catch (error) {
        console.error('Error fetching LTPs:', error);
        throw error;
    }
};

export default api; 