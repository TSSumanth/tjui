import React, { useState } from 'react';
import { 
    Dialog, 
    DialogTitle, 
    DialogContent, 
    DialogActions, 
    Button, 
    TextField, 
    MenuItem, 
    Typography, 
    Box, 
    Grid, 
    Card, 
    CardContent, 
    Divider, 
    Chip, 
    Alert, 
    LinearProgress,
    IconButton,
    Tooltip,
    Checkbox,
    FormControlLabel
} from '@mui/material';
import { 
    Close as CloseIcon,
    Add as AddIcon,
    Warning as WarningIcon,
    CheckCircle as CheckCircleIcon,
    Info as InfoIcon,
    SelectAll as SelectAllIcon,
    Clear as ClearIcon
} from '@mui/icons-material';
import { createAutomatedOrder } from '../../services/automatedOrders';
import { updateAlgoStrategy } from '../../services/algoStrategies';

const ORDER_TYPES = ['LIMIT', 'MARKET'];

const CreateAutomatedOrderPopup = ({ open, onClose, positions = [], onSuccess, strategyDetails }) => {
    // State for each position's order type and price
    const [orderStates, setOrderStates] = useState(() =>
        positions.map(pos => ({ order_type: 'MARKET', price: '', ...pos }))
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedPositions, setSelectedPositions] = useState(new Set());

    // Filter to show only open positions (quantity !== 0)
    const openPositions = positions.filter(pos => pos.quantity !== 0);

    React.useEffect(() => {
        // Reset state when positions or open changes
        const newOrderStates = openPositions.map(pos => ({ order_type: 'MARKET', price: '', ...pos }));
        setOrderStates(newOrderStates);
        setSelectedPositions(new Set());
        setError('');
    }, [positions, open]);

    const handleOrderTypeChange = (idx, value) => {
        setOrderStates(prev => prev.map((o, i) => i === idx ? { ...o, order_type: value, price: value === 'MARKET' ? '' : o.price } : o));
    };
    
    const handlePriceChange = (idx, value) => {
        setOrderStates(prev => prev.map((o, i) => i === idx ? { ...o, price: value } : o));
    };

    const handlePositionSelect = (positionIndex) => {
        setSelectedPositions(prev => {
            const newSet = new Set(prev);
            if (newSet.has(positionIndex)) {
                newSet.delete(positionIndex);
            } else {
                newSet.add(positionIndex);
            }
            return newSet;
        });
    };

    const handleSelectAll = () => {
        setSelectedPositions(new Set(openPositions.map((_, index) => index)));
    };

    const handleClearAll = () => {
        setSelectedPositions(new Set());
    };

    const handleSubmit = async () => {
        if (selectedPositions.size === 0) {
            setError('Please select at least one position to create orders for.');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const createdOrderIds = [];
            const selectedOrderStates = Array.from(selectedPositions).map(index => orderStates[index]);
            
            for (const order of selectedOrderStates) {
                const created = await createAutomatedOrder({
                    instrument_token: order.instrument_token,
                    trading_symbol: order.tradingsymbol,
                    exchange: order.exchange,
                    product: order.product,
                    quantity: Math.abs(order.quantity),
                    transaction_type: order.transaction_type?.toUpperCase() === "BUY" ? "SELL" : "BUY",
                    validity: 'IOC',
                    order_type: order.order_type,
                    price: order.order_type === 'LIMIT' ? order.price : undefined,
                    status: 'OPEN',
                    strategy_id: strategyDetails.strategyid,
                });
                if (created && created.id) {
                    createdOrderIds.push(created.id);
                } else if (created && created.orderid) {
                    createdOrderIds.push(created.orderid);
                }
            }
            // Update the strategy with new automated_order_ids
            if (strategyDetails.strategyid && createdOrderIds.length > 0) {
                if(Array.isArray(strategyDetails.automated_order_ids) && strategyDetails.automated_order_ids.length > 0){
                    const updatedAutomatedOrderIds = [...strategyDetails.automated_order_ids, ...createdOrderIds];
                    await updateAlgoStrategy(strategyDetails.strategyid, { automated_order_ids: updatedAutomatedOrderIds });
                }else{
                    await updateAlgoStrategy(strategyDetails.strategyid, { automated_order_ids: createdOrderIds });
                }
            }
            onSuccess && onSuccess();
            onClose();
        } catch (err) {
            setError(err?.response?.data?.error || err.message || 'Failed to create automated orders');
        }
        setLoading(false);
    };

    const getTransactionTypeColor = (type) => {
        return type === 'BUY' ? 'success' : 'error';
    };

    const getQuantityColor = (quantity) => {
        return quantity > 0 ? 'success' : 'error';
    };

    return (
        <Dialog 
            open={open} 
            onClose={onClose} 
            maxWidth="md" 
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                    maxHeight: '85vh'
                }
            }}
        >
            <DialogTitle sx={{ 
                pb: 1, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                borderBottom: '1px solid #e0e0e0',
                mb: 0
            }}>
                <Typography variant="h6" fontWeight={600}>
                    Create Automated Orders
                </Typography>
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 2 }}>
                {loading && (
                    <Box sx={{ mb: 2 }}>
                        <LinearProgress />
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Creating automated orders...
                        </Typography>
                    </Box>
                )}

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}

                {openPositions.length === 0 ? (
                    <Box sx={{ 
                        textAlign: 'center', 
                        py: 4,
                        color: 'text.secondary'
                    }}>
                        <InfoIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                        <Typography variant="h6" gutterBottom>
                            No Open Positions Found
                        </Typography>
                        <Typography variant="body2">
                            There are no open positions in this strategy to create exit orders for.
                        </Typography>
                    </Box>
                ) : (
                    <>
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                                Strategy: {strategyDetails?.strategy_type || 'N/A'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Select positions to create exit orders for. Found {openPositions.length} open position{openPositions.length > 1 ? 's' : ''}.
                            </Typography>
                        </Box>

                        {/* Selection Controls */}
                        <Box sx={{ 
                            mb: 2, 
                            p: 1.5, 
                            bgcolor: 'grey.50', 
                            borderRadius: 2,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: 1
                        }}>
                            <Typography variant="subtitle2">
                                Selected: {selectedPositions.size} of {openPositions.length} positions
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    startIcon={<SelectAllIcon />}
                                    onClick={handleSelectAll}
                                    disabled={selectedPositions.size === openPositions.length}
                                >
                                    Select All
                                </Button>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    startIcon={<ClearIcon />}
                                    onClick={handleClearAll}
                                    disabled={selectedPositions.size === 0}
                                >
                                    Clear All
                                </Button>
                            </Box>
                        </Box>

                        <Grid container spacing={1.5}>
                            {openPositions.map((pos, idx) => {
                                const isSelected = selectedPositions.has(idx);
                                return (
                                    <Grid item xs={12} key={pos.instrument_token}>
                                        <Card 
                                            elevation={isSelected ? 4 : 2}
                                            sx={{ 
                                                borderRadius: 2,
                                                border: isSelected ? '2px solid' : '1px solid',
                                                borderColor: isSelected ? 'primary.main' : '#e0e0e0',
                                                bgcolor: isSelected ? 'primary.50' : 'background.paper',
                                                '&:hover': {
                                                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                                                    borderColor: 'primary.main'
                                                },
                                                transition: 'all 0.2s ease-in-out'
                                            }}
                                        >
                                            <CardContent sx={{ p: 1.5 }}>
                                                {/* Header with Checkbox */}
                                                <Box sx={{ 
                                                    display: 'flex', 
                                                    justifyContent: 'space-between', 
                                                    alignItems: 'center',
                                                    mb: 1.5
                                                }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <FormControlLabel
                                                            control={
                                                                <Checkbox
                                                                    checked={isSelected}
                                                                    onChange={() => handlePositionSelect(idx)}
                                                                    color="primary"
                                                                />
                                                            }
                                                            label=""
                                                            sx={{ mr: 0 }}
                                                        />
                                                        <Typography variant="h6" fontWeight={600}>
                                                            {pos.tradingsymbol}
                                                        </Typography>
                                                    </Box>
                                                    <Chip 
                                                        label={`Position ${idx + 1}`}
                                                        size="small"
                                                        color="primary"
                                                        variant="outlined"
                                                    />
                                                </Box>

                                                <Divider sx={{ mb: 1.5 }} />

                                                {/* Position Details - Compact Layout with Current Position */}
                                                <Box sx={{ 
                                                    display: 'flex', 
                                                    justifyContent: 'space-between', 
                                                    alignItems: 'center',
                                                    mb: 1.5,
                                                    p: 1.5,
                                                    bgcolor: 'grey.50',
                                                    borderRadius: 1
                                                }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            <Typography variant="caption" color="text.secondary">
                                                                Token:
                                                            </Typography>
                                                            <Typography variant="body2" fontWeight={500} sx={{ ml: 0.5 }}>
                                                                {pos.instrument_token}
                                                            </Typography>
                                                        </Box>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            <Typography variant="caption" color="text.secondary">
                                                                Exchange:
                                                            </Typography>
                                                            <Typography variant="body2" fontWeight={500} sx={{ ml: 0.5 }}>
                                                                {pos.exchange}
                                                            </Typography>
                                                        </Box>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            <Typography variant="caption" color="text.secondary">
                                                                Product:
                                                            </Typography>
                                                            <Typography variant="body2" fontWeight={500} sx={{ ml: 0.5 }}>
                                                                {pos.product}
                                                            </Typography>
                                                        </Box>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            <Typography variant="caption" color="text.secondary">
                                                                Validity:
                                                            </Typography>
                                                            <Typography variant="body2" fontWeight={500} sx={{ ml: 0.5 }}>
                                                                IOC
                                                            </Typography>
                                                        </Box>
                                                        <Box sx={{ 
                                                            display: 'flex', 
                                                            alignItems: 'center', 
                                                            gap: 0.5,
                                                            pl: 2,
                                                            borderLeft: '1px solid',
                                                            borderColor: 'grey.300'
                                                        }}>
                                                            <Typography variant="caption" color="text.secondary">
                                                                Transaction Type:
                                                            </Typography>
                                                            <Chip 
                                                                label={pos.transaction_type}
                                                                size="small"
                                                                color={getTransactionTypeColor(pos.transaction_type)}
                                                                sx={{ ml: 0.5 }}
                                                            />
                                                        </Box>
                                                        <Box sx={{ 
                                                            display: 'flex', 
                                                            alignItems: 'center', 
                                                            gap: 0.5,
                                                            pl: 2,
                                                            borderLeft: '1px solid',
                                                            borderColor: 'grey.300'
                                                        }}>
                                                            <Typography variant="caption" color="text.secondary">
                                                                Quantity:
                                                            </Typography>
                                                            <Chip 
                                                                label={pos.quantity}
                                                                size="small"
                                                                color={getQuantityColor(pos.quantity)}
                                                                sx={{ ml: 0.5 }}
                                                            />
                                                        </Box>
                                                    </Box>
                                                </Box>

                                                {/* Exit Order Configuration */}
                                                <Box sx={{ 
                                                    bgcolor: 'primary.50', 
                                                    p: 1, 
                                                    borderRadius: 1,
                                                    border: '1px solid',
                                                    borderColor: 'primary.200'
                                                }}>
                                                    <Typography variant="subtitle2" gutterBottom sx={{ color: 'primary.main', mb: 1 }}>
                                                        Exit Order Configuration
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            <Typography variant="caption" color="text.secondary">
                                                                Transaction:
                                                            </Typography>
                                                            <Chip 
                                                                label={pos.transaction_type?.toUpperCase() === "BUY" ? "SELL" : "BUY"}
                                                                size="small"
                                                                color={pos.transaction_type?.toUpperCase() === "BUY" ? "error" : "success"}
                                                                sx={{ ml: 0.5 }}
                                                            />
                                                        </Box>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            <Typography variant="caption" color="text.secondary">
                                                                Quantity:
                                                            </Typography>
                                                            <Chip 
                                                                label={Math.abs(pos.quantity)}
                                                                size="small"
                                                                color="primary"
                                                                sx={{ ml: 0.5 }}
                                                            />
                                                        </Box>
                                                        <Box sx={{ minWidth: 120 }}>
                                                            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
                                                                Order Type:
                                                            </Typography>
                                <TextField
                                    select
                                    value={orderStates[idx]?.order_type || 'MARKET'}
                                    onChange={e => handleOrderTypeChange(idx, e.target.value)}
                                    size="small"
                                    fullWidth
                                                                disabled={!isSelected}
                                                                sx={{ 
                                                                    '& .MuiOutlinedInput-root': {
                                                                        bgcolor: 'white',
                                                                        height: 32,
                                                                        '& .MuiSelect-select': {
                                                                            py: 0.5,
                                                                            fontSize: '0.875rem'
                                                                        }
                                                                    }
                                                                }}
                                >
                                    {ORDER_TYPES.map(opt => (
                                        <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                                    ))}
                                </TextField>
                                                        </Box>
                                                        <Box sx={{ 
                                                            minWidth: 200,
                                                            pl: 2,
                                                            borderLeft: '1px solid',
                                                            borderColor: 'primary.200'
                                                        }}>
                                                            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
                                                                Limit Price (optional):
                                                            </Typography>
                                <TextField
                                    value={orderStates[idx]?.price || ''}
                                    onChange={e => handlePriceChange(idx, e.target.value)}
                                    size="small"
                                    fullWidth
                                                                disabled={!isSelected || orderStates[idx]?.order_type !== 'LIMIT'}
                                                                placeholder={orderStates[idx]?.order_type === 'LIMIT' ? 'Enter limit price' : 'Not required for market orders'}
                                                                sx={{ 
                                                                    '& .MuiOutlinedInput-root': {
                                                                        bgcolor: 'white',
                                                                        height: 32,
                                                                        '& .MuiInputBase-input': {
                                                                            py: 0.5,
                                                                            fontSize: '0.875rem'
                                                                        }
                                                                    }
                                                                }}
                                                            />
                                                        </Box>
                                                    </Box>
                                                </Box>
                                            </CardContent>
                                        </Card>
                            </Grid>
                                );
                            })}
                        </Grid>

                        {/* Summary */}
                        {selectedPositions.size > 0 && (
                            <Box sx={{ 
                                mt: 2, 
                                p: 1.5, 
                                bgcolor: 'success.50', 
                                borderRadius: 2,
                                border: '1px solid',
                                borderColor: 'success.200'
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <CheckCircleIcon color="success" />
                                    <Typography variant="subtitle2" color="success.main">
                                        Order Summary
                                    </Typography>
                                </Box>
                                <Typography variant="body2" color="text.secondary">
                                    Ready to create {selectedPositions.size} automated exit order{selectedPositions.size > 1 ? 's' : ''} for the selected position{selectedPositions.size > 1 ? 's' : ''}.
                                </Typography>
                    </Box>
                        )}
                    </>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 2, pt: 0 }}>
                <Button 
                    onClick={onClose} 
                    disabled={loading}
                    variant="outlined"
                    sx={{ minWidth: 100 }}
                >
                    Cancel
                </Button>
                <Button 
                    onClick={handleSubmit} 
                    variant="contained" 
                    disabled={loading || selectedPositions.size === 0}
                    sx={{ minWidth: 150 }}
                >
                    {loading ? 'Creating...' : `Create ${selectedPositions.size} Order${selectedPositions.size !== 1 ? 's' : ''}`}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CreateAutomatedOrderPopup; 