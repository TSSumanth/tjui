import axios from "axios";
import { API_URLS } from '../config/api';

const API_URL = "http://localhost:1000/api/orders";


export const addStockOrder = async (e) => {
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

export const getTradeStockOrders = async (tradeid) => {
    if (!tradeid)
        return [];
    try {
        const response = await axios.get(`${API_URLS.ORDERS}/stock`, {
            params: {
                "tradeid": tradeid
            }
        });
        if (response.status === 200) {
            console.log(response.data)
            return response.data
        }
        return [];
    } catch (e) {
        alert("Unable to get trades for id: " + e.tradeid)
    }
};

export const deleteTradeStockOrder = async (orderid) => {
    try {
        const response = await axios.delete(API_URL + "/stock", {
            params: {
                "id": orderid
            }
        });
        if (response.status === 204) {
            return true
        }
        return false;
    } catch (e) {
        console.log(e)
        return false;
    }
};

export const deleteAllTradeStockOrders = async (tradeid) => {
    let response = await getTradeStockOrders(tradeid);

    // Wait for all delete requests to complete
    const results = await Promise.all(response.map(async (order) => {
        try {
            const response1 = await axios.delete(`${API_URLS.ORDERS}/stock`, {
                params: { "id": order.id }
            });
            return response1.status === 204 ? order : null; // Return deleted order or null
        } catch (e) {
            console.log(e);
            return null; // Ensure failed deletions return null
        }
    }));

    // Filter out successful deletions
    let deleted = results.filter(order => order !== null);

    return response.length === deleted.length;
};

export const updateStockOrder = async (e) => {
    try {
        const response = await axios.patch(API_URL + "/stock", e, {
            params: {
                "id": e.id
            }
        });
        if (response.status === 200) {
            return true
        }
        return false;
    } catch (e) {
        console.log(e)
        return false;
    }
};


export const addOptionOrder = async (e) => {
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

export const getTradeOptionOrders = async (tradeid) => {
    if (!tradeid)
        return [];
    try {
        const response = await axios.get(`${API_URLS.ORDERS}/option`, {
            params: {
                "tradeid": tradeid
            }
        });
        if (response.status === 200) {
            console.log(response.data)
            return response.data
        }
        return [];
    } catch (e) {
        alert("Unable to get trades for id: " + e.tradeid)
    }
};

export const updateOptionOrder = async (e) => {
    try {
        const response = await axios.patch(API_URL + "/option", e, {
            params: {
                "id": e.id
            }
        });
        if (response.status === 200) {
            return true
        }
        return false;
    } catch (e) {
        console.log(e)
        return false;
    }
};

export const deleteTradeOptionOrder = async (orderid) => {
    try {
        const response = await axios.delete(API_URL + "/option", {
            params: {
                "id": orderid
            }
        });
        if (response.status === 204) {
            return true
        }
        return false;
    } catch (e) {
        console.log(e)
        return false;
    }
};



export const deleteAllTradeOptionOrders = async (tradeid) => {
    let response = await getTradeOptionOrders(tradeid);

    // Wait for all delete requests to complete
    const results = await Promise.all(response.map(async (order) => {
        try {
            const response1 = await axios.delete(`${API_URLS.ORDERS}/option`, {
                params: { "id": order.id }
            });
            return response1.status === 204 ? order : null; // Return deleted order or null
        } catch (e) {
            console.log(e);
            return null; // Ensure failed deletions return null
        }
    }));

    // Filter out successful deletions
    let deleted = results.filter(order => order !== null);

    return response.length === deleted.length;
};
