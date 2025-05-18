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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Divider,
    useTheme,
    Stack
} from '@mui/material';
import { Close } from '@mui/icons-material';

const getHeaderColor = (theme, isAdding, isStopLoss) => {
    if (isStopLoss) return theme.palette.warning.main;
    if (isAdding) return theme.palette.primary.main;
    return theme.palette.error.main;
};

const getButtonColor = (isAdding, isStopLoss) => {
    if (isStopLoss) return 'warning';
    if (isAdding) return 'primary';
    return 'error';
};

const getHeaderText = (isAdding, isStopLoss) => {
    if (isStopLoss) return 'Stop Loss Order';
    if (isAdding) return 'Add Position';
    return 'Close Position';
};

const getButtonText = (isAdding, isStopLoss) => {
    if (isStopLoss) return 'Place Stop Loss';
    if (isAdding) return 'Add Position';
    return 'Close Position';
};

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
    const theme = useTheme();
    const [orderType, setOrderType] = useState(isStopLoss ? 'SL' : 'MARKET');
    const [triggerPrice, setTriggerPrice] = useState('');

    // Check if we're in market hours
    const now = new Date();
    const day = now.getDay();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentTime = hours * 100 + minutes;
    const isMarketOpen = day !== 0 && day !== 6 && currentTime >= 915 && currentTime <= 1530;

    if (!open) return null;

    const handleOrderTypeChange = (e) => {
        setOrderType(e.target.value);
        if (e.target.value === 'MARKET') {
            setTriggerPrice('');
        }
    };

    const handleTriggerPriceChange = (e) => {
        setTriggerPrice(e.target.value);
    };

    const orderTypeOptions = isStopLoss ? [
        { value: 'SL-M', label: 'Stop Loss Market' },
        { value: 'SL', label: 'Stop Loss Limit' }
    ] : [
        { value: 'MARKET', label: 'Market' },
        { value: 'LIMIT', label: 'Limit' }
    ];

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle
                sx={{
                    bgcolor: getHeaderColor(theme, isAdding, isStopLoss),
                    color: theme.palette.getContrastText(getHeaderColor(theme, isAdding, isStopLoss)),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    py: 2,
                    px: 3
                }}
            >
                <Box display="flex" alignItems="center" gap={2}>
                    <Typography variant="h6" component="span">
                        {getHeaderText(isAdding, isStopLoss)}
                    </Typography>
                    <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
                        {position?.tradingsymbol}
                    </Typography>
                </Box>
                <IconButton size="small" onClick={onClose} sx={{ color: 'inherit' }}>
                    <Close fontSize="small" />
                </IconButton>
            </DialogTitle>
            <DialogContent sx={{ bgcolor: theme.palette.background.paper, p: 3 }}>
                <Stack spacing={2}>
                    <Box sx={{ pt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                            {underlying} - {transactionType} {position?.product}
                        </Typography>
                    </Box>
                    {!isMarketOpen && (
                        <Alert severity="warning">
                            Markets are closed. Trading hours are Monday to Friday, 9:15 AM to 3:30 PM IST.
                        </Alert>
                    )}
                    <Divider />
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
                    {(orderType === 'LIMIT' || orderType === 'SL') && (
                        <TextField
                            fullWidth
                            size="small"
                            label="Price"
                            type="number"
                            value={price}
                            onChange={onPriceChange}
                            disabled={loading}
                            inputProps={{ step: 0.05 }}
                        />
                    )}
                    {(orderType === 'SL' || orderType === 'SL-M') && (
                        <TextField
                            fullWidth
                            size="small"
                            label="Trigger Price"
                            type="number"
                            value={triggerPrice}
                            onChange={handleTriggerPriceChange}
                            disabled={loading}
                            inputProps={{ step: 0.05 }}
                        />
                    )}
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2, bgcolor: theme.palette.background.paper }}>
                <Button
                    onClick={onClose}
                    variant="outlined"
                    size="medium"
                    disabled={loading}
                    sx={{ borderRadius: 2 }}
                >
                    Cancel
                </Button>
                <Button
                    onClick={() => onSubmit(orderType, triggerPrice)}
                    variant="contained"
                    color={getButtonColor(isAdding, isStopLoss)}
                    size="medium"
                    disabled={!quantity || loading || !isMarketOpen ||
                        ((orderType === 'LIMIT' || orderType === 'SL') && !price) ||
                        ((orderType === 'SL' || orderType === 'SL-M') && !triggerPrice)}
                    sx={{ borderRadius: 2, minWidth: 140 }}
                >
                    {loading ? (
                        <CircularProgress size={22} color="inherit" />
                    ) : (
                        getButtonText(isAdding, isStopLoss)
                    )}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default OrderPopup;

