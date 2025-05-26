import { useState, useEffect } from 'react';
import { getWebSocketStatus, subscribeToTokens, disconnectWebSocket, getWebSocketSubscriptions } from '../../services/zerodha/webhook';
import marketHoursService from '../../services/zerodha/marketHours';

// Global state
let globalState = {
    isConnected: false,
    webhookStatus: { tickerConnected: false, loading: false },
    statusLoading: false,
    isMarketOpen: false,
    isPolling: true,
    subscribedTokens: [],
    lastStatusCheck: 0,
    pollingInterval: null  // Add tracking for polling interval
};

// Subscribers
const subscribers = new Set();

// Notify all subscribers of state changes
const notifySubscribers = () => {
    subscribers.forEach(callback => callback(globalState));
};

// Update state and notify subscribers
const setState = (newState) => {
    globalState = { ...globalState, ...newState };
    notifySubscribers();
};

// Poll status with throttling
const fetchStatus = async (force = false) => {
    const now = Date.now();
    if (!force && now - globalState.lastStatusCheck < 30000) {
        return; // Skip if last check was less than 30 seconds ago
    }

    setState({ statusLoading: true });
    try {
        const res = await getWebSocketStatus();
        setState({
            webhookStatus: { tickerConnected: res.tickerConnected, loading: false },
            isConnected: res.tickerConnected,
            lastStatusCheck: now,
            statusLoading: false
        });
    } catch {
        setState({
            webhookStatus: { tickerConnected: false, loading: false },
            isConnected: false,
            statusLoading: false
        });
    }
};

const fetchSubscriptions = async () => {
    try {
        const res = await getWebSocketSubscriptions();
        setState({ subscribedTokens: res.data || [] });
    } catch (err) {
        console.error('Failed to fetch subscriptions:', err);
    }
};

// Connect to Webhook
const handleConnectWebhook = async () => {
    setState({ webhookStatus: { ...globalState.webhookStatus, loading: true } });
    try {
        await subscribeToTokens([]);
        setState({ isConnected: true });
        fetchStatus(true); // Force status check after connect
    } catch {
        setState({ isConnected: false });
    } finally {
        setState({ webhookStatus: { ...globalState.webhookStatus, loading: false } });
    }
};

// Disconnect Webhook
const handleDisconnectWebhook = async () => {
    setState({ webhookStatus: { ...globalState.webhookStatus, loading: true } });
    try {
        await disconnectWebSocket();
        setState({ isConnected: false });
        fetchStatus(true); // Force status check after disconnect
        return true;
    } catch {
        return false;
    } finally {
        setState({ webhookStatus: { ...globalState.webhookStatus, loading: false } });
    }
};

// Initialize polling
const initPolling = () => {
    // Clear any existing polling interval
    if (globalState.pollingInterval) {
        clearInterval(globalState.pollingInterval);
    }

    // Only start polling if both conditions are met
    if (globalState.isPolling && globalState.isMarketOpen) {
        console.log('Starting WebSocket polling');
        const interval = setInterval(() => {
            fetchStatus(); // Will be throttled internally
            fetchSubscriptions();
        }, 2000);

        setState({ pollingInterval: interval });
        return interval;
    }
    return null;
};

// Initialize market hours subscription
const initMarketHoursSubscription = () => {
    return marketHoursService.subscribe((marketHours) => {
        console.log('Market hours changed:', marketHours);
        setState({ isMarketOpen: marketHours });

        // Handle WebSocket connection based on market hours
        if (marketHours && !globalState.isConnected) {
            handleConnectWebhook();
        } else if (!marketHours && globalState.isConnected) {
            handleDisconnectWebhook();
        }

        // Restart polling when market hours change
        if (globalState.isPolling) {
            fetchStatus(true); // Force status check on market hours change
            fetchSubscriptions();
            initPolling(); // Restart polling with new market hours state
        }
    });
};

// Hook to use WebSocket state
export const useWebSocket = () => {
    const [state, setLocalState] = useState(globalState);

    useEffect(() => {
        // Subscribe to global state changes
        const handleStateChange = (newState) => {
            setLocalState(newState);
        };
        subscribers.add(handleStateChange);

        // Initialize market hours subscription
        const unsubscribe = initMarketHoursSubscription();

        // Initialize polling
        const interval = initPolling();

        return () => {
            subscribers.delete(handleStateChange);
            unsubscribe();
            if (interval) {
                clearInterval(interval);
                setState({ pollingInterval: null });
            }
        };
    }, []);

    return {
        ...state,
        handleConnectWebhook,
        handleDisconnectWebhook,
        fetchStatus,
        fetchSubscriptions,
        setIsPolling: (isPolling) => {
            setState({ isPolling });
            if (isPolling && globalState.isMarketOpen) {
                initPolling(); // Restart polling when isPolling changes
            } else if (!isPolling && globalState.pollingInterval) {
                clearInterval(globalState.pollingInterval);
                setState({ pollingInterval: null });
            }
        }
    };
}; 