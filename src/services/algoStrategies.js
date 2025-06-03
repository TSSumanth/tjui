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
    const response = await axios.post(`/api/algo-strategies/notes`, { strategyid, notes });
    return response.data;
};

// Get all notes for a strategy
export const getStrategyNotes = async (strategyid) => {
    const response = await axios.get(`/api/algo-strategies/notes/${strategyid}`);
    return response.data;
};

// Get a single note by id
export const getStrategyNoteById = async (id) => {
    const response = await axios.get(`/api/algo-strategies/notes/${id}`);
    return response.data;
};

// Delete a note by id
export const deleteStrategyNote = async (id) => {
    const response = await axios.delete(`/api/algo-strategies/notes/${id}`);
    return response.data;
};