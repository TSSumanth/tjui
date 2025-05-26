const extractOptionDetails = (tradingsymbol) => {
    if (!tradingsymbol) return null;

    // Option: SYMBOL + EXPIRY + STRIKE + CE/PE
    const optionPattern = /^([A-Z]+)(\d{2}[A-Z]{3})(\d+(?:\.\d+)?)(CE|PE)$/;
    // Future: SYMBOL + EXPIRY + FUT
    const futurePattern = /^([A-Z]+)(\d{2}[A-Z]{3})FUT$/;

    let match = tradingsymbol.match(optionPattern);
    if (match) {
        return {
            symbol: match[1],
            expiry: match[2],
            strike: parseFloat(match[3]),
            type: match[4] // CE or PE
        };
    }

    match = tradingsymbol.match(futurePattern);
    if (match) {
        return {
            symbol: match[1],
            expiry: match[2],
            type: 'FUT'
        };
    }

    return null;
};

/**
 * Calculates the break-even point(s) for a given trade or strategy.
 * @param {Object} input - The input data for the calculation (trade/order/option details).
 * @returns {Object} - The calculated break-even result(s).
 */
function parseOptions(options, current_stock_price) {
    const CALL_OPTIONS = [];
    const PUT_OPTIONS = [];
    const FUTURES = [];
    const CALL_STRIKE_PRICES = new Set();
    const PUT_STRIKE_PRICES = new Set();
    let total_call_premium = 0;
    let total_put_premium = 0;
    let total_future_premium = 0;

    for (const option of options) {
        let option_details = extractOptionDetails(option.instrument_type);
        if (!option_details) {
            console.warn(`Could not parse option details for: ${option.instrument_type}`);
            continue;
        }
        option_details.price = option.price;
        option_details.quantity = option.quantity;
        option_details.position = option.position;
        if (option_details.type.toUpperCase() === 'CE') {
            CALL_OPTIONS.push(option_details);
            if (option.position.toUpperCase() === 'BUY') {
                total_call_premium += (option.price * option.quantity);
            } else {
                total_call_premium -= (option.price * option.quantity);
            }
            CALL_STRIKE_PRICES.add(option_details.strike);
        } else if (option_details.type.toUpperCase() === 'PE') {
            PUT_OPTIONS.push(option_details);
            if (option.position.toUpperCase() === 'BUY') {
                total_put_premium += (option.price * option.quantity);
            } else {
                total_put_premium -= (option.price * option.quantity);
            }
            PUT_STRIKE_PRICES.add(option_details.strike);
        } else if (option_details.type.toUpperCase() === 'FUT') {
            FUTURES.push(option_details);
            total_future_premium = 0;
        }
    }
    return {
        CALL_OPTIONS,
        PUT_OPTIONS,
        FUTURES,
        CALL_STRIKE_PRICES,
        PUT_STRIKE_PRICES,
        total_call_premium,
        total_put_premium,
        total_future_premium
    };
}

function calculateTotalPremium(call, put, future) {
    return call + put + future;
}

function calculate_Combined_PAndL_At_A_Price(CALL_OPTIONS, PUT_OPTIONS, FUTURES, CURRENT_STOCK_PRICE) {
    let stock_price = parseFloat(CURRENT_STOCK_PRICE);
    let total_call_profit = 0;
    for (const call_option of CALL_OPTIONS) {
        if (stock_price > call_option.strike) {
            if (call_option.position.toUpperCase() === 'BUY') {
                total_call_profit += (stock_price - call_option.strike) * call_option.quantity;
            } else {
                total_call_profit -= (stock_price - call_option.strike) * call_option.quantity;
            }
        }
    }
    let total_put_profit = 0;
    for (const put_option of PUT_OPTIONS) {
        if (stock_price < put_option.strike) {
            if (put_option.position.toUpperCase() === 'BUY') {
                total_put_profit += (put_option.strike - stock_price) * put_option.quantity;
            } else {
                total_put_profit -= (put_option.strike - stock_price) * put_option.quantity;
            }
        }
    }
    let total_future_profit = 0;
    for (const future of FUTURES) {
        if (future.position.toUpperCase() === 'BUY') {
            total_future_profit += (stock_price - future.price) * future.quantity;
        } else {
            total_future_profit -= (stock_price - future.price) * future.quantity;
        }
    }
    return total_call_profit + total_put_profit + total_future_profit;
}

function findUpperBreakEven(CALL_OPTIONS, PUT_OPTIONS, FUTURES, CURRENT_STOCK_PRICE, total_premium, max_stock_movement = 20) {
    let break_even = 0;
    const startPrice = parseFloat(CURRENT_STOCK_PRICE);
    const endPrice = startPrice * ((100 + max_stock_movement) / 100);
    // Use smaller step size for more precise break-even points
    for (let stock_price = startPrice; stock_price < endPrice; stock_price += 0.1) {
        let total_pl = calculate_Combined_PAndL_At_A_Price(CALL_OPTIONS, PUT_OPTIONS, FUTURES, stock_price);
        if (total_pl > total_premium) {
            break_even = parseFloat(stock_price.toFixed(2));
            break;
        }
    }
    return break_even;
}

function findLowerBreakEven(CALL_OPTIONS, PUT_OPTIONS, FUTURES, CURRENT_STOCK_PRICE, total_premium, max_stock_movement = 20) {
    let break_even = 0;
    const startPrice = parseFloat(CURRENT_STOCK_PRICE);
    const endPrice = startPrice * ((100 - max_stock_movement) / 100);
    // Use smaller step size for more precise break-even points
    for (let stock_price = startPrice; stock_price > endPrice; stock_price -= 0.1) {
        let total_pl = calculate_Combined_PAndL_At_A_Price(CALL_OPTIONS, PUT_OPTIONS, FUTURES, stock_price);
        if (total_pl > total_premium) {
            break_even = parseFloat(stock_price.toFixed(2));
            break;
        }
    }
    return break_even;
}

function calculateBreakEven(input) {
    let break_even_points = { upper: 0, lower: 0 };
    let manual_pl = parseFloat(input.manual_pl || 0);
    const CURRENT_STOCK_PRICE = parseFloat(input.current_price);
    const {
        CALL_OPTIONS,
        PUT_OPTIONS,
        FUTURES,
        CALL_STRIKE_PRICES,
        PUT_STRIKE_PRICES,
        total_call_premium,
        total_put_premium,
        total_future_premium
    } = parseOptions(input.options);
    console.log("All Options:", JSON.stringify(input.options));
    const total_premium = calculateTotalPremium(total_call_premium, total_put_premium, total_future_premium) - manual_pl;
    const sortedCallStrikes = Array.from(CALL_STRIKE_PRICES).sort((a, b) => a - b);
    const sortedPutStrikes = Array.from(PUT_STRIKE_PRICES).sort((a, b) => a - b);
    console.log('Sorted CALL STRIKE PRICES:', sortedCallStrikes);
    console.log('Sorted PUT STRIKE PRICES:', sortedPutStrikes);
    console.log('total_premium:', total_premium);
    break_even_points.upper = findUpperBreakEven(CALL_OPTIONS, PUT_OPTIONS, FUTURES, CURRENT_STOCK_PRICE, total_premium);
    break_even_points.lower = findLowerBreakEven(CALL_OPTIONS, PUT_OPTIONS, FUTURES, CURRENT_STOCK_PRICE, total_premium);
    console.log('Break-even points:', break_even_points);
    return break_even_points;
}


let input1 = {
    current_price: 1507,
    manual_pl: 28072,

    options: [
        {
            "instrument_type": "INFY25MAY1520PE", "price": 44,
            "quantity": 400, "position": "BUY", "lot_size": 400
        },
        {
            "instrument_type": "INFY25JUN1480CE", "price": 60.4,
            "quantity": 1600, "position": "BUY", "lot_size": 400
        },
        {
            "instrument_type": "INFY25MAYFUT", "price": 1424.05,
            "quantity": 800, "position": "SELL", "lot_size": 400
        }]

}
// calculateBreakEven(input1);

module.exports = { calculateBreakEven }; 