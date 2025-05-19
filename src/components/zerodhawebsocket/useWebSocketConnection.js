import { useState, useEffect } from 'react';
import { getWebSocketStatus, subscribeToTokens, disconnectWebSocket, getWebSocketSubscriptions } from '../../services/zerodha/webhook';
import marketHoursService from '../../services/zerodha/marketHours';

export const useWebSocketConnection = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [webhookStatus, setWebhookStatus] = useState({ tickerConnected: false, loading: false });
    const [statusLoading, setStatusLoading] = useState(false);
    const [isMarketOpen, setIsMarketOpen] = useState(false);
    const [isPolling, setIsPolling] = useState(true);
    const [subscribedTokens, setSubscribed] = useState([]);

    // Poll status every 2 seconds during market hours
    const fetchStatus = async () => {
        setStatusLoading(true);
        try {
            const res = await getWebSocketStatus();
            setWebhookStatus({ tickerConnected: res.tickerConnected, loading: false });
            setIsConnected(res.tickerConnected);
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
            setTimeout(fetchStatus, 1000);
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
            setTimeout(fetchStatus, 1000);
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
                fetchStatus();
                fetchSubscriptions();
            }
        });

        return () => unsubscribe();
    }, [isConnected, isPolling]);

    // Poll for status during market hours
    useEffect(() => {
        if (isPolling && isMarketOpen) {
            const interval = setInterval(() => {
                fetchStatus();
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