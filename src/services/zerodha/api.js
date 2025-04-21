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
    const response = await api.get('/api/zerodha/login-url');
    return response.data;
};

export const handleCallback = async (params) => {
    const response = await api.get('/api/zerodha/login', { params });
    return response.data;
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

export const getInstruments = async () => {
    const response = await api.get('/api/zerodha/instruments');
    return response.data;
};

export const isAuthenticated = () => {
    return !!(localStorage.getItem('zerodha_access_token') && localStorage.getItem('zerodha_public_token'));
};

export const logout = () => {
    localStorage.removeItem('zerodha_access_token');
    localStorage.removeItem('zerodha_public_token');
};

export default api; 