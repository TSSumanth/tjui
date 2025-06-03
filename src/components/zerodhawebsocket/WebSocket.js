import { getWebSocketStatus, subscribeToTokens, disconnectWebSocket, getWebSocketSubscriptions } from '../../services/zerodha/webhook';
import { isMarketHours } from '../../services/zerodha/utils';

class ZerodhaWebSocket {
    constructor() {
        if (ZerodhaWebSocket.instance) {
            return ZerodhaWebSocket.instance;
        }
        ZerodhaWebSocket.instance = this;

        this.subscriptions = null;
        this.isFetching = false;

        // Start fetching automatically when instantiated
        this.startFetching();
    }

    async fetchSubscriptions() {
        if (this.isFetching) return;

        try {
            this.isFetching = true;
            const isMarketOpen = isMarketHours();

            if (isMarketOpen) {
                const res = await getWebSocketSubscriptions();
                this.subscriptions = res.data;
            } else {
                this.subscriptions = null;
            }
        } catch (err) {
            console.error('Failed to fetch subscriptions:', err);
            this.subscriptions = null;
        } finally {
            this.isFetching = false;
        }
    }

    startFetching() {
        // Initial fetch
        this.fetchSubscriptions();

        // Set up interval for every 5 seconds
        setInterval(() => {
            this.fetchSubscriptions();
        }, 5000);
    }

    // Getter to access subscriptions
    getSubscriptions() {
        return this.subscriptions;
    }
}

// Create and export a single instance
const zerodhaWebSocket = new ZerodhaWebSocket();
export default zerodhaWebSocket;
