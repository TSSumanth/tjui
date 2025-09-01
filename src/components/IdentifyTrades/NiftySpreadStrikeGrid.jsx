import React, { useState, useEffect } from 'react';
import { 
    Box, 
    Grid, 
    Typography, 
    Card, 
    CardContent,
    Chip,
    Divider,
    Button,
    CircularProgress
} from '@mui/material';
import { 
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
    Lock as LockIcon
} from '@mui/icons-material';
import { getNearestStrike } from './utils';
import { getNiftyOptions } from '../../services/zerodha/api';

/**
 * NiftySpreadStrikeGrid - Displays strike prices specifically for Nifty Bull Put Spread and Bear Call Spread strategies
 * 
 * For Bull Put Spread (PE): Generates strikes from lower (OTM) to higher (ITM) for put options
 * For Bear Call Spread (CE): Generates strikes from lower (ITM) to higher (OTM) for call options
 */
const NiftySpreadStrikeGrid = ({ niftyCMP, expiry, type, onStrikeSelect }) => {
    const [strikes, setStrikes] = useState([]);
    const [nearestStrike, setNearestStrike] = useState(null);
    const [realInstruments, setRealInstruments] = useState([]);
    const [isLoadingInstruments, setIsLoadingInstruments] = useState(false);

    useEffect(() => {
        if (niftyCMP && type) {
            calculateStrikes();
        }
    }, [niftyCMP, type]);

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
            const cmp = parseFloat(niftyCMP);
            const nearest = getNearestStrike(cmp);
            
            // Get strikes in the range (nearest ± 500 points)
            const strikeMin = nearest - 500;
            const strikeMax = nearest + 500;
            
            console.log(`🔍 Fetching real instruments: ${type} options, expiry: ${expiry}, strikes: ${strikeMin}-${strikeMax}`);
            
            const response = await getNiftyOptions(expiry, strikeMin, strikeMax, type);
            
            if (response && response.success && response.data) {
                setRealInstruments(response.data);
                console.log(`✅ Fetched ${response.data.length} real instruments:`, response.data);
            } else {
                console.log('⚠️ No real instruments data received');
            }
        } catch (error) {
            console.error('❌ Error fetching real instruments:', error);
        } finally {
            setIsLoadingInstruments(false);
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
                    </Box>
                    
                    {/* Fetch Real Instruments Button */}
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={fetchRealInstruments}
                        disabled={isLoadingInstruments || !expiry}
                        startIcon={isLoadingInstruments ? <CircularProgress size={16} /> : null}
                        sx={{ height: 32 }}
                    >
                        {isLoadingInstruments ? 'Fetching...' : 'Fetch Real Data'}
                    </Button>
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
                                        border: strike === nearestStrike ? '2px solid' : '1px solid',
                                        borderColor: strike === nearestStrike ? 'primary.main' : 'grey.300',
                                        // Highlight if real data is available
                                        bgcolor: realInstrument ? 'blue.50' : 'white'
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
                                    
                                    {/* Real Market Data */}
                                    {realInstrument ? (
                                        <Box sx={{ mt: 0.5, p: 0.5, bgcolor: 'blue.100', borderRadius: 1, border: '1px solid', borderColor: 'blue.200' }}>
                                            <Typography variant="caption" color="blue.800" sx={{ display: 'block', fontWeight: 600, fontSize: '0.7rem' }}>
                                                💰 LTP: ₹{realInstrument.last_price ? parseFloat(realInstrument.last_price).toFixed(2) : 'N/A'}
                                            </Typography>
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
                </Box>
            </Box>
        </Box>
    );
};

export default NiftySpreadStrikeGrid;
