import { saveStrategyPlHistory } from './strategyPlHistory';
import { isMarketOpen } from './zerodha/utils';

class PlTrackingService {
  constructor() {
    if (PlTrackingService.instance) {
      return PlTrackingService.instance;
    }
    
    PlTrackingService.instance = this;
    this.trackingStrategies = new Map(); // strategyId -> tracking data
    this.intervals = new Map(); // strategyId -> intervalId
    this.isTracking = false;
    
    console.log('PlTrackingService instantiated');
  }

  // Start tracking P/L for a strategy
  startTracking(strategyId, strategyData, zerodhaWebSocketData) {
    if (this.trackingStrategies.has(strategyId)) {
      console.log(`[ALGO STRATEGY ${strategyId}] P/L tracking already active`);
      return;
    }

    console.log(`[ALGO STRATEGY ${strategyId}] Starting P/L tracking - will track every 5 minutes`);
    console.log(`[ALGO STRATEGY ${strategyId}] Strategy data:`, {
      status: strategyData?.status,
      hasInstruments: !!strategyData?.instruments_details,
      instrumentsCount: strategyData?.instruments_details?.length || 0,
      hasWebSocketData: !!zerodhaWebSocketData
    });
    
    // Store strategy data and WebSocket data
    this.trackingStrategies.set(strategyId, {
      strategyData,
      zerodhaWebSocketData,
      lastUpdate: Date.now()
    });

    // Calculate initial P/L and save it
    this.calculateAndSavePl(strategyId);

    // Set up 5-minute interval (300000ms)
    const intervalId = setInterval(() => {
      this.calculateAndSavePl(strategyId);
    }, 300000); // 5 minutes

    this.intervals.set(strategyId, intervalId);
    this.isTracking = true;

    console.log(`P/L tracking started for strategy ${strategyId} with 5-minute intervals`);
  }

  // Stop tracking P/L for a strategy
  stopTracking(strategyId) {
    if (!this.trackingStrategies.has(strategyId)) {
      console.log(`No tracking found for strategy ${strategyId}`);
      return;
    }

    console.log(`Stopping P/L tracking for strategy ${strategyId}`);
    
    // Clear interval
    const intervalId = this.intervals.get(strategyId);
    if (intervalId) {
      clearInterval(intervalId);
      this.intervals.delete(strategyId);
    }

    // Remove from tracking
    this.trackingStrategies.delete(strategyId);

    // Update tracking status
    this.isTracking = this.trackingStrategies.size > 0;

    console.log(`P/L tracking stopped for strategy ${strategyId}`);
  }

  // Update strategy data and WebSocket data for tracking
  updateStrategyData(strategyId, strategyData, zerodhaWebSocketData) {
    if (!this.trackingStrategies.has(strategyId)) {
      return;
    }

    this.trackingStrategies.set(strategyId, {
      strategyData,
      zerodhaWebSocketData,
      lastUpdate: Date.now()
    });
  }

  // Calculate P/L and save to database
  async calculateAndSavePl(strategyId) {
    try {
      console.log(`[ALGO STRATEGY ${strategyId}] Starting P/L calculation...`);
      
      const trackingData = this.trackingStrategies.get(strategyId);
      if (!trackingData) {
        console.log(`[ALGO STRATEGY ${strategyId}] No tracking data found`);
        return;
      }

      const { strategyData, zerodhaWebSocketData } = trackingData;
      console.log(`[ALGO STRATEGY ${strategyId}] Tracking data found:`, {
        hasStrategyData: !!strategyData,
        hasWebSocketData: !!zerodhaWebSocketData,
        instrumentsCount: strategyData?.instruments_details?.length || 0
      });
      
      if (!strategyData || !strategyData.instruments_details || !Array.isArray(strategyData.instruments_details)) {
        console.log(`Invalid strategy data for strategy ${strategyId}`);
        return;
      }

      // Calculate total P/L using LTP
      const totalPl = strategyData.instruments_details.reduce((total, inst) => {
        const ltp = zerodhaWebSocketData?.[inst.instrument_token]?.ltp;
        const price = inst.price;
        if (!ltp || !price) {
          console.log(`[ALGO STRATEGY ${strategyId}] Missing data for instrument ${inst.instrument_token}:`, { ltp, price });
          return total;
        }

        const pl = inst.quantity > 0
          ? (ltp - price) * inst.quantity
          : (ltp - price) * inst.quantity;

        console.log(`[ALGO STRATEGY ${strategyId}] Instrument ${inst.instrument_token} P/L:`, { ltp, price, quantity: inst.quantity, pl });
        return total + pl;
      }, 0);

      // Calculate total P/L using market price (bid/ask)
      const totalPlMp = strategyData.instruments_details.reduce((total, inst) => {
        const askPrice = zerodhaWebSocketData?.[inst.instrument_token]?.tick_current_ask_price;
        const bidPrice = zerodhaWebSocketData?.[inst.instrument_token]?.tick_current_bid_price;
        const price = inst.price;

        if (!askPrice || !bidPrice || !price) return total;

        const pl = inst.quantity > 0
          ? (bidPrice - price) * inst.quantity
          : (askPrice - price) * inst.quantity;

        return total + pl;
      }, 0);

      // Get market price (use LTP as fallback)
      const marketPrice = strategyData.instruments_details.length > 0 
        ? zerodhaWebSocketData?.[strategyData.instruments_details[0].instrument_token]?.ltp 
        : null;

      // Check if market is open
      const marketHours = isMarketOpen();
      console.log(`[ALGO STRATEGY ${strategyId}] Market hours check:`, marketHours, 'Current time:', new Date().toLocaleString());

      // Only save P/L data during market hours
      if (!marketHours) {
        console.log(`[ALGO STRATEGY ${strategyId}] Market is closed - skipping P/L save`);
        return;
      }

      // Save to database
      const plData = {
        strategyId: parseInt(strategyId),
        strategyType: 'algo',
        totalPl: totalPl,
        totalPlMp: totalPlMp,
        marketPrice: marketPrice,
        marketHours: marketHours
      };

      console.log(`[ALGO STRATEGY ${strategyId}] Final P/L calculation:`, {
        totalPl: totalPl.toFixed(2),
        totalPlMp: totalPlMp.toFixed(2),
        marketPrice: marketPrice,
        instrumentsCount: strategyData.instruments_details.length
      });
      
      console.log(`[ALGO STRATEGY ${strategyId}] Attempting to save P/L data:`, plData);
      
      const saveResult = await saveStrategyPlHistory(plData);
      console.log(`[ALGO STRATEGY ${strategyId}] Save result:`, saveResult);
      
      console.log(`[ALGO STRATEGY ${strategyId}] P/L saved successfully: LTP=${totalPl.toFixed(2)}, MP=${totalPlMp.toFixed(2)} (Market Hours)`);
      
    } catch (error) {
      console.error(`Error calculating and saving P/L for strategy ${strategyId}:`, error);
    }
  }

  // Get tracking status
  getTrackingStatus() {
    return {
      isTracking: this.isTracking,
      trackingStrategies: Array.from(this.trackingStrategies.keys()),
      totalStrategies: this.trackingStrategies.size
    };
  }

  // Debug function to check tracking status
  debugTrackingStatus() {
    console.log('=== ALGO P/L TRACKING DEBUG ===');
    console.log('Is tracking active:', this.isTracking);
    console.log('Number of strategies being tracked:', this.trackingStrategies.size);
    console.log('Strategy IDs being tracked:', Array.from(this.trackingStrategies.keys()));
    
    this.trackingStrategies.forEach((data, strategyId) => {
      console.log(`Strategy ${strategyId}:`, {
        status: data.strategyData?.status,
        hasInstruments: !!data.strategyData?.instruments_details,
        instrumentsCount: data.strategyData?.instruments_details?.length || 0,
        hasWebSocketData: !!data.zerodhaWebSocketData,
        lastUpdate: new Date(data.lastUpdate).toLocaleString()
      });
    });
    console.log('=== END DEBUG ===');
  }

  // Stop all tracking
  stopAllTracking() {
    console.log('Stopping all P/L tracking...');
    
    // Clear all intervals
    this.intervals.forEach((intervalId, strategyId) => {
      clearInterval(intervalId);
      console.log(`Stopped tracking for strategy ${strategyId}`);
    });

    // Clear all data
    this.intervals.clear();
    this.trackingStrategies.clear();
    this.isTracking = false;

    console.log('All P/L tracking stopped');
  }

  // Force save P/L for all tracking strategies
  async forceSaveAllPl() {
    console.log('Force saving P/L for all tracking strategies...');
    
    const promises = Array.from(this.trackingStrategies.keys()).map(strategyId => 
      this.calculateAndSavePl(strategyId)
    );

    await Promise.all(promises);
    console.log('Force save completed for all strategies');
  }
}

// Create and export a single instance
const plTrackingService = new PlTrackingService();

// Make debug function available globally for debugging
if (typeof window !== 'undefined') {
  try {
    window.debugAlgoPlTracking = () => {
      console.log('=== DEBUG FUNCTION CALLED ===');
      plTrackingService.debugTrackingStatus();
    };
    window.plTrackingService = plTrackingService; // Also expose the service itself
    window.getAlgoTrackingStatus = () => plTrackingService.getTrackingStatus();
    console.log('Algo P/L tracking debug functions available:');
    console.log('- debugAlgoPlTracking() - Check tracking status');
    console.log('- plTrackingService - Access the service directly');
    console.log('- getAlgoTrackingStatus() - Get simple tracking status');
    console.log('Functions registered successfully:', {
      debugAlgoPlTracking: typeof window.debugAlgoPlTracking,
      plTrackingService: typeof window.plTrackingService,
      getAlgoTrackingStatus: typeof window.getAlgoTrackingStatus
    });
  } catch (error) {
    console.error('Error registering debug functions:', error);
  }
}

export default plTrackingService;
