// Import functions from oco.js
import { createOrderPair, getOrderPairs, getActivePairs, updateOrderPair, deleteOrderPair, getCompletedOrderPairs } from './oco';

// Import functions from oao.js
import { createOaoOrderPair, updateOaoOrderPair, deleteOaoOrderPair } from './oao';

// Re-export all paired order related functions
export {
    createOrderPair,
    getOrderPairs,
    getActivePairs,
    updateOrderPair,
    deleteOrderPair,
    getCompletedOrderPairs,
    createOaoOrderPair,
    updateOaoOrderPair,
    deleteOaoOrderPair
}; 