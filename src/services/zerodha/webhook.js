import api from './api';

export const subscribeToTokens = async (tokens) => {
    const response = await api.post('/api/zerodha-ws/subscribe', { tokens });
    return response.data;
};

export const unsubscribeFromTokens = async (tokens) => {
    const response = await api.post('/api/zerodha-ws/unsubscribe', { tokens });
    return response.data;
};

export const getWebSocketSubscriptions = async () => {
    const response = await api.get('/api/zerodha-ws/subscriptions');
    return response.data;
};

export const getWebSocketTick = async (instrument_token) => {
    const response = await api.get('/api/zerodha-ws/tick', { params: { instrument_token } });
    return response.data;
};

export const getWebSocketDepth = async (instrument_token) => {
    const response = await api.get('/api/zerodha-ws/depth', { params: { instrument_token } });
    return response.data;
};

export const getWebSocketStatus = async () => {
    const response = await api.get('/api/zerodha-ws/status');
    return response.data;
};

export const setWebSocketAccessToken = async (access_token) => {
    const response = await api.post('/api/zerodha-ws/set-access-token', { access_token });
    return response.data;
}; 