import axios from 'axios';
import { API_URLS } from '../config/api';

const BASE_URL = API_URLS.HOLIDAYS;

export const getHolidays = async (params = {}) => {
    try {
        const response = await axios.get(BASE_URL, { params });
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const createHoliday = async (holidayData) => {
    try {
        const response = await axios.post(BASE_URL, holidayData);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const updateHoliday = async (id, holidayData) => {
    try {
        const response = await axios.patch(`${BASE_URL}/${id}`, holidayData);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const deleteHoliday = async (id) => {
    try {
        const response = await axios.delete(`${BASE_URL}/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
}; 