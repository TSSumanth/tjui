import axios from 'axios';
import { API_URLS } from '../config/api';

const BASE_URL = API_URLS.MANUAL_PL;

export const getManualPl = async ({ id, AssetName }) => {
    const params = {};
    if (id) params.id = id;
    if (AssetName) params.AssetName = AssetName;
    const resp = await axios.get(BASE_URL, { params });
    return resp.data;
};

export const createManualPl = async ({ AssetName, manual_pl }) => {
    const resp = await axios.post(BASE_URL, { AssetName, manual_pl });
    return resp.data;
};

export const updateManualPl = async ({ id, AssetName, manual_pl }) => {
    const params = {};
    if (id) params.id = id;
    if (AssetName) params.AssetName = AssetName;
    const resp = await axios.patch(BASE_URL, { manual_pl }, { params });
    return resp.data;
};

export const deleteManualPl = async ({ id, AssetName }) => {
    const params = {};
    if (id) params.id = id;
    if (AssetName) params.AssetName = AssetName;
    const resp = await axios.delete(BASE_URL, { params });
    return resp.status === 204;
}; 