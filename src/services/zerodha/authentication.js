import { KiteConnect } from 'kiteconnect';
import * as zerodhaApi from './api';
import { setWebSocketAccessToken, disconnectWebSocket } from './webhook';

// Initialize KiteConnect with API key
const apiKey = process.env.REACT_APP_ZERODHA_API_KEY;

// Function to get login URL
export const getLoginUrl = async () => {
    try {
        // Get the login URL from our backend
        const loginUrl = await zerodhaApi.getLoginUrl();
        return loginUrl;
    } catch (error) {
        console.error('Error generating login URL:', error);
        throw error;
    }
};

// Function to handle login callback
export const handleLoginCallback = async (params) => {
    try {
        console.log('Handling login callback with params:', params);
        const response = await zerodhaApi.handleCallback(params);
        console.log('Login callback response:', response);

        if (response && response.access_token) {
            console.log('Storing tokens in localStorage');
            localStorage.setItem('zerodha_access_token', response.access_token);
            localStorage.setItem('zerodha_public_token', response.public_token);
            // Set websocket access token in backend
            await setWebSocketAccessToken(response.access_token);
            window.location.reload(); // Reload to update the UI
            return response;
        } else {
            throw new Error('No access token in response');
        }
    } catch (error) {
        console.error('Error handling login callback:', error);
        throw error;
    }
};

// Function to get stored access token
export const getAccessToken = () => {
    return localStorage.getItem('zerodha_access_token');
};

// Function to check if user is authenticated
export const isAuthenticated = () => {
    return !!getAccessToken();
};

// Function to logout
export const logout = async () => {
    try {
        // Clear tokens
        localStorage.removeItem('zerodha_access_token');
        localStorage.removeItem('zerodha_public_token');

        // Disconnect websocket if needed
        try {
            await disconnectWebSocket();
        } catch (error) {
            console.error('Error disconnecting websocket:', error);
        }

        // Redirect to login page
        window.location.href = '/zerodha/login';
    } catch (error) {
        console.error('Error during logout:', error);
        throw error;
    }
};

// Function to initialize KiteConnect with stored access token
export const initializeKiteConnect = () => {
    const accessToken = getAccessToken();
    const kc = new KiteConnect({
        api_key: apiKey
    });

    if (accessToken) {
        kc.setAccessToken(accessToken);
    }
    return kc;
}; 