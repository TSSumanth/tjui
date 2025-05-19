import { useState, useEffect, useRef } from 'react';
import { getWebSocketStatus, subscribeToTokens, disconnectWebSocket, getWebSocketSubscriptions } from '../../services/zerodha/webhook';
import marketHoursService from '../../services/zerodha/marketHours';

export const useWebSocketConnection = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [webhookStatus, setWebhookStatus] = useState({ tickerConnected: false, loading: false });
    const [statusLoading, setStatusLoading] = useState(false);
    const [isMarketOpen, setIsMarketOpen] = useState(false);
    const [isPolling, setIsPolling] = useState(true);
    const [subscribedTokens, setSubscribed] = useState([]);
    const lastStatusCheck = useRef(0);
    const STATUS_CHECK_INTERVAL = 30000; // Check status every 30 seconds

    // Poll status with throttling
    const fetchStatus = async (force = false) => {
        const now = Date.now();
        if (!force && now - lastStatusCheck.current < STATUS_CHECK_INTERVAL) {
            return; // Skip if last check was less than 30 seconds ago
        }

        setStatusLoading(true);
        try {
            const res = await getWebSocketStatus();
            setWebhookStatus({ tickerConnected: res.tickerConnected, loading: false });
            setIsConnected(res.tickerConnected);
            lastStatusCheck.current = now;
        } catch {
            setWebhookStatus({ tickerConnected: false, loading: false });
            setIsConnected(false);
        } finally {
            setStatusLoading(false);
        }
    };

    const fetchSubscriptions = async () => {
        try {
            const res = await getWebSocketSubscriptions();
            setSubscribed(res.data || []);
        } catch (err) {
            console.error('Failed to fetch subscriptions:', err);
        }
    };

    // Connect to Webhook
    const handleConnectWebhook = async () => {
        setWebhookStatus(ws => ({ ...ws, loading: true }));
        try {
            await subscribeToTokens([]);
            setIsConnected(true);
            fetchStatus(true); // Force status check after connect
        } catch {
            setIsConnected(false);
        } finally {
            setWebhookStatus(ws => ({ ...ws, loading: false }));
        }
    };

    // Disconnect Webhook
    const handleDisconnectWebhook = async () => {
        setWebhookStatus(ws => ({ ...ws, loading: true }));
        try {
            await disconnectWebSocket();
            setIsConnected(false);
            fetchStatus(true); // Force status check after disconnect
            return true;
        } catch {
            return false;
        } finally {
            setWebhookStatus(ws => ({ ...ws, loading: false }));
        }
    };

    // Subscribe to market hours updates
    useEffect(() => {
        const unsubscribe = marketHoursService.subscribe((marketHours) => {
            setIsMarketOpen(marketHours);

            // Handle WebSocket connection based on market hours
            if (marketHours && !isConnected) {
                handleConnectWebhook();
            } else if (!marketHours && isConnected) {
                handleDisconnectWebhook();
            }

            // Fetch status when market hours change
            if (isPolling) {
                fetchStatus(true); // Force status check on market hours change
                fetchSubscriptions();
            }
        });

        return () => unsubscribe();
    }, [isConnected, isPolling]);

    // Poll for status and subscriptions during market hours
    useEffect(() => {
        if (isPolling && isMarketOpen) {
            const interval = setInterval(() => {
                fetchStatus(); // Will be throttled internally
                fetchSubscriptions();
            }, 2000);
            return () => clearInterval(interval);
        }
    }, [isPolling, isMarketOpen]);

    return {
        isConnected,
        webhookStatus,
        statusLoading,
        isMarketOpen,
        isPolling,
        setIsPolling,
        handleConnectWebhook,
        handleDisconnectWebhook,
        fetchStatus,
        subscribedTokens,
        fetchSubscriptions
    };
}; 