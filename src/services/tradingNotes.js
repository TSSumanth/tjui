import axios from "axios";
import { API_URLS } from '../config/api';

export const createTradingNote = async (noteData) => {
    try {
        const response = await axios.post(API_URLS.TRADING_NOTES, noteData);
        if (response.status === 201) {
            return {
                success: true,
                data: response.data.data
            };
        }
        return {
            success: false,
            error: 'Failed to create trading note'
        };
    } catch (error) {
        console.error('Error creating trading note:', error);
        return {
            success: false,
            error: error.response?.data?.error || 'Failed to create trading note'
        };
    }
};

export const getTradingNotes = async () => {
    try {
        const response = await axios.get(API_URLS.TRADING_NOTES);
        if (response.status === 200) {
            return {
                success: true,
                data: response.data.data
            };
        }
        return {
            success: false,
            data: []
        };
    } catch (error) {
        console.error('Error fetching trading notes:', error);
        return {
            success: false,
            data: [],
            error: error.response?.data?.error || 'Failed to fetch trading notes'
        };
    }
};

export const getTradingNoteById = async (id) => {
    try {
        const response = await axios.get(`${API_URLS.TRADING_NOTES}/${id}`);
        if (response.status === 200) {
            return {
                success: true,
                data: response.data.data
            };
        }
        return {
            success: false,
            error: 'Failed to fetch trading note'
        };
    } catch (error) {
        console.error('Error fetching trading note:', error);
        return {
            success: false,
            error: error.response?.data?.error || 'Failed to fetch trading note'
        };
    }
};

export const updateTradingNote = async (id, noteData) => {
    try {
        const response = await axios.put(`${API_URLS.TRADING_NOTES}/${id}`, noteData);
        if (response.status === 200) {
            return {
                success: true,
                message: response.data.message
            };
        }
        return {
            success: false,
            error: 'Failed to update trading note'
        };
    } catch (error) {
        console.error('Error updating trading note:', error);
        return {
            success: false,
            error: error.response?.data?.error || 'Failed to update trading note'
        };
    }
};

export const deleteTradingNote = async (id) => {
    try {
        const response = await axios.delete(`${API_URLS.TRADING_NOTES}/${id}`);
        if (response.status === 200) {
            return {
                success: true,
                message: response.data.message
            };
        }
        return {
            success: false,
            error: 'Failed to delete trading note'
        };
    } catch (error) {
        console.error('Error deleting trading note:', error);
        return {
            success: false,
            error: error.response?.data?.error || 'Failed to delete trading note'
        };
    }
};
