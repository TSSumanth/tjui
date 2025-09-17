import axios from 'axios';
import { API_URLS } from '../config/api';
const API_URL = API_URLS.ALGO_STRATEGIES;

export const getAlgoStrategies = async (params) => {
    const response = await axios.get(API_URL, { params });
    return response.data;
};

export const getAlgoStrategyById = async (id) => {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
};

export const createAlgoStrategy = async (strategy) => {
    const response = await axios.post(API_URL, strategy);
    return response.data;
};

export const updateAlgoStrategy = async (id, updates) => {
    const response = await axios.patch(`${API_URL}/${id}`, updates);
    return response.data;
};

export const deleteAlgoStrategy = async (id) => {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
};

// Create a new note for a strategy
export const createStrategyNote = async ({ strategyid, notes }) => {
    const response = await axios.post(`${API_URL}/notes`, { strategyid, notes });
    return response.data;
};

// Get all notes for a strategy
export const getStrategyNotes = async (notesid) => {
    const response = await axios.get(`${API_URL}/notes/${notesid}`);
    return response.data;
};

// Get a single note by id
export const getStrategyNoteById = async (strategyid) => {
    const response = await axios.get(`${API_URL}/notes`, 
        { params: { strategyid: strategyid } });
    return response.data;
};

// Delete a note by id
export const deleteStrategyNote = async (id) => {
    const response = await axios.delete(`${API_URL}/notes/${id}`);
    return response.data;
};

// Send alert notification
export const sendAlert = async (alertData) => {
    const response = await axios.post(`${API_URLS.BASE_URL}/api/slack/alert`, alertData);
    return response.data;
};