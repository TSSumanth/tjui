import axios from "axios";
import { API_URLS } from '../config/api';

// Account Summary Operations
export const getAccountSummary = async () => {
    try {
        const response = await axios.get(API_URLS.ZERODHA_ACCOUNT+'/summary');
        return response.data;
    } catch (error) {
        console.error('Error fetching account summary:', error);
        throw error;
    }
};

export const updateAccountSummary = async (clientId, name, email) => {
    try {
        const response = await axios.post(API_URLS.ZERODHA_ACCOUNT+'/summary', {
            client_id: clientId,
            name,
            email
        });
        return response.data;
    } catch (error) {
        console.error('Error updating account summary:', error);
        throw error;
    }
};

// Equity Margins Operations
export const getEquityMargins = async () => {
    try {
        const response = await axios.get(API_URLS.ZERODHA_ACCOUNT+'/margins');
        return response.data;
    } catch (error) {
        console.error('Error fetching equity margins:', error);
        throw error;
    }
};

export const updateEquityMargins = async (clientId, data) => {
    try {
        const response = await axios.post(API_URLS.ZERODHA_ACCOUNT+'/margins', 
            {
                client_id: clientId,
                ...data
            });
        return response.data;
    } catch (error) {
        console.error('Error updating equity margins:', error);
        throw error;
    }
};

// Mutual Funds Operations
export const getMutualFunds = async () => {
    try {
        const response = await axios.get(API_URLS.ZERODHA_ACCOUNT+'/mutual-funds');
        return response.data;
    } catch (error) {
        console.error('Error fetching mutual funds:', error);
        throw error;
    }
};

export const updateMutualFunds = async (clientId, data) => {
    try {
        const response = await axios.post(API_URLS.ZERODHA_ACCOUNT+'/mutual-funds', 
            {
                client_id: clientId,
                data: data
            });
        return response.data;
    } catch (error) {
        console.error('Error updating mutual funds:', error);
        throw error;
    }
};

export const deleteMutualFund = async (folioNumber) => {
    try {
        const response = await axios.delete(API_URLS.ZERODHA_ACCOUNT+`/mutual-funds/${folioNumber}`);
        return response.data;
    } catch (error) {
        console.error('Error deleting mutual fund:', error);
        throw error;
    }
}; 