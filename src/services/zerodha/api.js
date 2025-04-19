import axios from 'axios';
import { getAccessToken } from './authentication';

const BASE_URL = 'http://localhost:5001/api/zerodha';

const zerodhaApi = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true // Important for handling cookies if needed
});

// Add authorization header interceptor
zerodhaApi.interceptors.request.use(
    (config) => {
        const token = getAccessToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export const getLoginUrl = () => zerodhaApi.get('/login-url');
export const handleCallback = (params) => zerodhaApi.get(`/login?${new URLSearchParams(params)}`);
export const getProfile = () => zerodhaApi.get('/profile');
export const getHoldings = () => zerodhaApi.get('/holdings');
export const getPositions = () => zerodhaApi.get('/positions');

export default zerodhaApi; 