import axios from "axios";
import { API_URLS } from '../config/api';

export const createStrategy = async (e) => {
    try {
        const response = await axios.post(API_URLS.STRATEGIES, e);
        if (!(response.status === 201)) {
            return false;
        }
        return true;
    } catch (e) {
        console.log(e)
        return false
    }
};

export const getOpenStrategies = async () => {
    try {
        const response = await axios.get(API_URLS.STRATEGIES, {
            params: {
                status: "OPEN"
            }
        });
        if (!(response.status === 200)) {
            return [];
        }
        return response.data;
    } catch (e) {
        console.error(e)
        return []
    }
};

export const getStrategies = async (filter) => {
    try {
        const response = await axios.get(API_URLS.STRATEGIES, {
            params: filter
        });
        if (!(response.status === 200)) {
            return [];
        }
        return response.data;
    } catch (e) {
        console.error(e)
        return []
    }
};

export const updateStrategy = async (e) => {
    try {
        const response = await axios.patch(API_URLS.STRATEGIES, e, {
            params: {
                id: e.id
            }
        });
        if (!(response.status === 200)) {
            return false;
        }
        return true;
    } catch (e) {
        throw new Error(e)
    }
};

export const deleteStrategy = async (id) => {
    try {
        const response = await axios.delete(API_URLS.STRATEGIES, {
            params: {
                id: id
            }
        });
        if (response.status === 204) {
            return true;
        }
        return false;
    } catch (e) {
        throw new Error(e)
    }
};

export const getStrategyNotes = async (strategyId) => {
    try {
        const response = await axios.get(API_URLS.STRATEGY_NOTES, {
            params: {
                strategy_id: strategyId
            }
        });
        if (response.status === 200) {
            return response.data;
        }
        return [];
    } catch (e) {
        console.error(e);
        return [];
    }
};

export const addStrategyNote = async (strategyId, content) => {
    try {
        const response = await axios.post(API_URLS.STRATEGY_NOTES, {
            strategy_id: strategyId,
            content: content
        });
        if (response.status === 201) {
            return response.data;
        }
        return null;
    } catch (e) {
        console.error(e);
        return null;
    }
};

export const updateStrategyNote = async (noteId, content) => {
    try {
        const response = await axios.patch(API_URLS.STRATEGY_NOTES, {
            content: content
        }, {
            params: {
                id: noteId
            }
        });
        return response.status === 200;
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const deleteStrategyNote = async (noteId) => {
    try {
        const response = await axios.delete(API_URLS.STRATEGY_NOTES, {
            params: {
                id: noteId
            }
        });
        return response.status === 204;
    } catch (e) {
        console.error(e);
        return false;
    }
};