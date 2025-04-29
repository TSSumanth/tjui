import React, { useState } from 'react';
import {
    Box,
    Typography,
    IconButton,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    CircularProgress,
    Modal
} from '@mui/material';
import { Close } from '@mui/icons-material';

const OrderPopup = ({
    open,
    onClose,
    position,
    quantity,
    price,
    underlying,
    isAdding,
    onQuantityChange,
    onPriceChange,
    onSubmit,
    loading,
    isStopLoss,
    transactionType
}) => {
    const defaultOrderType = isStopLoss ? 'SL-M' : 'MARKET';
    const [orderType, setOrderType] = useState(defaultOrderType);
    const [triggerPrice, setTriggerPrice] = useState('');

    // Reset order type when the order type changes (stop loss vs regular)
    React.useEffect(() => {
        setOrderType(isStopLoss ? 'SL-M' : 'MARKET');
    }, [isStopLoss]);

    // Check if we're in market hours
    const now = new Date();
    const day = now.getDay();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentTime = hours * 100 + minutes;
    const isMarketOpen = day !== 0 && day !== 6 && currentTime >= 915 && currentTime <= 1530;

    if (!open) return null;

    const handleOrderTypeChange = (e) => {
        const newOrderType = e.target.value;
        setOrderType(newOrderType);
        if (newOrderType === 'MARKET') {
            setTriggerPrice('');
        }
    };

    const orderTypeOptions = isStopLoss ? [
        { value: 'SL-M', label: 'Stop Loss Market' },
        { value: 'SL', label: 'Stop Loss Limit' }
    ] : [
        { value: 'MARKET', label: 'Market' },
        { value: 'LIMIT', label: 'Limit' }
    ];

    const handleTriggerPriceChange = (e) => {
        setTriggerPrice(e.target.value);
    };

    const getTitle = () => {
        if (isStopLoss) {
            return 'Stop Loss Order';
        } else if (isAdding) {
            return 'Add Position';
        } else {
            return 'Close Position';
        }
    };

    const getButtonText = () => {
        if (isStopLoss) {
            return 'Place Stop Loss';
        } else if (isAdding) {
            return 'Add Position';
        } else {
            return 'Close Position';
        }
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            aria-labelledby="order-modal-title"
            aria-describedby="order-modal-description"
        >
            <Box
                sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 400,
                    bgcolor: 'background.paper',
                    boxShadow: 24,
                    p: 4,
                    borderRadius: 1,
                    maxHeight: '90vh',
                    overflow: 'auto'
                }}
            >
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" component="h2" id="order-modal-title">
                        {getTitle()}
                    </Typography>
                    <IconButton size="small" onClick={onClose}>
                        <Close fontSize="small" />
                    </IconButton>
                </Box>

                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                        {position?.tradingsymbol}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        {underlying} - {transactionType} {position?.product}
                    </Typography>
                </Box>

                {!isMarketOpen && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        Markets are closed. Trading hours are Monday to Friday, 9:15 AM to 3:30 PM IST.
                    </Alert>
                )}

                <Box sx={{ mb: 2 }}>
                    <FormControl fullWidth size="small">
                        <InputLabel>Order Type</InputLabel>
                        <Select
                            value={orderType}
                            label="Order Type"
                            onChange={handleOrderTypeChange}
                            disabled={loading}
                        >
                            {orderTypeOptions.map(option => (
                                <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>

                <Box sx={{ mb: 2 }}>
                    <TextField
                        fullWidth
                        size="small"
                        label="Quantity"
                        type="number"
                        value={quantity}
                        onChange={onQuantityChange}
                        disabled={loading}
                        inputProps={{
                            min: 1,
                            max: isAdding ? undefined : Math.abs(position?.quantity || 0)
                        }}
                    />
                </Box>

                {(orderType === 'LIMIT' || orderType === 'SL') && (
                    <Box sx={{ mb: 2 }}>
                        <TextField
                            fullWidth
                            size="small"
                            label="Price"
                            type="number"
                            value={price}
                            onChange={onPriceChange}
                            disabled={loading}
                            inputProps={{
                                step: 0.05
                            }}
                        />
                    </Box>
                )}

                {(orderType === 'SL' || orderType === 'SL-M') && (
                    <Box sx={{ mb: 2 }}>
                        <TextField
                            fullWidth
                            size="small"
                            label="Trigger Price"
                            type="number"
                            value={triggerPrice}
                            onChange={handleTriggerPriceChange}
                            disabled={loading}
                            inputProps={{
                                step: 0.05
                            }}
                        />
                    </Box>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <Button
                        onClick={onClose}
                        variant="outlined"
                        size="small"
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={() => onSubmit(orderType, triggerPrice)}
                        variant="contained"
                        color={isAdding ? "primary" : isStopLoss ? "warning" : "error"}
                        size="small"
                        disabled={!quantity || loading || !isMarketOpen ||
                            ((orderType === 'LIMIT' || orderType === 'SL') && !price) ||
                            ((orderType === 'SL' || orderType === 'SL-M') && !triggerPrice)}
                    >
                        {loading ? (
                            <CircularProgress size={20} color="inherit" />
                        ) : (
                            getButtonText()
                        )}
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
};

export default OrderPopup;

