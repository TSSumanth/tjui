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
    getNextStrikeBelow
};
