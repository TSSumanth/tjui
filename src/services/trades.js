import axios from "axios";

const API_URL = "http://localhost:1000/api/trades";


export const addNewStockTrade = async (e) => {
    console.log(e)
    try {
        const response = await axios.post(API_URL + "/stock", e);
        if (!(response.status === 201)) {
            return { "created": false }
        }
        return { "created": true, ...response.data };
    } catch (e) {
        return { "created": false }
    }
};

export const updateStockTrade = async (e) => {
    console.log(e)
    try {
        const response = await axios.patch(API_URL + "/stock", e, {
            params: {
                id: e.tradeid
            }
        });
        if (!(response.status === 200)) {
            return { "created": false }
        }
        return { "created": true, ...response.data };
    } catch (e) {
        return { "created": false }
    }
};


export const getStockTrades = async (e) => {
    console.log(e)
    try {
        const response = await axios.get(API_URL + "/stock", {
            params: {
                status: e.status,
                minimumreturn: e.minimumreturn,
                maximumreturn: e.maximumreturn,
                tradeid: e.id
            }
        });
        if (response.status === 200) {
            console.log(response.data)
            return response.data
        }
        return [];
    } catch (e) {
        throw new Error("Unable to get trades")
    }
};

export const getStockTradesbyId = async (id) => {
    try {
        const response = await axios.get(API_URL + "/stock", {
            params: {
                id: id
            }
        });
        if (response.status === 200) {
            console.log(response.data)
            return response.data
        }
        return [];
    } catch (e) {
        throw new Error("Unable to get trades")
    }
};

export const deleteStockTrade = async (tradeid) => {
    try {
        const response = await axios.delete(API_URL + "/stock", {
            params: {
                id: tradeid
            }
        });
        if (response.status === 204) {
            return true
        }
        else return false;
    } catch (e) {
        console.log(e)
    }
};

export const addNewOptionTrade = async (e) => {
    console.log(e)
    try {
        const response = await axios.post(API_URL + "/option", e);
        if (!(response.status === 201)) {
            return { "created": false }
        }
        return { "created": true, ...response.data };
    } catch (e) {
        return { "created": false }
    }
};


export const getOptionTrades = async (e) => {
    console.log(e)
    try {
        const response = await axios.get(API_URL + "/option", {
            params: {
                status: e.status,
                minimumreturn: e.minimumreturn,
                maximumreturn: e.maximumreturn
            }
        });
        if (response.status === 200) {
            console.log(response.data)
            return response.data
        }
        return [];
    } catch (e) {
        throw new Error("Unable to get trades")
    }
};


export const getOptionTradesbyId = async (id) => {
    try {
        const response = await axios.get(API_URL + "/option", {
            params: {
                id: id
            }
        });
        if (response.status === 200) {
            console.log(response.data)
            return response.data
        }
        return [];
    } catch (e) {
        throw new Error("Unable to get trades")
    }
};

export const deleteOptionTrade = async (tradeid) => {
    try {
        const response = await axios.delete(API_URL + "/option", {
            params: {
                id: tradeid
            }
        });
        if (response.status === 204) {
            return true
        }
        else return false;
    } catch (e) {
        console.log(e)
    }
};

export const updateOptionTrade = async (e) => {
    console.log(e)
    try {
        const response = await axios.patch(API_URL + "/option", e, {
            params: {
                id: e.tradeid
            }
        });
        if (!(response.status === 200)) {
            return { "created": false }
        }
        return { "created": true, ...response.data };
    } catch (e) {
        return { "created": false }
    }
};
