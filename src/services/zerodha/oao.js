import api from './api';
import { API_URLS } from '../../config/api';

export const createOaoOrderPair = async ({
    order1_id,
    order2_id,
    order1_details,
    order1_tradingsymbol,
    order1_transaction_type,
    order1_quantity,
    order1_price,
    order1_product,
    order1_order_type,
    order1_validity,
    order2_details,
    order2_tradingsymbol,
    order2_transaction_type,
    order2_quantity,
    order2_price,
    order2_product,
    order2_order_type,
    order2_validity
}) => {
    const resp = await api.post(`${API_URLS.ORDER_PAIRS}`, {
        order1_id,
        order2_id,
        type: 'OAO',
        order1_details,
        order1_tradingsymbol,
        order1_transaction_type,
        order1_quantity,
        order1_price,
        order1_product,
        order1_order_type,
        order1_validity,
        order2_details,
        order2_tradingsymbol,
        order2_transaction_type,
        order2_quantity,
        order2_price,
        order2_product,
        order2_order_type,
        order2_validity
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

export const updateOaoOrderPairStatus = async (id, status) => {
    const resp = await api.patch(`${API_URLS.ORDER_PAIRS}/${id}`, { status });
    return resp.data;
};

export const updateOaoOrderPair = async (id, updateData) => {
    const resp = await api.patch(`${API_URLS.ORDER_PAIRS}/${id}`, updateData);
    return resp.data;
}; 