import axios from "axios";
import { API_URLS } from '../config/api';

export const getTags = async () => {
    try {
        const response = await axios.get(API_URLS.TAG_MANAGEMENT);
        if (response.status === 200) {
            return response.data;
        }
        return [];
    } catch (e) {
        console.error(e);
        return [];
    }
};

export const getTag = async (e) => {
    const response = await axios.get(API_URLS.TAG_MANAGEMENT + "/" + e);
    if (!(response.status === 200)) {
        throw new Error("Failed to Get tags");
    }
    return response.data;
};

export const deleteTag = async (id) => {
    try {
        const response = await axios.delete(API_URLS.TAG_MANAGEMENT, {
            params: { id }
        });
        return response.status === 204;
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const addTag = async (tag) => {
    try {
        const response = await axios.post(API_URLS.TAG_MANAGEMENT, tag);
        if (response.status === 201) {
            return response.data;
        }
        return null;
    } catch (e) {
        console.error(e);
        return null;
    }
};

export const updateTag = async (id, tag) => {
    try {
        const response = await axios.patch(API_URLS.TAG_MANAGEMENT, tag, {
            params: { id }
        });
        return response.status === 200;
    } catch (e) {
        console.error(e);
        return false;
    }
};