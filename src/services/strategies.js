import axios from "axios";

const API_URL = "http://localhost:1000/api/strategies";

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
        // console.log(e)
        // return false
    }
};