import axios from "axios";

const API_URL = "http://localhost:1000/api/strategies";
const NOTE_API_URL = "http://localhost:1000/api/strategy-notes";
export const createStrategy = async (e) => {
    try {
        const response = await axios.post(API_URL, e);
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
        const response = await axios.get(API_URL, {
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
        const response = await axios.get(API_URL, {
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
        const response = await axios.patch(API_URL, e, {
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
        const response = await axios.delete(API_URL, {
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
        const response = await axios.get(NOTE_API_URL, {
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
        const response = await axios.post(NOTE_API_URL, {
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
        const response = await axios.patch(NOTE_API_URL, {
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
        const response = await axios.delete(NOTE_API_URL, {
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