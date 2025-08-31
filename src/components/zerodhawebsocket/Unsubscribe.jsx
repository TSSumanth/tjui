import React, { useState } from 'react';
import {
    Box,
    Typography,
    Button,
    Paper,
    Stack,
    FormControl,
    Select,
    MenuItem,
    Alert,
    Snackbar,
    Chip,
    Tooltip,
    Badge
} from '@mui/material';
import { 
    RemoveCircleOutline as UnsubscribeIcon,
    SignalCellularAlt as SignalIcon,
    Warning as WarningIcon
} from '@mui/icons-material';
import { unsubscribeFromTokens } from '../../services/zerodha/webhook';

const Unsubscribe = ({ subscribed, onUnsubscribeSuccess }) => {
    const [unsubscribeToken, setUnsubscribeToken] = useState('');
    const [unsubLoading, setUnsubLoading] = useState(false);
    const [unsubError, setUnsubError] = useState('');
    const [unsubSuccess, setUnsubSuccess] = useState('');
    const [openUnsubSuccess, setOpenUnsubSuccess] = useState(false);
    const [openUnsubError, setOpenUnsubError] = useState(false);

    const handleUnsubscribe = async () => {
        setUnsubError('');
        setUnsubSuccess('');
        if (!unsubscribeToken) {
            setUnsubError('Please select a token to unsubscribe');
            setOpenUnsubError(true);
            return;
        }
        setUnsubLoading(true);
        try {
            await unsubscribeFromTokens([unsubscribeToken]);
            setUnsubSuccess('Unsubscribed successfully!');
            setOpenUnsubSuccess(true);
            setUnsubscribeToken('');
            if (onUnsubscribeSuccess) {
                onUnsubscribeSuccess();
            }
        } catch (err) {
            setUnsubError('Failed to unsubscribe');
            setOpenUnsubError(true);
        } finally {
            setUnsubLoading(false);
        }
    };

    // Snackbar close handlers
    const handleCloseUnsubSuccess = () => { setOpenUnsubSuccess(false); setUnsubSuccess(''); };
    const handleCloseUnsubError = () => { setOpenUnsubError(false); setUnsubError(''); };

    const selectedToken = subscribed.find(token => token.instrument_token === unsubscribeToken);

    return (
        <Box sx={{ flex: 1, minWidth: 280, maxWidth: '48%' }}>
            <Paper 
                elevation={2} 
                sx={{ 
                    p: 1.5, 
                    border: '1px solid',
                    borderColor: 'warning.200',
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #fff8f0 0%, #ffffff 100%)',
                    '&:hover': {
                        boxShadow: '0 4px 20px rgba(255, 152, 0, 0.15)',
                        borderColor: 'warning.300',
                        transition: 'all 0.3s ease'
                    }
                }}
            >
                {/* Header with Icon and Badge */}
                <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1, 
                    mb: 1.5,
                    pb: 1,
                    borderBottom: '1px solid',
                    borderColor: 'warning.100'
                }}>
                    <SignalIcon sx={{ color: 'warning.main', fontSize: 20 }} />
                    <Typography 
                        variant="subtitle1" 
                        fontWeight={600} 
                        sx={{ 
                            color: 'warning.main', 
                            fontSize: '0.9rem',
                            textTransform: 'uppercase',
                            letterSpacing: 0.5
                        }}
                    >
                        Unsubscribe
                    </Typography>
                    <Badge 
                        badgeContent={subscribed.length} 
                        color="warning"
                        sx={{ 
                            '& .MuiBadge-badge': { 
                                fontSize: '0.7rem',
                                height: 18,
                                minWidth: 18
                            }
                        }}
                    >
                        <Chip 
                            label="Active" 
                            size="small" 
                            sx={{ 
                                bgcolor: 'warning.50', 
                                color: 'warning.main',
                                fontSize: '0.7rem',
                                height: 20,
                                '& .MuiChip-label': { px: 1 }
                            }} 
                        />
                    </Badge>
                </Box>

                {/* Compact Input and Button Layout */}
                <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box sx={{ flex: 1, position: 'relative' }}>
                        <FormControl size="small" sx={{ width: '100%' }}>
                            <Select
                                value={unsubscribeToken}
                                onChange={e => setUnsubscribeToken(e.target.value)}
                                displayEmpty
                                size="small"
                                disabled={unsubLoading || subscribed.length === 0}
                                sx={{
                                    height: 36,
                                    fontSize: '0.8rem',
                                    '& .MuiSelect-select': {
                                        py: 0.5
                                    }
                                }}
                                startAdornment={
                                    subscribed.length === 0 ? (
                                        <WarningIcon sx={{ color: 'text.disabled', fontSize: 18, mr: 1 }} />
                                    ) : null
                                }
                            >
                                <MenuItem value="" disabled>
                                    {subscribed.length === 0 ? 'No active subscriptions' : 'Select token to unsubscribe'}
                                </MenuItem>
                                {subscribed.map(row => (
                                    <MenuItem key={row.instrument_token} value={row.instrument_token}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                                                {row.tradingsymbol ? row.tradingsymbol : 'Unknown'}
                                            </Typography>
                                            <Chip 
                                                label={row.instrument_token} 
                                                size="small" 
                                                sx={{ 
                                                    height: 16, 
                                                    fontSize: '0.6rem',
                                                    bgcolor: 'grey.100',
                                                    '& .MuiChip-label': { px: 0.5 }
                                                }} 
                                            />
                                        </Box>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                    
                    <Tooltip title={unsubscribeToken ? `Unsubscribe from ${selectedToken?.tradingsymbol || 'selected token'}` : 'Select a token first'}>
                        <span>
                            <Button
                                variant="contained"
                                color="error"
                                size="small"
                                onClick={handleUnsubscribe}
                                disabled={unsubLoading || !unsubscribeToken || subscribed.length === 0}
                                startIcon={<UnsubscribeIcon />}
                                sx={{ 
                                    minWidth: 100, 
                                    height: 36,
                                    fontWeight: 600, 
                                    fontSize: '0.75rem',
                                    textTransform: 'uppercase',
                                    borderRadius: 1.5,
                                    boxShadow: '0 2px 8px rgba(244, 67, 54, 0.3)',
                                    '&:hover': { 
                                        backgroundColor: '#c62828',
                                        boxShadow: '0 4px 12px rgba(244, 67, 54, 0.4)',
                                        transform: 'translateY(-1px)'
                                    },
                                    '&:disabled': {
                                        bgcolor: 'grey.300',
                                        color: 'grey.500'
                                    }
                                }}
                            >
                                {unsubLoading ? '...' : 'Unsubscribe'}
                            </Button>
                        </span>
                    </Tooltip>
                </Stack>

                {/* Status Indicator */}
                {selectedToken && (
                    <Box sx={{ 
                        mt: 1, 
                        p: 0.5, 
                        bgcolor: 'warning.50', 
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'warning.200'
                    }}>
                        <Typography variant="caption" color="warning.main" sx={{ fontSize: '0.7rem' }}>
                            📡 Currently subscribed to: {selectedToken.tradingsymbol} • {selectedToken.exchange}
                        </Typography>
                    </Box>
                )}

                {/* Empty State */}
                {subscribed.length === 0 && (
                    <Box sx={{ 
                        mt: 1, 
                        p: 0.5, 
                        bgcolor: 'grey.50', 
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'grey.200'
                    }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                            ℹ️ No active subscriptions to manage
                        </Typography>
                    </Box>
                )}
            </Paper>

            {/* Enhanced Snackbars */}
            <Snackbar open={openUnsubSuccess} autoHideDuration={3000} onClose={handleCloseUnsubSuccess} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                <Alert 
                    onClose={handleCloseUnsubSuccess} 
                    severity="success" 
                    sx={{ 
                        fontSize: 13,
                        borderRadius: 2,
                        boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)'
                    }}
                >
                    {unsubSuccess}
                </Alert>
            </Snackbar>
            <Snackbar open={openUnsubError} autoHideDuration={3000} onClose={handleCloseUnsubError} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                <Alert 
                    onClose={handleCloseUnsubError} 
                    severity="error" 
                    sx={{ 
                        fontSize: 13,
                        borderRadius: 2,
                        boxShadow: '0 4px 12px rgba(244, 67, 54, 0.3)'
                    }}
                >
                    {unsubError}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default Unsubscribe; 