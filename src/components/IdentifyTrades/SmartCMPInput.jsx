import React, { useState, useEffect } from 'react';
import { 
    Box, 
    TextField, 
    Typography, 
    Chip,
    CircularProgress,
    IconButton
} from '@mui/material';
import { TrendingUp as TrendingUpIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { getWebSocketSubscriptions } from '../../services/zerodha/webhook';

const SmartCMPInput = ({ 
    value, 
    onChange, 
    onWebSocketData, 
    assetName = 'Nifty', // Default to Nifty for backward compatibility
    label = null // Custom label, falls back to assetName + " CMP"
}) => {
    const [isLoading, setIsLoading] = useState(true);
    const [webSocketPrice, setWebSocketPrice] = useState(null);
    const [isManualInput, setIsManualInput] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        // Try to get Nifty CMP from WebSocket
        fetchNiftyCMP();
        
        // // Set up polling every 5 seconds to keep CMP updated
        // const intervalId = setInterval(fetchNiftyCMP, 5000);
        
        // // Cleanup interval on component unmount
        // return () => clearInterval(intervalId);
    }, []);

    // Handle external value changes (e.g., form reset, strategy change)
    useEffect(() => {
        if (value && value !== webSocketPrice) {
            console.log(`🔄 External value change detected:`, value);
            // If external value is provided and different from WebSocket price, 
            // switch to manual input mode
            setIsManualInput(true);
        }
    }, [value, webSocketPrice]);

    const fetchNiftyCMP = async () => {
        try {
            setIsLoading(true);
            setError('');
            
            // Try to get Nifty CMP from existing WebSocket subscriptions
            const response = await getWebSocketSubscriptions();
            
            if (response && response.success && response.data && Array.isArray(response.data)) {
                console.log('📊 WebSocket data received:', response.data);
                
                // Look for the specified asset instruments in the subscribed data
                const assetData = response.data.find(item => 
                    item.tradingsymbol && 
                    item.tradingsymbol.includes(assetName.toUpperCase()) && 
                    item.ltp
                );
                
                if (assetData && assetData.ltp) {
                    setWebSocketPrice(assetData.ltp);
                    onChange(assetData.ltp.toString());
                    onWebSocketData && onWebSocketData(assetData.ltp);
                    console.log(`✅ ${assetName} CMP fetched from WebSocket:`, assetData.ltp, 'Symbol:', assetData.tradingsymbol);
                    return;
                } else {
                    console.log(`⚠️ ${assetName} instrument not found in WebSocket data or no LTP available`);
                    console.log('🔍 Available instruments:', response.data.map(item => ({ 
                        symbol: item.tradingsymbol, 
                        ltp: item.ltp,
                        token: item.instrument_token 
                    })));
                    setError(`${assetName} not subscribed. Subscribe to ${assetName} instruments for live data.`);
                    setIsManualInput(true);
                    
                    // If we have a value prop, use it as fallback
                    if (value) {
                        console.log(`📝 Using existing value as fallback:`, value);
                    } else {
                        console.log(`⚠️ No value provided, user must enter manually`);
                    }
                }
            } else {
                console.log('⚠️ No WebSocket subscriptions data available');
                console.log('📊 Response received:', response);
                setError('No WebSocket data available.');
                setIsManualInput(true);
            }
            
        } catch (err) {
            console.log('❌ Error fetching WebSocket data:', err);
            setError('Failed to fetch WebSocket data.');
            setIsManualInput(true);
        } finally {
            setIsLoading(false);
        }
    };

    const handleManualInput = (e) => {
        const inputValue = e.target.value;
        onChange(inputValue);
        setIsManualInput(true);
    };

    const handleRefresh = () => {
        setIsManualInput(false);
        fetchNiftyCMP();
    };

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} />
                <Typography variant="body2" color="text.secondary">
                    Fetching {assetName} CMP...
                </Typography>
            </Box>
        );
    }

    return (
        <Box>
            {webSocketPrice && !isManualInput ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TextField
                        fullWidth
                        label={label || `${assetName} CMP`}
                        value={webSocketPrice}
                        InputProps={{ 
                            readOnly: true,
                            endAdornment: (
                                <IconButton
                                    size="small"
                                    onClick={handleRefresh}
                                    sx={{ 
                                        color: 'primary.main',
                                        '&:hover': { 
                                            backgroundColor: 'primary.50',
                                            transform: 'scale(1.1)'
                                        },
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <RefreshIcon fontSize="small" />
                                </IconButton>
                            )
                        }}
                        size="small"
                        sx={{ bgcolor: 'success.50' }}
                    />
                    <Chip
                        icon={<TrendingUpIcon />}
                        label="Live"
                        color="success"
                        size="small"
                        sx={{ fontSize: '0.7rem', height: 24 }}
                    />
                </Box>
            ) : (
                <Box>
                    <TextField
                        fullWidth
                        label={label || `${assetName} CMP`}
                        value={value || ''}
                        onChange={handleManualInput}
                        placeholder="Enter price manually"
                        type="number"
                        InputProps={{
                            endAdornment: (
                                <IconButton
                                    size="small"
                                    onClick={handleRefresh}
                                    sx={{ 
                                        color: 'primary.main',
                                        '&:hover': { 
                                            backgroundColor: 'primary.50',
                                            transform: 'scale(1.1)'
                                        },
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <RefreshIcon fontSize="small" />
                                </IconButton>
                            )
                        }}
                        size="small"
                        sx={{ bgcolor: 'warning.50' }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        💡 Enter {assetName} current market price manually
                    </Typography>
                </Box>
            )}
            
            {error && (
                <Typography 
                    variant="caption" 
                    color="warning.main" 
                    sx={{ 
                        mt: 1, 
                        display: 'block',
                        fontSize: '0.75rem',
                        fontStyle: 'italic'
                    }}
                >
                    ⚠️ {error}
                </Typography>
            )}
        </Box>
    );
};

export default SmartCMPInput;
