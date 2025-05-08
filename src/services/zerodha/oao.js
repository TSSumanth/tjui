import api from './api';
import { API_URLS } from '../../config/api';

export const createOaoOrderPair = async ({
    order1_id,
    order2_id,
    order1_details,
    order2_details
}) => {
    const resp = await api.post(`${API_URLS.ORDER_PAIRS}`, {
        order1_id,
        order2_id,
        type: 'OAO',
        order1_details,
        order2_details
    });
    return resp.data;
};

export const getOaoOrderPairs = async () => {
    const resp = await api.get(`${API_URLS.ORDER_PAIRS}?type=OAO`);
    return resp.data;
};

export const deleteOaoOrderPair = async (id) => {
    await api.delete(`${API_URLS.ORDER_PAIRS}/${id}`);
}; 