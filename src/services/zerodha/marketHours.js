import { isMarketHours } from './utils';

class MarketHoursService {
    constructor() {
        this.pollingInterval = null;
        this.subscribers = new Set();
        this.isPolling = false;
    }

    startPolling(interval = 2000) { // Default to 1 minute
        if (this.isPolling) return;

        this.isPolling = true;
        this.pollingInterval = setInterval(async () => {
            try {
                const marketHours = isMarketHours();
                this.notifySubscribers(marketHours);
            } catch (error) {
                console.error('Error polling market hours:', error);
            }
        }, interval);

        // Initial poll
        this.poll();
    }

    stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
        this.isPolling = false;
    }

    async poll() {
        try {
            const marketHours = isMarketHours();
            this.notifySubscribers(marketHours);
        } catch (error) {
            console.error('Error polling market hours:', error);
        }
    }

    subscribe(callback) {
        this.subscribers.add(callback);
        return () => this.subscribers.delete(callback);
    }

    notifySubscribers(marketHours) {
        this.subscribers.forEach(callback => callback(marketHours));
    }
}

// Create a singleton instance
const marketHoursService = new MarketHoursService();

export default marketHoursService; 