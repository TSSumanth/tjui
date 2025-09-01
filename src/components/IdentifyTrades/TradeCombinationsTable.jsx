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
    Divider,
    Tabs,
    Tab
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
    const [selectedTab, setSelectedTab] = useState(0);

    // Group combinations by BUY strike price
    const groupedCombinations = useMemo(() => {
        if (combinations.length === 0) return {};
        
        const grouped = {};
        combinations.forEach(combo => {
            const buyStrike = combo.buyStrike;
            if (!grouped[buyStrike]) {
                grouped[buyStrike] = [];
            }
            grouped[buyStrike].push(combo);
        });
        
        return grouped;
    }, [combinations]);

    // Get unique BUY strikes for tabs - ordered as ATM first, then ITM in descending order
    const buyStrikes = useMemo(() => {
        if (!niftyCMP || Object.keys(groupedCombinations).length === 0) return [];
        
        const cmp = parseFloat(niftyCMP);
        const strikes = Object.keys(groupedCombinations).map(strike => parseFloat(strike));
        
        // Find ATM strike
        const atmStrike = strikes.reduce((nearest, strike) => {
            return Math.abs(strike - cmp) < Math.abs(nearest - cmp) ? strike : nearest;
        });
        
        // Separate ATM and ITM strikes
        const itmStrikes = strikes.filter(strike => strike !== atmStrike);
        
        // Sort ITM strikes in descending order
        itmStrikes.sort((a, b) => b - a);
        
        // Return ATM first, then ITM in descending order
        return [atmStrike, ...itmStrikes];
    }, [groupedCombinations, niftyCMP]);

    // Get combinations for selected tab
    const selectedBuyStrike = buyStrikes[selectedTab];
    const filteredCombinations = selectedBuyStrike ? groupedCombinations[selectedBuyStrike] || [] : [];

    // Calculate trade combinations when data changes
    useEffect(() => {
        if (strategyType && niftyCMP && strikes.length > 0 && realInstruments.length > 0) {
            const calculatedCombinations = calculateTradeCombinations();
            setCombinations(calculatedCombinations);
        }
    }, [strategyType, niftyCMP, strikes, realInstruments, ltpData]);

    // Reset selected tab when combinations change
    useEffect(() => {
        if (buyStrikes.length > 0 && selectedTab >= buyStrikes.length) {
            setSelectedTab(0);
        }
    }, [buyStrikes.length, selectedTab]);

    const calculateTradeCombinations = () => {
        const cmp = parseFloat(niftyCMP);
        if (isNaN(cmp)) return [];

        // Find ATM strike (nearest to current price)
        const atmStrike = strikes.reduce((nearest, strike) => {
            return Math.abs(strike - cmp) < Math.abs(nearest - cmp) ? strike : nearest;
        });

        // Find BUY positions: ATM + 3 nearest ITM options
        let buyStrikes = [atmStrike]; // Start with ATM
        
        let itmStrikes = [];
        if (strategyType === 'PE') {
            // For PE: ITM strikes are HIGHER than current price
            // Exclude ATM strike to avoid duplicates
            itmStrikes = strikes
                .filter(strike => strike > cmp && strike !== atmStrike)
                .sort((a, b) => a - b)
                .slice(0, 3);
        } else if (strategyType === 'CE') {
            // For CE: ITM strikes are LOWER than current price
            // Select 3 nearest ITM strikes (closest to current price first)
            // Exclude ATM strike to avoid duplicates
            itmStrikes = strikes
                .filter(strike => strike < cmp && strike !== atmStrike)
                .sort((a, b) => b - a) // Sort descending (nearest to CMP first)
                .slice(0, 3);
        }
        
        // Combine ATM + ITM strikes (remove duplicates just in case)
        buyStrikes = [atmStrike, ...itmStrikes].filter((strike, index, arr) => arr.indexOf(strike) === index);

        // Debug logging
        console.log('🔍 Trade Combination Debug:', {
            cmp,
            strategyType,
            atmStrike,
            itmStrikes,
            buyStrikes,
            totalStrikes: strikes.length,
            availableStrikes: strikes,
            itmCandidates: strategyType === 'CE' ? 
                strikes.filter(strike => strike < cmp && strike !== atmStrike) :
                strikes.filter(strike => strike > cmp && strike !== atmStrike)
        });

        // Create combinations
        const combinations = [];

        buyStrikes.forEach(buyStrike => {
            // SELL positions: Strategy-specific filtering
            let sellStrikes = [];
            if (strategyType === 'PE') {
                // Bull Put Spread: SELL strikes higher than BUY strike
                sellStrikes = strikes.filter(sellStrike => sellStrike > buyStrike);
            } else if (strategyType === 'CE') {
                // Bear Call Spread: SELL strikes LOWER than BUY strike
                sellStrikes = strikes.filter(sellStrike => sellStrike < buyStrike);
            }
            
            console.log(`🔍 For BUY ${buyStrike}: Found ${sellStrikes.length} SELL options:`, sellStrikes);
            
            sellStrikes.forEach(sellStrike => {
                combinations.push({
                    buyStrike,
                    sellStrike,
                    buyType: 'BUY',
                    sellType: 'SELL',
                    buyStrikeType: getStrikeType(buyStrike, strategyType, cmp),
                    sellStrikeType: getStrikeType(sellStrike, strategyType, cmp)
                });
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
        <Box sx={{ mt: 2 }}>
            {/* Compact Header */}
            <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 1,
                p: 1,
                bgcolor: 'primary.50',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'primary.200',
                mb: 1.5
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                        🎯 {strategyType === 'PE' ? 'Bull Put' : 'Bear Call'} Analysis
                    </Typography>
                    <Chip 
                        label={buyStrikes.length > 0 ? 
                            `${filteredCombinations.length} trades for ₹${selectedBuyStrike?.toLocaleString()}` : 
                            `${combinations.length} combinations`
                        } 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                        sx={{ fontSize: '0.65rem', height: 20 }}
                    />
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                    <Typography variant="caption" color="primary.main" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>
                        📊 Lot: {realInstruments.length > 0 ? (realInstruments[0]?.lot_size || 50) : 50}
                    </Typography>
                    <Typography variant="caption" color="success.main" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>
                        📈 Nifty: ₹{niftyCMP ? parseFloat(niftyCMP).toLocaleString() : 'N/A'}
                    </Typography>
                    
                    {/* Compact Undervalued Indicator */}
                    {(() => {
                        const undervaluedCount = filteredCombinations.reduce((count, combo) => {
                            const cmp = parseFloat(niftyCMP);
                            const buyPremium = getPremium(combo.buyStrike, strategyType);
                            const sellPremium = getPremium(combo.sellStrike, strategyType);
                            if (isOptionUndervalued(combo.buyStrike, strategyType, cmp, buyPremium)) count++;
                            if (isOptionUndervalued(combo.sellStrike, strategyType, cmp, sellPremium)) count++;
                            return count;
                        }, 0);
                        
                        if (undervaluedCount > 0) {
                            return (
                                <Chip
                                    label={`🔥 ${undervaluedCount} undervalued`}
                                    size="small"
                                    color="error"
                                    variant="filled"
                                    sx={{ fontSize: '0.65rem', height: 20 }}
                                />
                            );
                        }
                        return null;
                    })()}
                </Box>
            </Box>

            {/* Tabs for BUY Strike Prices */}
            {buyStrikes.length > 0 && (
                <Box sx={{ mb: 2, bgcolor: 'white', borderRadius: 1, border: '1px solid', borderColor: 'grey.300' }}>
                    <Tabs
                        value={selectedTab}
                        onChange={(event, newValue) => setSelectedTab(newValue)}
                        variant="scrollable"
                        scrollButtons="auto"
                        sx={{
                            '& .MuiTabs-indicator': {
                                backgroundColor: 'primary.main',
                            },
                            '& .MuiTab-root': {
                                minWidth: 100,
                                fontWeight: 600,
                                fontSize: '0.8rem',
                            }
                        }}
                    >
                        {buyStrikes.map((buyStrike, index) => {
                            const combosCount = groupedCombinations[buyStrike]?.length || 0;
                            const hasUndervalued = groupedCombinations[buyStrike]?.some(combo => {
                                const cmp = parseFloat(niftyCMP);
                                const buyPremium = getPremium(combo.buyStrike, strategyType);
                                return isOptionUndervalued(combo.buyStrike, strategyType, cmp, buyPremium);
                            });

                            return (
                                <Tab
                                    key={buyStrike}
                                    label={
                                        <Box sx={{ textAlign: 'center' }}>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                ₹{buyStrike.toLocaleString()}
                                            </Typography>
                                            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', justifyContent: 'center' }}>
                                                <Chip
                                                    label={`${combosCount} trades`}
                                                    size="small"
                                                    color="primary"
                                                    variant="outlined"
                                                    sx={{ fontSize: '0.6rem', height: 16 }}
                                                />
                                                {hasUndervalued && (
                                                    <Chip
                                                        label="🔥"
                                                        size="small"
                                                        color="error"
                                                        variant="filled"
                                                        sx={{ fontSize: '0.6rem', height: 16, minWidth: 16 }}
                                                    />
                                                )}
                                            </Box>
                                        </Box>
                                    }
                                />
                            );
                        })}
                    </Tabs>
                </Box>
            )}

            <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Strategy</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>BUY Strike</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>SELL Strike</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>BUY Instrument</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>SELL Instrument</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>BUY Premium (per share)</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>SELL Premium (per share)</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Intrinsic Value (per share)</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Max Risk (per lot)</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Profit Potential (per lot)</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Risk-Reward Ratio</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredCombinations.map((combo, index) => {
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
                            
                            // Get instrument details for buy and sell strikes
                            const buyInstrument = realInstruments.find(instr => 
                                instr.strike === combo.buyStrike && instr.instrument_type === strategyType
                            );
                            const sellInstrument = realInstruments.find(instr => 
                                instr.strike === combo.sellStrike && instr.instrument_type === strategyType
                            );
                            
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
                                        <Box>
                                            <Typography variant="caption" color="text.primary" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>
                                                {buyInstrument?.tradingsymbol || 'N/A'}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', display: 'block' }}>
                                                Token: {buyInstrument?.instrument_token || 'N/A'}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Box>
                                            <Typography variant="caption" color="text.primary" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>
                                                {sellInstrument?.tradingsymbol || 'N/A'}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', display: 'block' }}>
                                                Token: {sellInstrument?.instrument_token || 'N/A'}
                                            </Typography>
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
