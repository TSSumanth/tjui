import React, { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Typography,
    Chip,
    Card,
    CardContent,
    Grid,
    Divider
} from '@mui/material';
import {
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon
} from '@mui/icons-material';
import {
    calculateIntrinsicValue,
    isOptionUndervalued,
    getDiscountPercentage,
    calculateNetPremium,
    calculateMaxRisk,
    calculateProfitPotential,
    getStrikeType
} from './utils';

/**
 * TradeCombinationsTable - Analyzes and displays trade combinations for options strategies
 * 
 * For Bull Put Spread (PE):
 * - BUY lower strike (OTM) + SELL higher strike (ITM)
 * - Net Premium = SELL Premium - BUY Premium
 * 
 * For Bear Call Spread (CE):
 * - BUY higher strike (OTM) + SELL lower strike (ITM)
 * - Net Premium = SELL Premium - BUY Premium
 */
const TradeCombinationsTable = ({ 
    strategyType, // 'PE' or 'CE'
    niftyCMP, 
    strikes, 
    realInstruments, 
    ltpData 
}) => {
    const [combinations, setCombinations] = useState([]);

    // Calculate trade combinations when data changes
    useEffect(() => {
        if (strategyType && niftyCMP && strikes.length > 0 && realInstruments.length > 0) {
            const calculatedCombinations = calculateTradeCombinations();
            setCombinations(calculatedCombinations);
        }
    }, [strategyType, niftyCMP, strikes, realInstruments, ltpData]);

    const calculateTradeCombinations = () => {
        const cmp = parseFloat(niftyCMP);
        if (isNaN(cmp)) return [];

        // Find ATM strike (nearest to current price)
        const atmStrike = strikes.reduce((nearest, strike) => {
            return Math.abs(strike - cmp) < Math.abs(nearest - cmp) ? strike : nearest;
        });

        // Find ITM strikes (closer to current price than ATM)
        let itmStrikes = [];
        if (strategyType === 'PE') {
            // For Bull Put Spread: ITM strikes are HIGHER than current price
            itmStrikes = strikes.filter(strike => strike > cmp).slice(0, 3);
        } else if (strategyType === 'CE') {
            // For Bear Call Spread: ITM strikes are LOWER than current price
            itmStrikes = strikes.filter(strike => strike < cmp).slice(0, 3);
        }

        // Create combinations
        const combinations = [];
        const selectedStrikes = [atmStrike, ...itmStrikes];

        selectedStrikes.forEach(buyStrike => {
            strikes.forEach(sellStrike => {
                // Skip same strike combinations
                if (buyStrike === sellStrike) return;

                // Strategy-specific logic
                if (strategyType === 'PE') {
                    // Bull Put Spread: BUY lower strike, SELL higher strike
                    if (buyStrike < sellStrike) {
                        combinations.push({
                            buyStrike,
                            sellStrike,
                            buyType: 'BUY',
                            sellType: 'SELL',
                            buyStrikeType: getStrikeType(buyStrike, 'PE', cmp),
                            sellStrikeType: getStrikeType(sellStrike, 'PE', cmp)
                        });
                    }
                } else if (strategyType === 'CE') {
                    // Bear Call Spread: BUY higher strike, SELL lower strike
                    if (buyStrike > sellStrike) {
                        combinations.push({
                            buyStrike,
                            sellStrike,
                            buyType: 'BUY',
                            sellType: 'SELL',
                            buyStrikeType: getStrikeType(buyStrike, 'CE', cmp),
                            sellStrikeType: getStrikeType(sellStrike, 'CE', cmp)
                        });
                    }
                }
            });
        });

        return combinations;
    };



    const getStrikeColor = (strikeType) => {
        switch (strikeType) {
            case 'ITM': return 'success';
            case 'OTM': return 'warning';
            case 'ATM': return 'primary';
            default: return 'default';
        }
    };

    const getPremium = (strike, optionType) => {
        // Find the instrument for this strike
        const instrument = realInstruments.find(instr => 
            instr.strike === strike && instr.instrument_type === optionType
        );

        if (!instrument) return null;

        // Try to get LTP first, fallback to last_price
        const premium = ltpData[instrument.tradingsymbol] || instrument.last_price;
        return premium ? parseFloat(premium) : null;
    };

    const getLotSize = (strike, optionType) => {
        // Find the instrument for this strike
        const instrument = realInstruments.find(instr => 
            instr.strike === strike && instr.instrument_type === optionType
        );

        if (!instrument) return 50; // Default lot size for Nifty

        return instrument.lot_size || 50;
    };

    // Utility functions are now imported from utils.js

    // Utility functions are now imported from utils.js



    if (!combinations.length) {
        return (
            <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                    Calculating trade combinations...
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ mt: 3 }}>
            <Card sx={{ mb: 2, bgcolor: 'primary.50' }}>
                <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                        🎯 Trade Combinations Analysis
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {strategyType === 'PE' ? 'Bull Put Spread' : 'Bear Call Spread'}: 
                        Analyzing {combinations.length} potential combinations
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, mt: 0.5, alignItems: 'center' }}>
                        <Typography variant="body2" color="primary.main" sx={{ fontWeight: 600 }}>
                            📊 Lot Size: {realInstruments.length > 0 ? (realInstruments[0]?.lot_size || 50) : 50} shares per lot
                        </Typography>
                        <Typography variant="body2" color="success.main" sx={{ fontWeight: 600 }}>
                            📈 Nifty CMP: ₹{niftyCMP ? parseFloat(niftyCMP).toLocaleString() : 'N/A'}
                        </Typography>
                    </Box>
                    
                    {/* Undervalued Options Summary */}
                    {(() => {
                        const undervaluedOptions = [];
                        combinations.forEach(combo => {
                            if (isOptionUndervalued(combo.buyStrike, strategyType)) {
                                undervaluedOptions.push({ strike: combo.buyStrike, type: 'BUY' });
                            }
                            if (isOptionUndervalued(combo.sellStrike, strategyType)) {
                                undervaluedOptions.push({ strike: combo.sellStrike, type: 'SELL' });
                            }
                        });
                        
                        if (undervaluedOptions.length > 0) {
                            return (
                                <Box sx={{ mt: 1.5, p: 1, bgcolor: 'error.50', borderRadius: 1, border: '1px solid', borderColor: 'error.200' }}>
                                    <Typography variant="body2" color="error.main" sx={{ fontWeight: 600, mb: 0.5 }}>
                                        🔥 Undervalued Options Detected!
                                    </Typography>
                                    <Typography variant="caption" color="error.main">
                                        {undervaluedOptions.length} option(s) trading below intrinsic value - 
                                        potential arbitrage opportunities
                                    </Typography>
                                </Box>
                            );
                        }
                        return null;
                    })()}
                </CardContent>
            </Card>

            <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Strategy</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>BUY Strike</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>SELL Strike</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>BUY Premium (per share)</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>SELL Premium (per share)</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Intrinsic Value (per share)</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Max Risk (per lot)</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Profit Potential (per lot)</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Risk-Reward Ratio</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {combinations.map((combo, index) => {
                            const cmp = parseFloat(niftyCMP);
                            const buyPremium = getPremium(combo.buyStrike, strategyType);
                            const sellPremium = getPremium(combo.sellStrike, strategyType);
                            const buyIntrinsicValue = calculateIntrinsicValue(combo.buyStrike, strategyType, cmp);
                            const sellIntrinsicValue = calculateIntrinsicValue(combo.sellStrike, strategyType, cmp);
                            const isBuyUndervalued = isOptionUndervalued(combo.buyStrike, strategyType, cmp, buyPremium);
                            const isSellUndervalued = isOptionUndervalued(combo.sellStrike, strategyType, cmp, sellPremium);
                            const buyDiscount = getDiscountPercentage(combo.buyStrike, strategyType, cmp, buyPremium);
                            const sellDiscount = getDiscountPercentage(combo.sellStrike, strategyType, cmp, sellPremium);
                            const buyLotSize = getLotSize(combo.buyStrike, strategyType);
                            const sellLotSize = getLotSize(combo.sellStrike, strategyType);
                            
                            // Use consistent lot size for the strategy (usually all instruments have same lot size)
                            const strategyLotSize = Math.max(buyLotSize, sellLotSize) || 50;
                            const maxRisk = calculateMaxRisk(combo.buyStrike, combo.sellStrike, buyPremium, sellPremium, strategyLotSize);
                                                        const profitPotential = calculateProfitPotential(buyPremium, sellPremium, strategyLotSize);
                            
                            // Calculate risk-reward ratio: Max Risk / Profit Potential
                            const riskRewardRatio = (maxRisk && profitPotential && profitPotential > 0) 
                                ? maxRisk / profitPotential 
                                : null;

 

                            return (
                                <TableRow 
                                    key={`${combo.buyStrike}-${combo.sellStrike}`}
                                    sx={{ 
                                        '&:nth-of-type(odd)': { backgroundColor: 'grey.50' },
                                        '&:hover': { backgroundColor: 'primary.50' }
                                    }}
                                >
                                    <TableCell>
                                        <Chip
                                            label={`${combo.buyType} ${combo.buyStrike} ${strategyType}`}
                                            size="small"
                                            color="primary"
                                            variant="outlined"
                                            sx={{ mr: 1 }}
                                        />
                                        <Chip
                                            label={`${combo.sellType} ${combo.sellStrike} ${strategyType}`}
                                            size="small"
                                            color="secondary"
                                            variant="outlined"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Box>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                ₹{combo.buyStrike.toLocaleString()}
                                            </Typography>
                                            <Chip
                                                label={combo.buyStrikeType}
                                                size="small"
                                                color={getStrikeColor(combo.buyStrikeType)}
                                                variant="outlined"
                                            />
                                            {isBuyUndervalued && (
                                                <Chip
                                                    label="🔥 Undervalued"
                                                    size="small"
                                                    color="error"
                                                    variant="filled"
                                                    sx={{ fontSize: '0.6rem', height: 18, mt: 0.5 }}
                                                />
                                            )}
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Box>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                ₹{combo.sellStrike.toLocaleString()}
                                            </Typography>
                                            <Chip
                                                label={combo.sellStrikeType}
                                                size="small"
                                                color={getStrikeColor(combo.sellStrikeType)}
                                                variant="outlined"
                                            />
                                            {isSellUndervalued && (
                                                <Chip
                                                    label="🔥 Undervalued"
                                                    size="small"
                                                    color="error"
                                                    variant="filled"
                                                    sx={{ fontSize: '0.6rem', height: 18, mt: 0.5 }}
                                                />
                                            )}
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" color="error.main" sx={{ fontWeight: 600 }}>
                                            {buyPremium !== null ? `₹${buyPremium.toFixed(2)}` : 'N/A'}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Lot: ₹{buyPremium !== null ? (buyPremium * buyLotSize).toFixed(2) : 'N/A'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" color="success.main" sx={{ fontWeight: 600 }}>
                                            {sellPremium !== null ? `₹${sellPremium.toFixed(2)}` : 'N/A'}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Lot: ₹{sellPremium !== null ? (sellPremium * sellLotSize).toFixed(2) : 'N/A'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Box>
                                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                                BUY: ₹{buyIntrinsicValue !== null ? buyIntrinsicValue.toFixed(2) : 'N/A'}
                                            </Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                SELL: ₹{sellIntrinsicValue !== null ? sellIntrinsicValue.toFixed(2) : 'N/A'}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                                Lot: BUY ₹{buyIntrinsicValue !== null ? (buyIntrinsicValue * buyLotSize).toFixed(2) : 'N/A'}, SELL ₹{sellIntrinsicValue !== null ? (sellIntrinsicValue * sellLotSize).toFixed(2) : 'N/A'}
                                            </Typography>
                                            {/* Highlight undervalued options */}
                                            {(isBuyUndervalued || isSellUndervalued) && (
                                                <Box sx={{ mt: 0.5 }}>
                                                    {isBuyUndervalued && (
                                                        <Chip
                                                            label={`BUY ${buyDiscount?.toFixed(1)}% off`}
                                                            size="small"
                                                            color="error"
                                                            variant="filled"
                                                            sx={{ fontSize: '0.6rem', height: 20, mr: 0.5 }}
                                                        />
                                                    )}
                                                    {isSellUndervalued && (
                                                        <Chip
                                                            label={`SELL ${sellDiscount?.toFixed(1)}% off`}
                                                            size="small"
                                                            color="error"
                                                            variant="filled"
                                                            sx={{ fontSize: '0.6rem', height: 20 }}
                                                        />
                                                    )}
                                                </Box>
                                            )}
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" color="warning.main" sx={{ fontWeight: 600 }}>
                                            ₹{maxRisk.toLocaleString()}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" color="info.main" sx={{ fontWeight: 600 }}>
                                            {profitPotential !== null ? `₹${profitPotential.toFixed(2)}` : 'N/A'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography 
                                            variant="body2" 
                                            color={riskRewardRatio !== null && riskRewardRatio <= 1 ? 'success.main' : 'warning.main'} 
                                            sx={{ fontWeight: 600 }}
                                        >
                                            {riskRewardRatio !== null ? `${riskRewardRatio.toFixed(2)}:1` : 'N/A'}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {riskRewardRatio !== null && riskRewardRatio <= 1 ? 'Good' : riskRewardRatio !== null ? 'High Risk' : ''}
                                        </Typography>
                                    </TableCell>

                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>

            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">
                    💡 <strong>Credit Spread:</strong> You receive the net premium upfront. 
                    <strong>Debit Spread:</strong> You pay the net premium upfront. 
                    <strong>All values shown are per lot.</strong>
                </Typography>
            </Box>
        </Box>
    );
};

export default TradeCombinationsTable;
