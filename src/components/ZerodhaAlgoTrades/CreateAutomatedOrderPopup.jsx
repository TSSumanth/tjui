import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Typography, Box, Grid } from '@mui/material';
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

    React.useEffect(() => {
        // Reset state when positions or open changes
        setOrderStates(
            positions.map(pos => ({ order_type: 'MARKET', price: '', ...pos }))
        );
        setError('');
    }, [positions, open]);

    const handleOrderTypeChange = (idx, value) => {
        setOrderStates(prev => prev.map((o, i) => i === idx ? { ...o, order_type: value, price: value === 'MARKET' ? '' : o.price } : o));
    };
    const handlePriceChange = (idx, value) => {
        setOrderStates(prev => prev.map((o, i) => i === idx ? { ...o, price: value } : o));
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError('');
        try {
            const createdOrderIds = [];
            for (const order of orderStates) {
                const created = await createAutomatedOrder({
                    instrument_token: order.instrument_token,
                    trading_symbol: order.tradingsymbol,
                    exchange: order.exchange,
                    product: order.product,
                    quantity: order.quantity * -1,
                    transaction_type: order.transaction_type === "BUY" ? "SELL" : "BUY",
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

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
            <DialogTitle>Create Automated Orders</DialogTitle>
            <DialogContent>
                {positions.length === 0 && (
                    <Typography>No positions found for this strategy.</Typography>
                )}
                {positions.map((pos, idx) => (
                    <Box key={pos.instrument_token} sx={{ mb: 2, p: 2, border: '1px solid #eee', borderRadius: 2 }}>
                        <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} md={2}>
                                <Typography variant="subtitle2">Instrument Token</Typography>
                                <Typography>{pos.instrument_token}</Typography>
                            </Grid>
                            <Grid item xs={12} md={2}>
                                <Typography variant="subtitle2">Trading Symbol</Typography>
                                <Typography>{pos.tradingsymbol}</Typography>
                            </Grid>
                            <Grid item xs={12} md={2}>
                                <Typography variant="subtitle2">Exchange</Typography>
                                <Typography>{pos.exchange}</Typography>
                            </Grid>
                            <Grid item xs={12} md={2}>
                                <Typography variant="subtitle2">Product</Typography>
                                <Typography>{pos.product}</Typography>
                            </Grid>
                            <Grid item xs={12} md={2}>
                                <Typography variant="subtitle2">Validity</Typography>
                                <Typography>IOC</Typography>
                            </Grid>
                        </Grid>
                        <Grid container spacing={2} alignItems="center" sx={{ mt: 1 }}>
                        <Grid item xs={12} md={2}>
                                <Typography variant="subtitle2">Transaction Type</Typography>
                                <Typography>{pos.transaction_type === "BUY" ? "SELL" : "BUY"}</Typography>
                            </Grid>
                            <Grid item xs={12} md={2}>
                                <Typography variant="subtitle2">Quantity</Typography>
                                <Typography>{pos.quantity * -1}</Typography>
                            </Grid>
                            <Grid item xs={12} md={2}>
                                <TextField
                                    select
                                    label="Order Type"
                                    value={orderStates[idx]?.order_type || 'MARKET'}
                                    onChange={e => handleOrderTypeChange(idx, e.target.value)}
                                    size="small"
                                    fullWidth
                                >
                                    {ORDER_TYPES.map(opt => (
                                        <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={2}>
                                <TextField
                                    label="Price"
                                    value={orderStates[idx]?.price || ''}
                                    onChange={e => handlePriceChange(idx, e.target.value)}
                                    size="small"
                                    fullWidth
                                    disabled={orderStates[idx]?.order_type !== 'LIMIT'}
                                />
                            </Grid>
                        </Grid>
                    </Box>
                ))}
                {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={loading}>Cancel</Button>
                <Button onClick={handleSubmit} variant="contained" disabled={loading || positions.length === 0}>
                    {loading ? 'Creating...' : 'Create Orders'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CreateAutomatedOrderPopup; 