import React, { useState } from 'react';
import {
    Box,
    Typography,
    Button,
    TextField,
    Paper,
    Stack,
    Autocomplete,
    Alert,
    Snackbar,
    Chip,
    IconButton,
    Tooltip
} from '@mui/material';
import { 
    AddCircleOutline as SubscribeIcon,
    Search as SearchIcon,
    TrendingUp as TrendingIcon
} from '@mui/icons-material';
import { getInstruments } from '../../services/zerodha/api';
import { subscribeToTokens } from '../../services/zerodha/webhook';

const Subscribe = ({ onSubscribeSuccess }) => {
    const [selectedInstrument, setSelectedInstrument] = useState(null);
    const [options, setOptions] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [openSuccess, setOpenSuccess] = useState(false);
    const [openError, setOpenError] = useState(false);

    const handleInputChange = async (event, value) => {
        if (!value || value.length < 2) {
            setOptions([]);
            return;
        }
        setSearchLoading(true);
        try {
            const resp = await getInstruments({ search: value });
            if (resp.success) setOptions(resp.data);
            else setOptions([]);
        } catch {
            setOptions([]);
        } finally {
            setSearchLoading(false);
        }
    };

    const handleSubscribe = async () => {
        setError('');
        setSuccess('');
        if (!selectedInstrument) {
            setError('Please select an instrument');
            setOpenError(true);
            return;
        }
        setLoading(true);
        try {
            await subscribeToTokens([selectedInstrument.instrument_token.toString()]);
            setSuccess('Subscribed successfully!');
            setOpenSuccess(true);
            setSelectedInstrument(null);
            if (onSubscribeSuccess) {
                onSubscribeSuccess();
            }
        } catch (err) {
            setError('Failed to subscribe: ' + err.message);
            setOpenError(true);
        } finally {
            setLoading(false);
        }
    };

    // Snackbar close handlers
    const handleCloseSuccess = () => { setOpenSuccess(false); setSuccess(''); };
    const handleCloseError = () => { setOpenError(false); setError(''); };

    return (
        <Box sx={{ flex: 1, minWidth: 280, maxWidth: '48%' }}>
            <Paper 
                elevation={2} 
                sx={{ 
                    p: 1.5, 
                    border: '1px solid',
                    borderColor: 'primary.200',
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%)',
                    '&:hover': {
                        boxShadow: '0 4px 20px rgba(25, 118, 210, 0.15)',
                        borderColor: 'primary.300',
                        transition: 'all 0.3s ease'
                    }
                }}
            >
                {/* Header with Icon */}
                <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1, 
                    mb: 1.5,
                    pb: 1,
                    borderBottom: '1px solid',
                    borderColor: 'primary.100'
                }}>
                    <TrendingIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                    <Typography 
                        variant="subtitle1" 
                        fontWeight={600} 
                        sx={{ 
                            color: 'primary.main', 
                            fontSize: '0.9rem',
                            textTransform: 'uppercase',
                            letterSpacing: 0.5
                        }}
                    >
                        Subscribe
                    </Typography>
                    <Chip 
                        label="Live Data" 
                        size="small" 
                        sx={{ 
                            bgcolor: 'success.50', 
                            color: 'success.main',
                            fontSize: '0.7rem',
                            height: 20,
                            '& .MuiChip-label': { px: 1 }
                        }} 
                    />
                </Box>

                {/* Compact Input and Button Layout */}
                <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box sx={{ flex: 1, position: 'relative' }}>
                        <Autocomplete
                            options={options}
                            getOptionLabel={option => `${option.tradingsymbol} (${option.name}) [${option.instrument_token}]`}
                            filterOptions={x => x}
                            onInputChange={handleInputChange}
                            onChange={(e, value) => setSelectedInstrument(value)}
                            value={selectedInstrument}
                            loading={searchLoading}
                            size="small"
                            renderInput={params => (
                                <TextField
                                    {...params}
                                    placeholder="Search instrument..."
                                    size="small"
                                    variant="outlined"
                                    disabled={loading}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            bgcolor: 'white',
                                            height: 36,
                                            fontSize: '0.8rem',
                                            '& .MuiOutlinedInput-input': {
                                                py: 0.5
                                            }
                                        }
                                    }}
                                    InputProps={{
                                        ...params.InputProps,
                                        startAdornment: (
                                            <SearchIcon sx={{ color: 'text.secondary', fontSize: 18, mr: 1 }} />
                                        )
                                    }}
                                />
                            )}
                        />
                    </Box>
                    
                    <Tooltip title={selectedInstrument ? `Subscribe to ${selectedInstrument.tradingsymbol}` : 'Select an instrument first'}>
                        <span>
                            <Button
                                variant="contained"
                                color="success"
                                size="small"
                                onClick={handleSubscribe}
                                disabled={loading || !selectedInstrument}
                                startIcon={<SubscribeIcon />}
                                sx={{ 
                                    minWidth: 100, 
                                    height: 36,
                                    fontWeight: 600, 
                                    fontSize: '0.75rem',
                                    textTransform: 'uppercase',
                                    borderRadius: 1.5,
                                    boxShadow: '0 2px 8px rgba(76, 175, 80, 0.3)',
                                    '&:hover': { 
                                        backgroundColor: '#2e7d32',
                                        boxShadow: '0 4px 12px rgba(76, 175, 80, 0.4)',
                                        transform: 'translateY(-1px)'
                                    },
                                    '&:disabled': {
                                        bgcolor: 'grey.300',
                                        color: 'grey.500'
                                    }
                                }}
                            >
                                {loading ? '...' : 'Subscribe'}
                            </Button>
                        </span>
                    </Tooltip>
                </Stack>

                {/* Status Indicator */}
                {selectedInstrument && (
                    <Box sx={{ 
                        mt: 1, 
                        p: 0.5, 
                        bgcolor: 'info.50', 
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'info.200'
                    }}>
                        <Typography variant="caption" color="info.main" sx={{ fontSize: '0.7rem' }}>
                            📊 {selectedInstrument.tradingsymbol} • {selectedInstrument.exchange} • Token: {selectedInstrument.instrument_token}
                        </Typography>
                    </Box>
                )}
            </Paper>

            {/* Enhanced Snackbars */}
            <Snackbar open={openSuccess} autoHideDuration={3000} onClose={handleCloseSuccess} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                <Alert 
                    onClose={handleCloseSuccess} 
                    severity="success" 
                    sx={{ 
                        fontSize: 13,
                        borderRadius: 2,
                        boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)'
                    }}
                >
                    {success}
                </Alert>
            </Snackbar>
            <Snackbar open={openError} autoHideDuration={3000} onClose={handleCloseError} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                <Alert 
                    onClose={handleCloseError} 
                    severity="error" 
                    sx={{ 
                        fontSize: 13,
                        borderRadius: 2,
                        boxShadow: '0 4px 12px rgba(244, 67, 54, 0.3)'
                    }}
                >
                    {error}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default Subscribe; 