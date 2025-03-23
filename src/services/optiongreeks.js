const math = require("mathjs");

function normalCDF(x) {
    return (1.0 + math.erf(x / Math.sqrt(2))) / 2.0; // Fix: Use Math.sqrt()
}

function normalPDF(x) {
    return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI); // Fix: Use Math.exp()
}

function blackScholesGreeks(S, K, T, r, sigma, optionType = "call") {
    const epsilon = 1e-10; // Small value to prevent division by zero
    T = Math.max(T, epsilon); // Ensure T is not zero
    sigma = Math.max(sigma, epsilon); // Ensure sigma is not zero

    const d1 = (Math.log(S / K) + (r + 0.5 * sigma ** 2) * T) / (sigma * Math.sqrt(T));
    const d2 = d1 - sigma * Math.sqrt(T);

    const delta = optionType === "call" ? normalCDF(d1) : normalCDF(d1) - 1;
    const gamma = normalPDF(d1) / (S * sigma * Math.sqrt(T)); // Fix: Ensure nonzero denominator
    const vega = (S * normalPDF(d1) * Math.sqrt(T)) / 100;
    const theta = (-S * normalPDF(d1) * sigma / (2 * Math.sqrt(T))) / 365;
    const rho = optionType === "call"
        ? (K * T * Math.exp(-r * T) * normalCDF(d2)) / 100
        : (-K * T * Math.exp(-r * T) * normalCDF(-d2)) / 100;

    return { Delta: delta, Gamma: gamma, Vega: vega, Theta: theta, Rho: rho };
}

// Example Usage
const S = 1277.5; // Current stock price
const K = 1270; // Strike price
const T = 21 / 365; // Time to expiry in years
const r = 6.6256 / 100; // Risk-free rate as decimal // Risk-free rate (5%)
const sigma = 0.201; // Implied Volatility (20%)

const greeks = blackScholesGreeks(S, K, T, r, sigma, "put");
console.log(greeks);

function blackScholesPrice(S, K, T, r, sigma, optionType = "call") {
    const d1 = (math.log(S / K) + (r + 0.5 * sigma ** 2) * T) / (sigma * math.sqrt(T));
    const d2 = d1 - sigma * math.sqrt(T);

    if (optionType === "call") {
        return S * normalCDF(d1) - K * Math.exp(-r * T) * normalCDF(d2);
    } else {
        return K * Math.exp(-r * T) * normalCDF(-d2) - S * normalCDF(-d1);
    }
}


const callPrice = blackScholesPrice(S, K, T, r, sigma, "call");
const putPrice = blackScholesPrice(S, K, T, r, sigma, "put");

console.log("Call Option Price:", callPrice);
console.log("Put Option Price:", putPrice);

function approximateOptionPrice(currentPrice, delta, gamma, theta, vega, rho, deltaS, deltaT, deltaSigma, deltaR) {
    return currentPrice + 
        delta * deltaS + 
        0.5 * gamma * deltaS ** 2 + 
        theta * deltaT + 
        vega * deltaSigma + 
        rho * deltaR;
}

// Example Usage:
const currentOptionPrice = 24; // Assume initial option price is 500
const delta = greeks.Delta;
const gamma = greeks.Gamma
const theta = greeks.Theta
const vega = greeks.Vega
const rho = greeks.Rho

const deltaS = 10; // Stock price change by 100
const deltaT = -1 / 365; // 1 day passes
const deltaSigma = 0.01; // Implied volatility change by 1%
const deltaR = 0.001; // Interest rate change by 0.1%

const newPrice = approximateOptionPrice(currentOptionPrice, delta, gamma, theta, vega, rho, deltaS, deltaT, deltaSigma, deltaR);
console.log("New Option Price Estimate:", newPrice);