import axios from 'axios';
import { API_URLS } from '../config/api';
const API_URL = API_URLS.AUTOMATED_ORDERS;

export const getAutomatedOrders = async (params) => {
    const response = await axios.get(API_URL, { params });
    return response.data;
};

export const getAutomatedOrderById = async (id) => {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
};

export const createAutomatedOrder = async (order) => {
    const response = await axios.post(API_URL, order);
    return response.data;
};

export const updateAutomatedOrder = async (id, updates) => {
    const response = await axios.patch(`${API_URL}/${id}`, updates);
    return response.data;
};

export const deleteAutomatedOrder = async (id) => {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
}; 