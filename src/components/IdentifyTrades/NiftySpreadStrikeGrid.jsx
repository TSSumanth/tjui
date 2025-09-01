import React, { useState, useEffect } from 'react';
import { 
    Box, 
    Grid, 
    Typography, 
    Card, 
    CardContent,
    Chip,
    Button,
    CircularProgress
} from '@mui/material';
import { 
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
    Lock as LockIcon
} from '@mui/icons-material';
import { 
    getNearestStrike, 
    calculateIntrinsicValue, 
    isOptionUndervalued, 
    getDiscountPercentage 
} from './utils';
import { getNiftyOptions, fetchLTPs } from '../../services/zerodha/api';
import TradeCombinationsTable from './TradeCombinationsTable';

/**
 * NiftySpreadStrikeGrid - Displays strike prices specifically for Nifty Bull Put Spread and Bear Call Spread strategies
 * 
 * For Bull Put Spread (PE): Generates strikes from lower (OTM) to higher (ITM) for put options
 * For Bear Call Spread (CE): Generates strikes from lower (ITM) to higher (OTM) for call options
 */
const NiftySpreadStrikeGrid = ({ niftyCMP, expiry, type, onStrikeSelect, autoFetchOnMount = false }) => {
    const [strikes, setStrikes] = useState([]);
    const [nearestStrike, setNearestStrike] = useState(null);
    const [realInstruments, setRealInstruments] = useState([]);
    const [isLoadingInstruments, setIsLoadingInstruments] = useState(false);
    const [ltpData, setLtpData] = useState({});
    const [isLoadingLTP, setIsLoadingLTP] = useState(false);
    const [lastLTPUpdate, setLastLTPUpdate] = useState(null);

    useEffect(() => {
        if (niftyCMP && type) {
            calculateStrikes();
        }
    }, [niftyCMP, type]);

    // Auto-refresh LTPs every 30 seconds when real instruments are loaded
    useEffect(() => {
        let intervalId;
        
        if (realInstruments.length > 0 && Object.keys(ltpData).length > 0) {
            intervalId = setInterval(() => {
                console.log('🔄 Auto-refreshing LTPs...');
                refreshLTPs();
            }, 30000); // 30 seconds
        }
        
        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [realInstruments.length, Object.keys(ltpData).length]);

    // Note: Data is only cleared when:
    // 1. User explicitly clicks "Fetch Real Data" button
    // 2. Strategy or type changes (which recalculates strikes)
    // 3. NOT when typing in expiry field (to avoid premature clearing)

    // Auto-fetch real data when component mounts (triggered by Identify button)
    useEffect(() => {
        if (autoFetchOnMount && niftyCMP && expiry && type && strikes.length > 0) {
            console.log('🚀 Auto-fetching real data on mount (Identify button clicked)');
            // Small delay to ensure component is fully rendered
            const timer = setTimeout(() => {
                fetchRealInstruments();
            }, 100);
            
            return () => clearTimeout(timer);
        }
    }, [autoFetchOnMount, niftyCMP, expiry, type, strikes.length]);

    const calculateStrikes = () => {
        const cmp = parseFloat(niftyCMP);
        if (isNaN(cmp)) return;

        // Get nearest strike (rounds to nearest 50)
        const nearest = getNearestStrike(cmp);
        setNearestStrike(nearest);

        // Generate 11 strikes based on strategy type
        const strikeList = [];
        const strikeIncrement = 50;

        if (type === 'PE') {
            // For Bull Put Spread (PE): 
            // - Sell Put at higher strike (ITM - closer to current price)
            // - Buy Put at lower strike (OTM - further below current price)
            // Generate strikes going UPWARDS from nearest (24500, 24550, 24600, 24650...)
            for (let i = 0; i < 11; i++) {
                strikeList.push(nearest + (i * strikeIncrement));
            }
        } else if (type === 'CE') {
            // For Bear Call Spread (CE):
            // - Sell Call at lower strike (ITM - closer to current price)
            // - Buy Call at higher strike (OTM - further above current price)
            // Generate strikes going DOWNWARDS from nearest (24500, 24450, 24400, 24350...)
            for (let i = 0; i < 11; i++) {
                strikeList.push(nearest - (i * strikeIncrement));
            }
            // Reverse to show strikes in descending order (higher to lower)
            strikeList.reverse();
        }

        setStrikes(strikeList);
    };

    const getStrikeColor = (strike) => {
        if (!niftyCMP) return 'default';
        
        const cmp = parseFloat(niftyCMP);
        const nearest = getNearestStrike(cmp);
        
        if (strike === nearest) return 'primary';
        
        if (type === 'PE') {
            // For Bull Put Spread (PE):
            // - Higher strikes are ITM (closer to current price)
            // - Lower strikes are OTM (further below current price)
            if (strike > cmp) return 'success'; // ITM
            if (strike < cmp) return 'warning'; // OTM
        } else if (type === 'CE') {
            // For Bear Call Spread (CE):
            // - Lower strikes are ITM (closer to current price)
            // - Higher strikes are OTM (further above current price)
            if (strike < cmp) return 'success'; // ITM
            if (strike > cmp) return 'warning'; // OTM
        }
        
        return 'default';
    };

    const getStrikeLabel = (strike) => {
        if (!niftyCMP) return '';
        
        const cmp = parseFloat(niftyCMP);
        const nearest = getNearestStrike(cmp);
        
        if (strike === nearest) return 'ATM';
        
        if (type === 'PE') {
            // For Bull Put Spread (PE):
            if (strike > cmp) return 'ITM'; // Higher strikes are ITM for puts
            if (strike < cmp) return 'OTM'; // Lower strikes are OTM for puts
        } else if (type === 'CE') {
            // For Bear Call Spread (CE):
            if (strike < cmp) return 'ITM'; // Lower strikes are ITM for calls
            if (strike > cmp) return 'OTM'; // Higher strikes are OTM for calls
        }
        
        return '';
    };

    const handleStrikeClick = (strike) => {
        if (onStrikeSelect) {
            onStrikeSelect(strike);
        }
    };

    const fetchRealInstruments = async () => {
        if (!expiry || !type) {
            console.log('Missing expiry or type for fetching real instruments');
            return;
        }

        try {
            setIsLoadingInstruments(true);
            const isAutoFetch = autoFetchOnMount && realInstruments.length === 0;
            console.log(`🔄 Fetching real instruments:`, { 
                expiry, 
                type, 
                niftyCMP, 
                autoFetch: isAutoFetch ? 'Yes (Identify button)' : 'No (Manual refresh)' 
            });
            
            // Clear old data only when actually fetching new data
            setRealInstruments([]);
            setLtpData({});
            setLastLTPUpdate(null);
            
            const cmp = parseFloat(niftyCMP);
            const nearest = getNearestStrike(cmp);
            let strikeMin, strikeMax;
            // Get strikes in the range (nearest ± 500 points)
            if(type === 'PE'){
                 // For Bull Put Spread (PE): strikes going UPWARDS from nearest
                 strikeMin = nearest;
                 strikeMax = nearest + 550;
            } else if(type === 'CE'){
                // For Bear Call Spread (CE): strikes going DOWNWARDS from nearest
                strikeMin = nearest - 550;
                strikeMax = nearest;
            }
            
            
            // Ensure strike range is valid (min <= max)
            if (strikeMin > strikeMax) {
                console.error('❌ Invalid strike range:', { strikeMin, strikeMax, type });
                // Swap if needed
                [strikeMin, strikeMax] = [strikeMax, strikeMin];
                console.log('🔄 Swapped strike range to:', { strikeMin, strikeMax });
            }
            
            console.log(`🔍 Fetching real instruments: ${type} options, expiry: ${expiry}, strikes: ${strikeMin}-${strikeMax}`);
            console.log(`📊 API call parameters:`, { expiry, type, strikeMin, strikeMax });
            
            const response = await getNiftyOptions(expiry, strikeMin, strikeMax, type);
            
            if (response && response.success && response.data) {
                setRealInstruments(response.data);
                console.log(`✅ Fetched ${response.data.length} real instruments:`, response.data);
                
                // Automatically fetch LTPs for the new instruments
                await fetchLTPsForInstruments(response.data);
            } else {
                console.log('⚠️ No real instruments data received');
                console.log('📊 Response details:', response);
            }
        } catch (error) {
            console.error('❌ Error fetching real instruments:', error);
            // Show error details to user
            if (error.response) {
                console.error('📊 Error response:', error.response.data);
                console.error('📊 Error status:', error.response.status);
            }
        } finally {
            setIsLoadingInstruments(false);
        }
    };

    const fetchLTPsForInstruments = async (instruments) => {
        if (!instruments || instruments.length === 0) {
            console.log('No instruments to fetch LTPs for');
            return;
        }

        try {
            setIsLoadingLTP(true);
            console.log(`🔍 Fetching LTPs for ${instruments.length} instruments`);
            console.log('📊 Instruments to fetch:', instruments.map(instr => `${instr.exchange}:${instr.tradingsymbol}`));
            
            // Prepare instruments for LTP fetch (need exchange and tradingsymbol)
            const ltpInstruments = instruments.map(instr => ({
                exchange: instr.exchange || 'NFO',
                tradingsymbol: instr.tradingsymbol
            }));

            console.log('🚀 Prepared LTP instruments:', ltpInstruments);
            const ltpMap = await fetchLTPs(ltpInstruments);
            console.log('📈 Raw LTP response:', ltpMap);
            
            setLtpData(ltpMap);
            setLastLTPUpdate(new Date());
            
            console.log(`✅ Fetched LTPs for ${Object.keys(ltpMap).length} instruments:`, ltpMap);
            
            if (Object.keys(ltpMap).length === 0) {
                console.warn('⚠️ No LTPs were fetched. This might indicate a backend issue or no market data available.');
            }
        } catch (error) {
            console.error('❌ Error fetching LTPs:', error);
        } finally {
            setIsLoadingLTP(false);
        }
    };

    const refreshLTPs = async () => {
        if (realInstruments.length > 0) {
            await fetchLTPsForInstruments(realInstruments);
        }
    };

    if (!niftyCMP || !type) {
        return (
            <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                    Enter Nifty CMP and select Type to view strike prices
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ mt: 2 }}>
            {/* Header */}
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Nifty Strike Price Analysis
                </Typography>
                <Chip 
                    label={type === 'PE' ? 'Bull Put Spread' : 'Bear Call Spread'} 
                    color={type === 'PE' ? 'success' : 'error'}
                    size="small"
                    icon={type === 'PE' ? <TrendingUpIcon /> : <TrendingDownIcon />}
                />
            </Box>

            {/* Current Market Info */}
            <Card sx={{ mb: 2, bgcolor: 'grey.50' }}>
                <CardContent sx={{ py: 1.5, px: 2 }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={4}>
                            <Typography variant="body2" color="text.secondary">
                                Nifty CMP
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                ₹{parseFloat(niftyCMP).toLocaleString()}
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Typography variant="body2" color="text.secondary">
                                Nearest Strike
                            </Typography>
                            <Typography variant="h6" color="primary" sx={{ fontWeight: 600 }}>
                                ₹{nearestStrike?.toLocaleString()}
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Typography variant="body2" color="text.secondary">
                                Expiry
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                {expiry || 'Not selected'}
                            </Typography>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* Strike Prices Grid */}
            <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                            Available Strikes & Market Data
                        </Typography>
                        {realInstruments.length > 0 && (
                            <Typography variant="caption" color="success.main" sx={{ display: 'block' }}>
                                📊 Real data loaded for {realInstruments.length} strikes
                            </Typography>
                        )}
                        {Object.keys(ltpData).length > 0 && (
                            <Typography variant="caption" color="info.main" sx={{ display: 'block' }}>
                                💰 LTP data: {Object.keys(ltpData).length} instruments | Last update: {lastLTPUpdate ? lastLTPUpdate.toLocaleTimeString() : 'N/A'}
                                {isLoadingLTP && ' | 🔄 Refreshing...'}
                            </Typography>
                        )}
                        {expiry && realInstruments.length === 0 && (
                            <Typography variant="caption" color="warning.main" sx={{ display: 'block' }}>
                                ⚠️ Click "Fetch Real Data" to load market data for {expiry}
                            </Typography>
                        )}
                        {isLoadingInstruments && (
                            <Typography variant="caption" color="info.main" sx={{ display: 'block' }}>
                                🔄 Loading market data for {expiry}...
                                {autoFetchOnMount && ' (Auto-fetching...)'}
                            </Typography>
                        )}
                    </Box>
                    
                    {/* Action Buttons */}
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        {/* Fetch Real Instruments Button */}
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={fetchRealInstruments}
                            disabled={isLoadingInstruments || !expiry}
                            startIcon={isLoadingInstruments ? <CircularProgress size={16} /> : null}
                            sx={{ height: 32 }}
                            title="Manually refresh market data"
                        >
                            {isLoadingInstruments ? 'Fetching...' : '🔄 Refresh Data'}
                        </Button>
                        
                        {/* Refresh LTP Button */}
                        {realInstruments.length > 0 && (
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={refreshLTPs}
                                disabled={isLoadingLTP}
                                startIcon={isLoadingLTP ? <CircularProgress size={16} /> : null}
                                sx={{ height: 32 }}
                                title={`Refresh real-time LTP data${lastLTPUpdate ? ` (Last: ${lastLTPUpdate.toLocaleTimeString()})` : ''}`}
                            >
                                {isLoadingLTP ? 'Refreshing...' : '💰 Refresh LTP'}
                            </Button>
                        )}
                    </Box>
                </Box>
                
                {/* Strategy-specific explanation */}
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                    {type === 'PE' ? (
                        '💡 Bull Put Spread: Sell Put at higher strikes (ITM: 24500→25000), Buy Put at lower strikes (OTM: 24450→24400)'
                    ) : (
                        '💡 Bear Call Spread: Sell Call at lower strikes (ITM: 24500→24000), Buy Call at higher strikes (OTM: 24550→25000)'
                    )}
                </Typography>
                <Grid container spacing={1}>
                                                        {strikes.map((strike, index) => {
                        // Find matching real instrument data for this strike
                        const realInstrument = realInstruments.find(instr => 
                            instr.strike === strike
                        );
                        
                        // Calculate undervalued option detection
                        const cmp = parseFloat(niftyCMP);
                        const currentLTP = realInstrument ? 
                            (ltpData[realInstrument.tradingsymbol] || realInstrument.last_price) : null;
                        const premium = currentLTP ? parseFloat(currentLTP) : null;
                        
                        const intrinsicValue = calculateIntrinsicValue(strike, type, cmp);
                        const isUndervalued = premium ? isOptionUndervalued(strike, type, cmp, premium) : false;
                        const discountPercentage = premium ? getDiscountPercentage(strike, type, cmp, premium) : null;
                        
                        return (
                            <Grid item xs={6} sm={4} md={3} lg={2} key={strike}>
                                <Card 
                                    sx={{ 
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                            transform: 'translateY(-2px)',
                                            boxShadow: 2
                                        },
                                        border: isUndervalued ? '2px solid' : (strike === nearestStrike ? '2px solid' : '1px solid'),
                                        borderColor: isUndervalued ? 'error.main' : (strike === nearestStrike ? 'primary.main' : 'grey.300'),
                                        // Highlight based on data availability and undervalued status
                                        bgcolor: isUndervalued ? 'error.50' : (realInstrument ? 'blue.50' : 'white')
                                    }}
                                    onClick={() => handleStrikeClick(strike)}
                                >
                                <CardContent sx={{ py: 1.5, px: 1.5, textAlign: 'center' }}>
                                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                                        ₹{strike.toLocaleString()}
                                    </Typography>
                                   
                                    <Chip 
                                        label={getStrikeLabel(strike)}
                                        size="small"
                                        color={getStrikeColor(strike)}
                                        variant={strike === nearestStrike ? 'filled' : 'outlined'}
                                        sx={{ fontSize: '0.7rem', mb: 0.5 }}
                                    />
                                    
                                    {/* Undervalued Option Indicator */}
                                    {isUndervalued && (
                                        <Chip
                                            label={`🔥 ${discountPercentage?.toFixed(1)}% off`}
                                            size="small"
                                            color="error"
                                            variant="filled"
                                            sx={{ 
                                                fontSize: '0.6rem', 
                                                height: 18, 
                                                mb: 0.5,
                                                display: 'block'
                                            }}
                                        />
                                    )}
                                    
                                    {/* Real Market Data */}
                                    {realInstrument ? (
                                        <Box sx={{ mt: 0.5, p: 0.5, bgcolor: 'blue.100', borderRadius: 1, border: '1px solid', borderColor: 'blue.200' }}>
                                            {/* Real-time LTP from fetchLTPs */}
                                            {ltpData[realInstrument.tradingsymbol] ? (
                                                <Box>
                                                    <Typography variant="caption" color="green.800" sx={{ display: 'block', fontWeight: 700, fontSize: '0.75rem' }}>
                                                        🚀 CMP: ₹{parseFloat(ltpData[realInstrument.tradingsymbol]).toFixed(2)}
                                                    </Typography>
                                                </Box>
                                            ) : (
                                                <Typography variant="caption" color="blue.800" sx={{ display: 'block', fontWeight: 600, fontSize: '0.7rem' }}>
                                                    💰 LTP: ₹{realInstrument.last_price ? parseFloat(realInstrument.last_price).toFixed(2) : 'N/A'}
                                                </Typography>
                                            )}
                                            
                                            <Typography variant="caption" color="blue.700" sx={{ fontSize: '0.65rem', display: 'block' }}>
                                                📊 {realInstrument.tradingsymbol}
                                            </Typography>
                                            {realInstrument.lot_size && (
                                                <Typography variant="caption" color="blue.600" sx={{ fontSize: '0.6rem', display: 'block' }}>
                                                    📦 Lot: {realInstrument.lot_size}
                                                </Typography>
                                            )}
                                        </Box>
                                    ) : (
                                        <Box sx={{ mt: 0.5, p: 0.5, bgcolor: 'grey.50', borderRadius: 1, border: '1px solid', borderColor: 'grey.200' }}>
                                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', fontStyle: 'italic' }}>
                                                📊 No market data
                                            </Typography>
                                        </Box>
                                    )}
                                    
                                    {/* ATM Indicator */}
                                    {strike === nearestStrike && (
                                        <Box sx={{ mt: 0.5 }}>
                                            <LockIcon fontSize="small" color="primary" />
                                        </Box>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                    );
                    })}
                </Grid>
            </Box>



            {/* Legend */}
            <Box sx={{ mt: 2, p: 1.5, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                    <strong>Legend:</strong>
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Chip label="ATM" size="small" color="primary" variant="filled" />
                        <Typography variant="caption">At-The-Money (Nearest)</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Chip label="ITM" size="small" color="success" variant="outlined" />
                        <Typography variant="caption">
                            {type === 'PE' ? 'In-The-Money (Higher strikes for puts)' : 'In-The-Money (Lower strikes for calls)'}
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Chip label="OTM" size="small" color="warning" variant="outlined" />
                        <Typography variant="caption">
                            {type === 'PE' ? 'Out-The-Money (Lower strikes for puts)' : 'Out-The-Money (Higher strikes for calls)'}
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Chip label="🔥 X% off" size="small" color="error" variant="filled" />
                        <Typography variant="caption">
                            Undervalued (LTP &lt; Intrinsic Value)
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {/* Trade Combinations Analysis */}
            {realInstruments.length > 0 && (
                <TradeCombinationsTable
                    strategyType={type}
                    niftyCMP={niftyCMP}
                    strikes={strikes}
                    realInstruments={realInstruments}
                    ltpData={ltpData}
                />
            )}
        </Box>
    );
};

export default NiftySpreadStrikeGrid;
