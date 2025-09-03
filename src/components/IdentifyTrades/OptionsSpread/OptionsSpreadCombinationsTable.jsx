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
    Tab,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
    Alert,
    Select,
    MenuItem,
    FormControl,
    InputLabel
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
import { placeRegularOrder, getOrderById } from '../../../services/zerodha/api';

/**
 * OptionsSpreadCombinationsTable - Analyzes and displays trade combinations for options strategies
 * 
 * For Bull Put Spread (PE):
 * - BUY lower strike (OTM) + SELL higher strike (ITM)
 * - Net Premium = SELL Premium - BUY Premium
 * 
 * For Bear Call Spread (CE):
 * - BUY higher strike (OTM) + SELL lower strike (ITM)
 * - Net Premium = SELL Premium - BUY Premium
 */
const OptionsSpreadCombinationsTable = ({ 
    strategyType, // 'PE' or 'CE'
    niftyCMP, 
    strikes, 
    realInstruments, 
    ltpData 
}) => {
    const [combinations, setCombinations] = useState([]);
    const [selectedTab, setSelectedTab] = useState(0);
    
    // Order confirmation modal state
    const [orderModalOpen, setOrderModalOpen] = useState(false);
    const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
    const [isPlacingOrders, setIsPlacingOrders] = useState(false);
    const [selectedLotMultiplier, setSelectedLotMultiplier] = useState(1); // 1x, 2x, 3x lot size
    const [orderProgress, setOrderProgress] = useState({
        buyOrderPlaced: false,
        buyOrderId: null,
        sellOrderPlaced: false,
        sellOrderId: null,
        error: null
    });

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

    // Handle taking a position (opening order confirmation modal)
    const handleTakePosition = (orderDetails) => {
        console.log('📈 Opening Order Confirmation:', orderDetails);
        setSelectedOrderDetails(orderDetails);
        setOrderModalOpen(true);
        setSelectedLotMultiplier(1); // Reset to 1x lot size
        // Reset order progress
        setOrderProgress({
            buyOrderPlaced: false,
            buyOrderId: null,
            sellOrderPlaced: false,
            sellOrderId: null,
            error: null
        });
    };

    // Handle order confirmation and sequential placement
    const handleConfirmOrders = async () => {
        if (!selectedOrderDetails) return;
        
        setIsPlacingOrders(true);
        
        try {
            // Step 1: Place BUY order first
            console.log('🔵 Placing BUY order:', selectedOrderDetails.buyOrder);
            
            const buyOrderParams = {
                exchange: selectedOrderDetails.buyOrder.exchange,
                tradingsymbol: selectedOrderDetails.buyOrder.tradingsymbol,
                transaction_type: 'BUY',
                quantity: selectedOrderDetails.buyOrder.quantity * selectedLotMultiplier,
                order_type: 'MARKET', // Always market orders
                product: 'NRML', // Normal - can hold overnight
                variety: 'regular'
            };
            
            const buyOrderResponse = await placeRegularOrder(buyOrderParams);
            console.log('✅ BUY order placed:', buyOrderResponse);
            
            setOrderProgress(prev => ({
                ...prev,
                buyOrderPlaced: true,
                buyOrderId: buyOrderResponse.order_id
            }));
            
            // Step 2: Wait for BUY order confirmation, then place SELL order
            console.log('⏳ Waiting for BUY order execution...');
            
            // Poll for BUY order status
            let buyOrderExecuted = false;
            let attempts = 0;
            const maxAttempts = 10;
            
            while (!buyOrderExecuted && attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
                
                try {
                    const buyOrderStatusResponse = await getOrderById(buyOrderResponse.order_id);
                    console.log(`📊 BUY order response (attempt ${attempts + 1}):`, buyOrderStatusResponse);
                    
                    // getOrderById returns array of order history, get the latest status
                    let buyOrderStatus;
                    if (buyOrderStatusResponse.success && Array.isArray(buyOrderStatusResponse.data) && buyOrderStatusResponse.data.length > 0) {
                        // Get the latest order status (last item in array)
                        buyOrderStatus = buyOrderStatusResponse.data[buyOrderStatusResponse.data.length - 1];
                    } else {
                        throw new Error('Invalid order status response format');
                    }
                    
                    console.log(`📊 BUY order status (attempt ${attempts + 1}):`, buyOrderStatus.status);
                    
                    if (buyOrderStatus.status === 'COMPLETE') {
                        buyOrderExecuted = true;
                        console.log('✅ BUY order executed successfully');
                        console.log(`💰 Execution details: Qty: ${buyOrderStatus.filled_quantity}, Avg Price: ₹${buyOrderStatus.average_price}`);
                        break;
                    } else if (buyOrderStatus.status === 'REJECTED' || buyOrderStatus.status === 'CANCELLED') {
                        throw new Error(`BUY order ${buyOrderStatus.status}: ${buyOrderStatus.status_message || 'No message'}`);
                    }
                } catch (error) {
                    console.warn(`Failed to get BUY order status (attempt ${attempts + 1}):`, error);
                }
                
                attempts++;
            }
            
            if (!buyOrderExecuted) {
                throw new Error('BUY order execution timeout - please check order status manually');
            }
            
            // Step 3: Place SELL order after BUY order is executed
            console.log('🟠 Placing SELL order:', selectedOrderDetails.sellOrder);
            
            const sellOrderParams = {
                exchange: selectedOrderDetails.sellOrder.exchange,
                tradingsymbol: selectedOrderDetails.sellOrder.tradingsymbol,
                transaction_type: 'SELL',
                quantity: selectedOrderDetails.sellOrder.quantity * selectedLotMultiplier,
                order_type: 'MARKET', // Always market orders
                product: 'NRML', // Normal - can hold overnight
                variety: 'regular'
            };
            
            const sellOrderResponse = await placeRegularOrder(sellOrderParams);
            console.log('✅ SELL order placed:', sellOrderResponse);
            
            setOrderProgress(prev => ({
                ...prev,
                sellOrderPlaced: true,
                sellOrderId: sellOrderResponse.order_id
            }));
            
            // Success - both orders placed
            alert(`✅ Orders placed successfully!\nBUY Order ID: ${buyOrderResponse.order_id}\nSELL Order ID: ${sellOrderResponse.order_id}`);
            
            // Close modal after success
            setTimeout(() => {
                setOrderModalOpen(false);
                setIsPlacingOrders(false);
            }, 2000);
            
        } catch (error) {
            console.error('❌ Order placement failed:', error);
            setOrderProgress(prev => ({
                ...prev,
                error: error.message
            }));
            setIsPlacingOrders(false);
        }
    };

    // Handle modal close
    const handleCloseOrderModal = () => {
        if (!isPlacingOrders) {
            setOrderModalOpen(false);
            setSelectedOrderDetails(null);
        }
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
                            <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>Action</TableCell>
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

                            // Prepare complete order details for direct order placement
                            const orderDetails = {
                                strategy: strategyType === 'PE' ? 'Bull Put Spread' : 'Bear Call Spread',
                                strategyType,
                                buyOrder: {
                                    tradingsymbol: buyInstrument?.tradingsymbol || `NIFTY${combo.buyStrike}${strategyType}`,
                                    instrument_token: buyInstrument?.instrument_token,
                                    exchange: buyInstrument?.exchange || 'NFO',
                                    transaction_type: 'BUY',
                                    strike: combo.buyStrike,
                                    quantity: strategyLotSize,
                                    premium: buyPremium,
                                    lot_size: buyLotSize,
                                    instrument_type: strategyType,
                                    expiry: buyInstrument?.expiry
                                },
                                sellOrder: {
                                    tradingsymbol: sellInstrument?.tradingsymbol || `NIFTY${combo.sellStrike}${strategyType}`,
                                    instrument_token: sellInstrument?.instrument_token,
                                    exchange: sellInstrument?.exchange || 'NFO',
                                    transaction_type: 'SELL',
                                    strike: combo.sellStrike,
                                    quantity: strategyLotSize,
                                    premium: sellPremium,
                                    lot_size: sellLotSize,
                                    instrument_type: strategyType,
                                    expiry: sellInstrument?.expiry
                                },
                                analysis: {
                                    maxRisk,
                                    profitPotential,
                                    riskRewardRatio,
                                    netPremium: (sellPremium - buyPremium) * strategyLotSize,
                                    buyIntrinsicValue,
                                    sellIntrinsicValue,
                                    isBuyUndervalued,
                                    isSellUndervalued
                                }
                            };

 

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
                                    <TableCell sx={{ textAlign: 'center' }}>
                                        <Button
                                            variant="contained"
                                            size="small"
                                            color="primary"
                                            onClick={() => handleTakePosition(orderDetails)}
                                            sx={{ 
                                                fontSize: '0.7rem',
                                                minWidth: 80,
                                                height: 28,
                                                textTransform: 'none'
                                            }}
                                        >
                                            📈 Order
                                        </Button>
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

            {/* Order Confirmation Modal */}
            <Dialog
                open={orderModalOpen}
                onClose={handleCloseOrderModal}
                maxWidth="md"
                fullWidth
                disableEscapeKeyDown={isPlacingOrders}
            >
                <DialogTitle>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        📈 Confirm {selectedOrderDetails?.strategy} Orders
                    </Typography>
                </DialogTitle>
                
                <DialogContent>
                    {selectedOrderDetails && (
                        <Box>
                            {/* Strategy Summary */}
                            <Card sx={{ mb: 2, bgcolor: 'primary.50' }}>
                                <CardContent sx={{ py: 1.5 }}>
                                    <Grid container spacing={2}>
                                        <Grid item xs={6}>
                                            <Typography variant="body2" color="text.secondary">Strategy</Typography>
                                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                                {selectedOrderDetails.strategy}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="body2" color="text.secondary">Net Premium</Typography>
                                            <Typography variant="body1" sx={{ fontWeight: 600, color: selectedOrderDetails.analysis.netPremium > 0 ? 'success.main' : 'error.main' }}>
                                                ₹{selectedOrderDetails.analysis.netPremium?.toFixed(2)} 
                                                ({selectedOrderDetails.analysis.netPremium > 0 ? 'Credit' : 'Debit'})
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="body2" color="text.secondary">Max Risk</Typography>
                                            <Typography variant="body1" sx={{ fontWeight: 600, color: 'error.main' }}>
                                                ₹{selectedOrderDetails.analysis.maxRisk?.toFixed(2)}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="body2" color="text.secondary">Profit Potential</Typography>
                                            <Typography variant="body1" sx={{ fontWeight: 600, color: 'success.main' }}>
                                                ₹{selectedOrderDetails.analysis.profitPotential?.toFixed(2)}
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>

                            {/* Quantity Selector */}
                            <Card sx={{ mb: 2, bgcolor: 'grey.50' }}>
                                <CardContent sx={{ py: 1.5 }}>
                                    <Grid container spacing={2} alignItems="center">
                                        <Grid item xs={12} sm={6}>
                                            <FormControl size="small" sx={{ minWidth: 200 }}>
                                                <InputLabel>Lot Multiplier</InputLabel>
                                                <Select
                                                    value={selectedLotMultiplier}
                                                    onChange={(e) => setSelectedLotMultiplier(e.target.value)}
                                                    label="Lot Multiplier"
                                                    disabled={isPlacingOrders}
                                                >
                                                    {[1, 2, 3, 4, 5, 10, 15, 20].map(multiplier => (
                                                        <MenuItem key={multiplier} value={multiplier}>
                                                            {multiplier}x Lots ({selectedOrderDetails.buyOrder.quantity * multiplier} shares)
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="body2" color="text.secondary">Total Position Value</Typography>
                                            <Typography variant="body1" sx={{ fontWeight: 600, color: selectedOrderDetails.analysis.netPremium > 0 ? 'success.main' : 'error.main' }}>
                                                ₹{(selectedOrderDetails.analysis.netPremium * selectedLotMultiplier)?.toFixed(2)}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Max Risk: ₹{(selectedOrderDetails.analysis.maxRisk * selectedLotMultiplier)?.toFixed(2)} | 
                                                Max Profit: ₹{(selectedOrderDetails.analysis.profitPotential * selectedLotMultiplier)?.toFixed(2)}
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>

                            {/* Order Details */}
                            <Grid container spacing={2}>
                                {/* BUY Order */}
                                <Grid item xs={12} md={6}>
                                    <Card sx={{ border: '2px solid', borderColor: 'primary.main' }}>
                                        <CardContent>
                                            <Typography variant="h6" color="primary.main" sx={{ fontWeight: 600, mb: 1 }}>
                                                🔵 BUY Order
                                            </Typography>
                                            <Grid container spacing={1}>
                                                <Grid item xs={6}>
                                                    <Typography variant="caption" color="text.secondary">Symbol</Typography>
                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                        {selectedOrderDetails.buyOrder.tradingsymbol}
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Typography variant="caption" color="text.secondary">Strike</Typography>
                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                        ₹{selectedOrderDetails.buyOrder.strike}
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Typography variant="caption" color="text.secondary">Quantity</Typography>
                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                        {selectedOrderDetails.buyOrder.quantity * selectedLotMultiplier}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        ({selectedLotMultiplier}x lots)
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Typography variant="caption" color="text.secondary">Premium</Typography>
                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                        ₹{selectedOrderDetails.buyOrder.premium?.toFixed(2)}
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={12}>
                                                    <Typography variant="caption" color="text.secondary">Order Type</Typography>
                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                        MARKET (NRML)
                                                    </Typography>
                                                </Grid>
                                            </Grid>
                                            {/* Order Status */}
                                            {orderProgress.buyOrderPlaced && (
                                                <Box sx={{ mt: 1, p: 1, bgcolor: 'success.50', borderRadius: 1 }}>
                                                    <Typography variant="caption" color="success.main" sx={{ fontWeight: 600 }}>
                                                        ✅ Order Placed - ID: {orderProgress.buyOrderId}
                                                    </Typography>
                                                </Box>
                                            )}
                                        </CardContent>
                                    </Card>
                                </Grid>

                                {/* SELL Order */}
                                <Grid item xs={12} md={6}>
                                    <Card sx={{ border: '2px solid', borderColor: 'secondary.main' }}>
                                        <CardContent>
                                            <Typography variant="h6" color="secondary.main" sx={{ fontWeight: 600, mb: 1 }}>
                                                🟠 SELL Order
                                            </Typography>
                                            <Grid container spacing={1}>
                                                <Grid item xs={6}>
                                                    <Typography variant="caption" color="text.secondary">Symbol</Typography>
                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                        {selectedOrderDetails.sellOrder.tradingsymbol}
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Typography variant="caption" color="text.secondary">Strike</Typography>
                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                        ₹{selectedOrderDetails.sellOrder.strike}
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Typography variant="caption" color="text.secondary">Quantity</Typography>
                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                        {selectedOrderDetails.sellOrder.quantity * selectedLotMultiplier}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        ({selectedLotMultiplier}x lots)
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Typography variant="caption" color="text.secondary">Premium</Typography>
                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                        ₹{selectedOrderDetails.sellOrder.premium?.toFixed(2)}
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={12}>
                                                    <Typography variant="caption" color="text.secondary">Order Type</Typography>
                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                        MARKET (NRML)
                                                    </Typography>
                                                </Grid>
                                            </Grid>
                                            {/* Order Status */}
                                            {orderProgress.sellOrderPlaced && (
                                                <Box sx={{ mt: 1, p: 1, bgcolor: 'success.50', borderRadius: 1 }}>
                                                    <Typography variant="caption" color="success.main" sx={{ fontWeight: 600 }}>
                                                        ✅ Order Placed - ID: {orderProgress.sellOrderId}
                                                    </Typography>
                                                </Box>
                                            )}
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>

                            {/* Order Progress */}
                            {isPlacingOrders && (
                                <Box sx={{ mt: 2, p: 2, bgcolor: 'info.50', borderRadius: 1, textAlign: 'center' }}>
                                    <CircularProgress size={24} sx={{ mr: 1 }} />
                                    <Typography variant="body2" color="info.main" sx={{ fontWeight: 600 }}>
                                        {!orderProgress.buyOrderPlaced ? 'Placing BUY order...' : 
                                         !orderProgress.sellOrderPlaced ? 'BUY order confirmed. Placing SELL order...' : 
                                         'Both orders placed successfully!'}
                                    </Typography>
                                </Box>
                            )}

                            {/* Error Display */}
                            {orderProgress.error && (
                                <Alert severity="error" sx={{ mt: 2 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                        Order Failed: {orderProgress.error}
                                    </Typography>
                                </Alert>
                            )}
                        </Box>
                    )}
                </DialogContent>

                <DialogActions sx={{ p: 2 }}>
                    <Button 
                        onClick={handleCloseOrderModal} 
                        disabled={isPlacingOrders}
                        variant="outlined"
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleConfirmOrders} 
                        disabled={isPlacingOrders}
                        variant="contained"
                        color="primary"
                        startIcon={isPlacingOrders ? <CircularProgress size={16} /> : null}
                    >
                        {isPlacingOrders ? 'Placing Orders...' : 'Confirm Orders'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};
export default OptionsSpreadCombinationsTable;