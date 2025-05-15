import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Grid,
    Typography
} from '@mui/material';
import { modifyZerodhaOrder } from '../../services/zerodha/api';
import { formatPrice } from '../../utils/formatters';

const ModifyOrderDialog = ({ open, order, onClose, onSuccess }) => {
    const [price, setPrice] = useState(order?.price || '');
    const [triggerPrice, setTriggerPrice] = useState(order?.trigger_price || '');
    const [quantity, setQuantity] = useState(order?.quantity || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        setPrice(order?.price || '');
        setTriggerPrice(order?.trigger_price || '');
        setQuantity(order?.quantity || '');
    }, [order]);

    const handleSubmit = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = {
                price: parseFloat(price),
                quantity: parseInt(quantity),
                order_type: order.order_type
            };
            if (triggerPrice.trim() !== '') {
                data.trigger_price = parseFloat(triggerPrice);
            }
            await modifyZerodhaOrder(order.order_id, data);
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to modify order');
            console.error('Error modifying order:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!order) return null;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Modify Order</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12}>
                        <Typography variant="subtitle2">Order ID</Typography>
                        <Typography>{order.order_id}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                        <Typography variant="subtitle2">Trading Symbol</Typography>
                        <Typography>{order.tradingsymbol}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                        <Typography variant="subtitle2">Current Price</Typography>
                        <Typography>{formatPrice(order.price)}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            label="New Price"
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            fullWidth
                            required
                        />
                    </Grid>
                    {order.order_type === 'SL' && (
                        <>
                            <Grid item xs={12}>
                                <Typography variant="subtitle2">Current Trigger Price</Typography>
                                <Typography>{formatPrice(order.trigger_price)}</Typography>
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    label="New Trigger Price"
                                    type="number"
                                    value={triggerPrice}
                                    onChange={(e) => setTriggerPrice(e.target.value)}
                                    fullWidth
                                    required
                                />
                            </Grid>
                        </>
                    )}
                    <Grid item xs={12}>
                        <Typography variant="subtitle2">Current Quantity</Typography>
                        <Typography>{order.quantity}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            label="New Quantity"
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            fullWidth
                            required
                        />
                    </Grid>
                    {error && (
                        <Grid item xs={12}>
                            <Typography color="error">{error}</Typography>
                        </Grid>
                    )}
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={loading}
                >
                    {loading ? 'Modifying...' : 'Modify'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ModifyOrderDialog; 