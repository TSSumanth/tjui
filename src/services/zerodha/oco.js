import api from './api';
import { cancelZerodhaOrder, getOrderById } from './api';
import { addActionItem } from '../actionitems';


// Store OCO pairs in memory
let ocoPairs = new Map();

// Add a new OCO pair
export const addOcoPair = (order1Id, order2Id) => {
    ocoPairs.set(order1Id, order2Id);
    ocoPairs.set(order2Id, order1Id);
};

// Remove an OCO pair
export const removeOcoPair = (orderId) => {
    const pairedOrderId = ocoPairs.get(orderId);
    if (pairedOrderId) {
        ocoPairs.delete(orderId);
        ocoPairs.delete(pairedOrderId);
    }
};

// Check if an order is part of an OCO pair
export const isOcoOrder = (orderId) => {
    return ocoPairs.has(orderId);
};

// Get the paired order ID
export const getPairedOrderId = (orderId) => {
    return ocoPairs.get(orderId);
};

// Monitor OCO orders
export const startOcoMonitoring = async () => {
    const checkOrders = async () => {
        try {
            // For each OCO pair, fetch status for both orders
            for (const [order1Id, order2Id] of ocoPairs.entries()) {
                let order1Status = null;
                let order2Status = null;
                try {
                    const resp1 = await getOrderById(order1Id);
                    if (resp1.success && Array.isArray(resp1.data) && resp1.data.length > 0) {
                        order1Status = resp1.data[resp1.data.length - 1].status;
                    }
                } catch (err) {
                    console.error(`Error fetching status for order ${order1Id}:`, err);
                }
                try {
                    const resp2 = await getOrderById(order2Id);
                    if (resp2.success && Array.isArray(resp2.data) && resp2.data.length > 0) {
                        order2Status = resp2.data[resp2.data.length - 1].status;
                    }
                } catch (err) {
                    console.error(`Error fetching status for order ${order2Id}:`, err);
                }

                // OCO logic
                if (order1Status && order2Status) {
                    if (order1Status === 'COMPLETE' && order2Status === 'COMPLETE') {
                        const description = `One Cancels Other Order execution failed, both orders are executed. Please Close one order. Order Details: ${order1Id}, ${order2Id}`;
                        await addActionItem({
                            description,
                            status: 'TODO',
                            created_by: 'Automatic',
                            asset: '',
                            stock_trade_id: '',
                            option_trade_id: ''
                        });
                        removeOcoPair(order1Id);
                    } else if (order1Status === 'COMPLETE' && order2Status === 'OPEN') {
                        await cancelZerodhaOrder(order2Id);
                        removeOcoPair(order1Id);
                    } else if (order2Status === 'COMPLETE' && order1Status === 'OPEN') {
                        await cancelZerodhaOrder(order1Id);
                        removeOcoPair(order2Id);
                    }
                }
            }
        } catch (error) {
            console.error('Error monitoring OCO orders:', error);
        }
    };

    // Check orders every 5 seconds
    const interval = setInterval(checkOrders, 5000);

    // Return cleanup function
    return () => clearInterval(interval);
};

// Get all OCO pairs as array of {order1Id, order2Id}
export const getAllOcoPairs = () => {
    const seen = new Set();
    const pairs = [];
    for (const [order1Id, order2Id] of ocoPairs.entries()) {
        if (!seen.has(order1Id) && !seen.has(order2Id)) {
            pairs.push({ order1Id, order2Id });
            seen.add(order1Id);
            seen.add(order2Id);
        }
    }
    return pairs;
};

export const createOrderPair = async ({ order1_id, order2_id, type = 'OCO', order1_symbol, order2_symbol, order1_type, order2_type }) => {
    const resp = await api.post('/api/order-pairs', { order1_id, order2_id, type, order1_symbol, order2_symbol, order1_type, order2_type });
    return resp.data;
};

export const getOrderPairs = async () => {
    const resp = await api.get('/api/order-pairs');
    return resp.data;
};

export const deleteOrderPair = async (id) => {
    await api.delete(`/api/order-pairs/${id}`);
};

export const updateOrderPairStatus = async (id, status) => {
    const resp = await api.patch(`/api/order-pairs/${id}`, { status });
    return resp.data;
}; 