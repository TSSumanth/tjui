import axios from "axios";

const API_URL = "http://localhost:1000/api/tags";


export const getTags = async (e) => {
    const response = await axios.get(API_URL, {
        params: {
            "name": e
        }
    });
    if (!(response.status === 200)) {
        throw new Error("Failed to Get tags");
    }
    return response.data;
};

export const getTag = async (e) => {
    const response = await axios.get(API_URL + "/" + e);
    if (!(response.status === 200)) {
        throw new Error("Failed to Get tags");
    }
    return response.data;
};

export const deleteTag = async (e) => {
    const response = await axios.delete(API_URL + "/" + e);
    if (!(response.status === 204)) {
        return false;
    }
    return true;
};


export const addTag = async (e) => {
    const response = await axios.post(API_URL, e);
    if (!(response.status === 201)) {
        return false;
    }
    return true;
};

export const updateTag = async (name, e) => {
    const response = await axios.patch(API_URL+"/"+ name, e );
    if (!(response.status === 200)) {
        return false;
    }
    return true;
};