import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5003';

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

export const getInstruments = async (params = {}) => {
    const response = await api.get('/api/zerodha/instruments', { params });
    return response.data;
};

export const getAccountInfo = async () => {
    try {
        const response = await api.get('/api/zerodha/account');
        console.log('Account info response:', response.data);
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

export const placeOrder = async (orderParams) => {
    try {
        const response = await api.post('/api/zerodha/order', orderParams);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.error || 'Failed to place order');
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
export const cancelZerodhaOrder = async (orderId) => {
    const response = await api.post(`/api/zerodha/order/${orderId}/cancel`);
    return response.data;
};

// Modify an open order
export const modifyZerodhaOrder = async (orderId, data) => {
    const response = await api.post(`/api/zerodha/order/${orderId}/modify`, data);
    return response.data;
};

export const getOrderById = async (orderId) => {
    const response = await api.get(`/api/zerodha/order/${orderId}`);
    return response.data;
};

export default api; 