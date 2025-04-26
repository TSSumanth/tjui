import axios from "axios";
import { API_URLS } from '../config/api';

export const getActionItems = async (params = {}) => {
    try {
        // Handle both string status (backward compatibility) and object params
        const queryParams = typeof params === 'string'
            ? { status: params }
            : {
                status: params.status,
                stock_trade_id: params.stock_trade_id,
                option_trade_id: params.option_trade_id
            };

        const response = await axios.get(API_URLS.ACTION_ITEMS, { params: queryParams });
        if (response.status === 200) {
            return response.data;
        }
        return [];
    } catch (e) {
        console.error(e);
        return [];
    }
};

export const addActionItem = async (item) => {
    try {
        // Add default values for new attributes if not provided
        const itemWithDefaults = {
            ...item,
            created_by: item.created_by || 'MANUAL',
            asset: item.asset || null,
            stock_trade_id: item.stock_trade_id || null,
            option_trade_id: item.option_trade_id || null
        };
        const response = await axios.post(API_URLS.ACTION_ITEMS, itemWithDefaults);
        if (response.status === 201) {
            return response.data;
        }
        return null;
    } catch (e) {
        console.error(e);
        return null;
    }
};

export const updateActionItem = async (item) => {
    try {
        // Ensure all fields are included in the update
        const itemWithDefaults = {
            ...item,
            created_by: item.created_by || 'MANUAL',
            asset: item.asset || null,
            stock_trade_id: item.stock_trade_id || null,
            option_trade_id: item.option_trade_id || null
        };
        const response = await axios.patch(`${API_URLS.ACTION_ITEMS}/${item.id}`, itemWithDefaults);
        return response.status === 200;
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const deleteActionItem = async (id) => {
    try {
        const response = await axios.delete(`${API_URLS.ACTION_ITEMS}/${id}`);
        return response.status === 204;
    } catch (e) {
        console.error(e);
        return false;
    }
};