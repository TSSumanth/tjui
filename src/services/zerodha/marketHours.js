import { isMarketHours } from './utils';

class MarketHoursService {
    constructor() {
        this.pollingInterval = null;
        this.subscribers = new Set();
        this.isPolling = false;
        this.lastMarketHours = null;
    }

    startPolling(interval = 2000) {
        if (this.isPolling) {
            console.log('Market hours polling already running');
            return;
        }

        console.log('Starting market hours polling');
        this.isPolling = true;

        // Initial poll
        this.poll();

        this.pollingInterval = setInterval(async () => {
            try {
                const marketHours = isMarketHours();
                // Only notify if market hours state has changed
                if (this.lastMarketHours !== marketHours) {
                    console.log('Market hours changed:', marketHours);
                    this.lastMarketHours = marketHours;
                    this.notifySubscribers(marketHours);
                }
            } catch (error) {
                console.error('Error polling market hours:', error);
                // Notify subscribers of error state
                this.notifySubscribers(false);
            }
        }, interval);
    }

    stopPolling() {
        if (this.pollingInterval) {
            console.log('Stopping market hours polling');
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
        this.isPolling = false;
        this.lastMarketHours = null;
    }

    async poll() {
        try {
            const marketHours = isMarketHours();
            if (this.lastMarketHours !== marketHours) {
                console.log('Market hours polled:', marketHours);
                this.lastMarketHours = marketHours;
                this.notifySubscribers(marketHours);
            }
        } catch (error) {
            console.error('Error polling market hours:', error);
            this.notifySubscribers(false);
        }
    }

    subscribe(callback) {
        this.subscribers.add(callback);
        // Immediately notify new subscriber of current state
        if (this.lastMarketHours !== null) {
            callback(this.lastMarketHours);
        }
        return () => this.subscribers.delete(callback);
    }

    notifySubscribers(marketHours) {
        this.subscribers.forEach(callback => {
            try {
                callback(marketHours);
            } catch (error) {
                console.error('Error in market hours subscriber:', error);
            }
        });
    }

    getCurrentMarketHours() {
        return this.lastMarketHours;
    }
}

// Create a singleton instance
const marketHoursService = new MarketHoursService();

export default marketHoursService; 