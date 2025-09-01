/**
 * Utility functions for calculating strike prices for options trading
 */

/**
 * Calculates the nearest strike price for Nifty options
 * Nifty strikes are typically available in increments of 50
 * 
 * @param {number} currentPrice - Current market price (e.g., 24426)
 * @param {number} strikeIncrement - Strike price increment (default: 50 for Nifty)
 * @returns {number} Nearest available strike price
 * 
 * @example
 * getNearestStrike(24426) // returns 24450
 * getNearestStrike(24476) // returns 24500
 * getNearestStrike(24410) // returns 24400
 * getNearestStrike(24460) // returns 24450
 */
export const getNearestStrike = (currentPrice, strikeIncrement = 50) => {
    if (typeof currentPrice !== 'number' || currentPrice <= 0) {
        throw new Error('Current price must be a positive number');
    }
    
    if (typeof strikeIncrement !== 'number' || strikeIncrement <= 0) {
        throw new Error('Strike increment must be a positive number');
    }
    
    // Round to the nearest strike increment
    return Math.round(currentPrice / strikeIncrement) * strikeIncrement;
};

/**
 * Gets the nearest ATM (At-The-Money) strike price
 * This is the strike closest to the current market price
 * 
 * @param {number} currentPrice - Current market price
 * @param {number} strikeIncrement - Strike price increment (default: 50 for Nifty)
 * @returns {number} ATM strike price
 */
export const getATMStrike = (currentPrice, strikeIncrement = 50) => {
    return getNearestStrike(currentPrice, strikeIncrement);
};

/**
 * Gets the nearest ITM (In-The-Money) strike price for calls
 * For calls, ITM strikes are below the current price
 * 
 * @param {number} currentPrice - Current market price
 * @param {number} strikeIncrement - Strike price increment (default: 50 for Nifty)
 * @returns {number} Nearest ITM strike for calls
 */
export const getNearestITMStrikeForCalls = (currentPrice, strikeIncrement = 50) => {
    const atmStrike = getNearestStrike(currentPrice, strikeIncrement);
    
    // If current price is exactly at a strike, go one strike below
    if (Math.abs(currentPrice - atmStrike) < 1) {
        return atmStrike - strikeIncrement;
    }
    
    // If current price is above ATM strike, ATM strike is ITM
    // If current price is below ATM strike, go one strike below ATM
    return currentPrice >= atmStrike ? atmStrike : atmStrike - strikeIncrement;
};

/**
 * Gets the nearest ITM (In-The-Money) strike price for puts
 * For puts, ITM strikes are above the current price
 * 
 * @param {number} currentPrice - Current market price
 * @param {number} strikeIncrement - Strike price increment (default: 50 for Nifty)
 * @returns {number} Nearest ITM strike for puts
 */
export const getNearestITMStrikeForPuts = (currentPrice, strikeIncrement = 50) => {
    const atmStrike = getNearestStrike(currentPrice, strikeIncrement);
    
    // If current price is exactly at a strike, go one strike above
    if (Math.abs(currentPrice - atmStrike) < 1) {
        return atmStrike + strikeIncrement;
    }
    
    // If current price is below ATM strike, ATM strike is ITM
    // If current price is above ATM strike, go one strike above ATM
    return currentPrice <= atmStrike ? atmStrike : atmStrike + strikeIncrement;
};

/**
 * Gets the nearest OTM (Out-of-The-Money) strike price for calls
 * For calls, OTM strikes are above the current price
 * 
 * @param {number} currentPrice - Current market price
 * @param {number} strikeIncrement - Strike price increment (default: 50 for Nifty)
 * @returns {number} Nearest OTM strike for calls
 */
export const getNearestOTMStrikeForCalls = (currentPrice, strikeIncrement = 50) => {
    const atmStrike = getNearestStrike(currentPrice, strikeIncrement);
    
    // If current price is exactly at a strike, go one strike above
    if (Math.abs(currentPrice - atmStrike) < 1) {
        return atmStrike + strikeIncrement;
    }
    
    // If current price is below ATM strike, ATM strike is OTM
    // If current price is above ATM strike, go one strike above ATM
    return currentPrice <= atmStrike ? atmStrike : atmStrike + strikeIncrement;
};

/**
 * Gets the nearest OTM (Out-of-The-Money) strike price for puts
 * For puts, OTM strikes are below the current price
 * 
 * @param {number} currentPrice - Current market price
 * @param {number} strikeIncrement - Strike price increment (default: 50 for Nifty)
 * @returns {number} Nearest OTM strike for puts
 */
export const getNearestOTMStrikeForPuts = (currentPrice, strikeIncrement = 50) => {
    const atmStrike = getNearestStrike(currentPrice, strikeIncrement);
    
    // If current price is exactly at a strike, go one strike below
    if (Math.abs(currentPrice - atmStrike) < 1) {
        return atmStrike - strikeIncrement;
    }
    
    // If current price is above ATM strike, ATM strike is OTM
    // If current price is below ATM strike, go one strike below ATM
    return currentPrice >= atmStrike ? atmStrike : atmStrike - strikeIncrement;
};

/**
 * Gets a range of strike prices around the current price
 * Useful for strategies like Iron Condor, Butterfly, etc.
 * 
 * @param {number} currentPrice - Current market price
 * @param {number} strikesBelow - Number of strikes below current price
 * @param {number} strikesAbove - Number of strikes above current price
 * @param {number} strikeIncrement - Strike price increment (default: 50 for Nifty)
 * @returns {Object} Object containing strikes below, ATM, and above
 */
export const getStrikeRange = (currentPrice, strikesBelow = 2, strikesAbove = 2, strikeIncrement = 50) => {
    const atmStrike = getNearestStrike(currentPrice, strikeIncrement);
    
    const strikes = {
        below: [],
        atm: atmStrike,
        above: []
    };
    
    // Generate strikes below ATM
    for (let i = 1; i <= strikesBelow; i++) {
        strikes.below.push(atmStrike - (i * strikeIncrement));
    }
    
    // Generate strikes above ATM
    for (let i = 1; i <= strikesAbove; i++) {
        strikes.above.push(atmStrike + (i * strikeIncrement));
    }
    
    return strikes;
};

/**
 * Validates if a given price is a valid strike price
 * 
 * @param {number} price - Price to validate
 * @param {number} strikeIncrement - Strike price increment (default: 50 for Nifty)
 * @returns {boolean} True if price is a valid strike
 */
export const isValidStrike = (price, strikeIncrement = 50) => {
    if (typeof price !== 'number' || price <= 0) {
        return false;
    }
    
    // Check if price is divisible by strike increment
    return price % strikeIncrement === 0;
};

/**
 * Gets the next available strike price above the current price
 * 
 * @param {number} currentPrice - Current market price
 * @param {number} strikeIncrement - Strike price increment (default: 50 for Nifty)
 * @returns {number} Next strike price above current price
 */
export const getNextStrikeAbove = (currentPrice, strikeIncrement = 50) => {
    const atmStrike = getNearestStrike(currentPrice, strikeIncrement);
    
    // If current price is at or above ATM strike, go one above ATM
    if (currentPrice >= atmStrike) {
        return atmStrike + strikeIncrement;
    }
    
    // If current price is below ATM strike, ATM strike is the next above
    return atmStrike;
};

/**
 * Gets the next available strike price below the current price
 * 
 * @param {number} currentPrice - Current market price
 * @param {number} strikeIncrement - Strike price increment (default: 50 for Nifty)
 * @returns {number} Next strike price below current price
 */
export const getNextStrikeBelow = (currentPrice, strikeIncrement = 50) => {
    const atmStrike = getNearestStrike(currentPrice, strikeIncrement);
    
    // If current price is at or below ATM strike, go one below ATM
    if (currentPrice <= atmStrike) {
        return atmStrike - strikeIncrement;
    }
    
    // If current price is above ATM strike, ATM strike is the next below
    return atmStrike;
};

/**
 * Calculate intrinsic value for options
 * @param {number} strike - Strike price of the option
 * @param {string} optionType - Option type ('PE' or 'CE')
 * @param {number} currentPrice - Current market price (Nifty CMP)
 * @returns {number|null} Intrinsic value or null if invalid
 */
export const calculateIntrinsicValue = (strike, optionType, currentPrice) => {
    if (typeof strike !== 'number' || typeof currentPrice !== 'number' || isNaN(strike) || isNaN(currentPrice)) {
        return null;
    }

    if (optionType === 'PE') {
        // For Put options: Intrinsic Value = Strike - CMP (if Strike > CMP)
        return strike > currentPrice ? strike - currentPrice : 0;
    } else if (optionType === 'CE') {
        // For Call options: Intrinsic Value = CMP - Strike (if CMP > Strike)
        return currentPrice > strike ? currentPrice - strike : 0;
    }
    return 0;
};

/**
 * Check if an option is undervalued
 * @param {number} strike - Strike price of the option
 * @param {string} optionType - Option type ('PE' or 'CE')
 * @param {number} currentPrice - Current market price (Nifty CMP)
 * @param {number} ltp - Last traded price of the option
 * @returns {boolean} True if option is undervalued
 */
export const isOptionUndervalued = (strike, optionType, currentPrice, ltp) => {
    if (typeof ltp !== 'number' || isNaN(ltp)) return false;
    
    const intrinsicValue = calculateIntrinsicValue(strike, optionType, currentPrice);
    if (intrinsicValue === null) return false;
    
    // Option is undervalued if LTP < Intrinsic Value
    return ltp < intrinsicValue;
};

/**
 * Calculate discount percentage for undervalued options
 * @param {number} strike - Strike price of the option
 * @param {string} optionType - Option type ('PE' or 'CE')
 * @param {number} currentPrice - Current market price (Nifty CMP)
 * @param {number} ltp - Last traded price of the option
 * @returns {number|null} Discount percentage or null if not undervalued
 */
export const getDiscountPercentage = (strike, optionType, currentPrice, ltp) => {
    if (typeof ltp !== 'number' || isNaN(ltp)) return null;
    
    const intrinsicValue = calculateIntrinsicValue(strike, optionType, currentPrice);
    if (intrinsicValue === null || intrinsicValue === 0) return null;
    
    // Calculate discount percentage
    const discount = ((intrinsicValue - ltp) / intrinsicValue) * 100;
    return discount > 0 ? discount : null;
};

/**
 * Calculate net premium for a spread strategy
 * @param {number} buyPremium - Premium paid for buying option
 * @param {number} sellPremium - Premium received from selling option
 * @param {number} lotSize - Lot size for the option (default: 50 for Nifty)
 * @returns {number|null} Net premium or null if invalid
 */
export const calculateNetPremium = (buyPremium, sellPremium, lotSize = 50) => {
    if (typeof buyPremium !== 'number' || typeof sellPremium !== 'number' || 
        isNaN(buyPremium) || isNaN(sellPremium)) {
        return null;
    }
    
    if (typeof lotSize !== 'number' || lotSize <= 0) {
        return null;
    }
    
    // Net Premium = (SELL Premium - BUY Premium) × Lot Size
    return (sellPremium - buyPremium) * lotSize;
};

/**
 * Calculate maximum risk for an options spread strategy
 * @param {number} buyStrike - Strike price of bought option
 * @param {number} sellStrike - Strike price of sold option
 * @param {number} buyPremium - Premium paid for buying option
 * @param {number} sellPremium - Premium received from selling option
 * @param {number} lotSize - Lot size for the option (default: 50 for Nifty)
 * @returns {number} Maximum risk considering premiums and lot size
 */
export const calculateMaxRisk = (buyStrike, sellStrike, buyPremium, sellPremium, lotSize = 50) => {
    if (typeof buyStrike !== 'number' || typeof sellStrike !== 'number' || 
        isNaN(buyStrike) || isNaN(sellStrike)) {
        return 0;
    }
    
    if (typeof buyPremium !== 'number' || typeof sellPremium !== 'number' || 
        isNaN(buyPremium) || isNaN(sellPremium)) {
        return 0;
    }
    
    if (typeof lotSize !== 'number' || lotSize <= 0) {
        return 0;
    }
    
    // Max Risk occurs when options expire exactly at the buy strike price
    // At expiration:
    // - BUY option value = 0 (out of the money)
    // - SELL option value = Intrinsic value - premium collected
    // - Net loss = (0 - buyPremium) + (sellPremium - intrinsicValue)
    
    // Calculate intrinsic value at buy strike
    let intrinsicValueAtBuyStrike;
    if (buyStrike < sellStrike) {
        // For Bull Put Spread: SELL is ITM at buy strike, intrinsic value = sellStrike - buyStrike
        intrinsicValueAtBuyStrike = sellStrike - buyStrike;
    } else {
        // For Bear Call Spread: SELL is ITM at buy strike, intrinsic value = buyStrike - sellStrike
        intrinsicValueAtBuyStrike = buyStrike - sellStrike;
    }
    
    // Max Risk = (Buy Premium Paid) + (Intrinsic Value at Buy Strike - Sell Premium Collected)
    const maxRisk = (buyPremium + (intrinsicValueAtBuyStrike - sellPremium)) * lotSize;
    
    return Math.max(0, maxRisk); // Risk cannot be negative
};

/**
 * Calculate profit potential for a spread strategy
 * @param {number} buyPremium - Premium paid for buying option
 * @param {number} sellPremium - Premium received from selling option
 * @param {number} lotSize - Lot size for the option (default: 50 for Nifty)
 * @returns {number|null} Profit potential or null if invalid
 */
export const calculateProfitPotential = (buyPremium, sellPremium, lotSize = 50) => {
    if (typeof buyPremium !== 'number' || typeof sellPremium !== 'number' || 
        isNaN(buyPremium) || isNaN(sellPremium)) {
        return null;
    }
    
    if (typeof lotSize !== 'number' || lotSize <= 0) {
        return null;
    }
    
    // Best case scenario: Both options expire worthless (price = 0)
    // In this case, we keep the sell premium and lose the buy premium
    // Profit = Sell Premium - Buy Premium
    const profitPerShare = sellPremium - buyPremium;
    const profitPotential = profitPerShare * lotSize;
    
    return profitPotential; // Can be positive (profit) or negative (loss)
};

/**
 * Get strike type classification (ATM/ITM/OTM)
 * @param {number} strike - Strike price of the option
 * @param {string} optionType - Option type ('PE' or 'CE')
 * @param {number} currentPrice - Current market price (Nifty CMP)
 * @returns {string} Strike type classification
 */
export const getStrikeType = (strike, optionType, currentPrice) => {
    if (typeof strike !== 'number' || typeof currentPrice !== 'number' || 
        isNaN(strike) || isNaN(currentPrice)) {
        return 'Unknown';
    }
    
    if (optionType === 'PE') {
        return strike > currentPrice ? 'ITM' : strike < currentPrice ? 'OTM' : 'ATM';
    } else if (optionType === 'CE') {
        return strike < currentPrice ? 'ITM' : strike > currentPrice ? 'OTM' : 'ATM';
    }
    return 'Unknown';
};

/**
 * Calculate total value for an option (premium × lot size)
 * @param {number} premium - Premium per share
 * @param {number} lotSize - Lot size for the option (default: 50 for Nifty)
 * @returns {number|null} Total value or null if invalid
 */
export const calculateTotalValue = (premium, lotSize = 50) => {
    if (typeof premium !== 'number' || isNaN(premium)) {
        return null;
    }
    
    if (typeof lotSize !== 'number' || lotSize <= 0) {
        return null;
    }
    
    // Total Value = Premium × Lot Size
    return premium * lotSize;
};

export default {
    getNearestStrike,
    getATMStrike,
    getNearestITMStrikeForCalls,
    getNearestITMStrikeForPuts,
    getNearestOTMStrikeForCalls,
    getNearestOTMStrikeForPuts,
    getStrikeRange,
    isValidStrike,
    getNextStrikeAbove,
    getNextStrikeBelow,
    calculateIntrinsicValue,
    isOptionUndervalued,
    getDiscountPercentage,
    calculateNetPremium,
    calculateMaxRisk,
    calculateProfitPotential,
    getStrikeType,
    calculateTotalValue
};
