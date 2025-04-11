import axios from "axios";
import { API_URLS } from '../config/api';

export const getActionItems = async () => {
    try {
        const response = await axios.get(API_URLS.ACTION_ITEMS);
        if (response.status === 200) {
            return response.data;
        }
        return [];
    } catch (e) {
        console.error(e);
        return [];
    }
};

export const addActionItem = async (actionItem) => {
    try {
        const response = await axios.post(API_URLS.ACTION_ITEMS, actionItem);
        if (response.status === 201) {
            return response.data;
        }
        return null;
    } catch (e) {
        console.error(e);
        return null;
    }
};

export const updateActionItem = async (id, actionItem) => {
    try {
        const response = await axios.patch(API_URLS.ACTION_ITEMS, actionItem, {
            params: { id }
        });
        return response.status === 200;
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const deleteActionItem = async (id) => {
    try {
        const response = await axios.delete(API_URLS.ACTION_ITEMS, {
            params: { id }
        });
        return response.status === 204;
    } catch (e) {
        console.error(e);
        return false;
    }
};