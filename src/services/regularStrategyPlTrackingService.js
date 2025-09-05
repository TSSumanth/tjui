import { saveStrategyPlHistory } from './strategyPlHistory';
import { isMarketOpen } from './zerodha/utils';

class RegularStrategyPlTrackingService {
  constructor() {
    this.intervals = {}; // Stores interval IDs for each strategy
    this.strategyData = {}; // Stores latest strategy data
  }

  // Start tracking P/L for a regular strategy
  startTracking(strategyId, strategy) {
    if (this.intervals[strategyId]) {
      console.log(`[REGULAR STRATEGY ${strategyId}] P/L tracking already active`);
      return;
    }

    this.strategyData[strategyId] = { strategy };

    // Track immediately and then every 5 minutes
    this.calculateAndSavePl(strategyId);
    this.intervals[strategyId] = setInterval(() => this.calculateAndSavePl(strategyId), 5 * 60 * 1000); // 5 minutes
    console.log(`[REGULAR STRATEGY ${strategyId}] Started P/L tracking - will track every 5 minutes`);
  }

  // Stop tracking P/L for a strategy
  stopTracking(strategyId) {
    if (this.intervals[strategyId]) {
      clearInterval(this.intervals[strategyId]);
      delete this.intervals[strategyId];
      delete this.strategyData[strategyId];
      console.log(`Stopped P/L tracking for regular strategy ${strategyId}`);
    }
  }

  // Update strategy data
  updateStrategyData(strategyId, strategy) {
    if (this.strategyData[strategyId]) {
      this.strategyData[strategyId].strategy = strategy;
      console.log(`Updated strategy data for regular strategy ${strategyId}`);
    }
  }

  // Calculate P/L and save to database
  async calculateAndSavePl(strategyId) {
    try {
      const trackingData = this.strategyData[strategyId];
      if (!trackingData) {
        console.log(`No tracking data found for regular strategy ${strategyId}`);
        return;
      }

      const { strategy } = trackingData;
      
      if (!strategy) {
        console.log(`Invalid strategy data for regular strategy ${strategyId}`);
        return;
      }

      // Check if market is open
      const marketHours = isMarketOpen();
      console.log(`[REGULAR STRATEGY ${strategyId}] Market hours check:`, marketHours, 'Current time:', new Date().toLocaleString());

      // Temporarily disabled for testing - always save P/L data
      // if (!marketHours) {
      //   console.log(`[REGULAR STRATEGY ${strategyId}] Market is closed - skipping P/L save`);
      //   return;
      // }

      // Calculate total P/L from strategy data (Realized + Unrealized - Expenses)
      const realizedPl = parseFloat(strategy.realized_pl || 0);
      const unrealizedPl = parseFloat(strategy.unrealized_pl || 0);
      const expenses = parseFloat(strategy.expenses || 0);
      const totalPl = realizedPl + unrealizedPl - expenses;
      const totalPlMp = totalPl; // Same as totalPl for regular strategies
      const marketPrice = parseFloat(strategy.symbol_ltp || 0);

      console.log(`[REGULAR STRATEGY ${strategyId}] P/L Calculation:`, {
        realizedPl,
        unrealizedPl,
        expenses,
        totalPl,
        marketPrice
      });

      // Save to database
      const plData = {
        strategyId: parseInt(strategyId),
        strategyType: 'regular',
        totalPl: totalPl,
        totalPlMp: totalPlMp,
        marketPrice: marketPrice,
        marketHours: marketHours
      };

      await saveStrategyPlHistory(plData);
      
      console.log(`[REGULAR STRATEGY ${strategyId}] P/L saved: Total=${totalPl.toFixed(2)} (Realized=${realizedPl.toFixed(2)} + Unrealized=${unrealizedPl.toFixed(2)} - Expenses=${expenses.toFixed(2)})`);
      
    } catch (error) {
      console.error(`Error calculating and saving P/L for regular strategy ${strategyId}:`, error);
    }
  }

  // Force save P/L for all tracking strategies
  async forceSaveAllPl() {
    console.log('Force saving P/L for all tracking regular strategies...');
    
    const promises = Object.keys(this.intervals).map(strategyId => 
      this.calculateAndSavePl(strategyId)
    );

    await Promise.all(promises);
    console.log('Force save completed for all regular strategies');
  }

  // Get tracking status
  getTrackingStatus() {
    return {
      activeStrategies: Object.keys(this.intervals),
      totalCount: Object.keys(this.intervals).length
    };
  }

  // Stop all tracking
  stopAllTracking() {
    Object.keys(this.intervals).forEach(strategyId => {
      this.stopTracking(strategyId);
    });
    console.log('Stopped all regular strategy P/L tracking');
  }
}

// Create and export a single instance
const regularStrategyPlTrackingService = new RegularStrategyPlTrackingService();
export default regularStrategyPlTrackingService;
