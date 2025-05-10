import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Grid, TextField, FormControl, InputLabel, Select, MenuItem, Alert, Tooltip } from '@mui/material';

export default function SOCreateDialog({
    open,
    onClose,
    soOrderDetails,
    setSOOrderDetails,
    soOrderError,
    soOrderLoading,
    handleSaveSOManual
}) {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle>Create Saved Order (SO)</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Trading Symbol"
                            name="tradingsymbol"
                            value={soOrderDetails.tradingsymbol}
                            onChange={e => setSOOrderDetails(prev => ({ ...prev, tradingsymbol: e.target.value }))}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                            <InputLabel>Transaction Type</InputLabel>
                            <Select
                                name="transaction_type"
                                value={soOrderDetails.transaction_type}
                                label="Transaction Type"
                                onChange={e => setSOOrderDetails(prev => ({ ...prev, transaction_type: e.target.value }))}
                            >
                                <MenuItem value="BUY">BUY</MenuItem>
                                <MenuItem value="SELL">SELL</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Quantity"
                            name="quantity"
                            type="number"
                            value={soOrderDetails.quantity}
                            onChange={e => setSOOrderDetails(prev => ({ ...prev, quantity: e.target.value }))}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Price"
                            name="price"
                            type="number"
                            value={soOrderDetails.price}
                            onChange={e => setSOOrderDetails(prev => ({ ...prev, price: e.target.value }))}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                            <InputLabel>Product</InputLabel>
                            <Select
                                name="product"
                                value={soOrderDetails.product}
                                label="Product"
                                onChange={e => setSOOrderDetails(prev => ({ ...prev, product: e.target.value }))}
                                disabled={soOrderDetails.exchange === 'NFO'}
                            >
                                <MenuItem value="CNC">
                                    <Tooltip title="Cash and Carry - For delivery based trading">
                                        <span>CNC</span>
                                    </Tooltip>
                                </MenuItem>
                                <MenuItem value="MIS">
                                    <Tooltip title="Margin Intraday Square-off - For intraday trading with margin benefits. Positions must be closed by end of day.">
                                        <span>MIS</span>
                                    </Tooltip>
                                </MenuItem>
                                <MenuItem value="NRML">
                                    <Tooltip title="Normal - For regular trading with standard margin requirements">
                                        <span>NRML</span>
                                    </Tooltip>
                                </MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                            <InputLabel>Order Type</InputLabel>
                            <Select
                                name="order_type"
                                value={soOrderDetails.order_type}
                                label="Order Type"
                                onChange={e => {
                                    const newOrderType = e.target.value;
                                    setSOOrderDetails(prev => ({
                                        ...prev,
                                        order_type: newOrderType,
                                        price: newOrderType === 'MARKET' ? '' : prev.price
                                    }));
                                }}
                                disabled={soOrderDetails.exchange === 'NFO'}
                            >
                                <MenuItem value="LIMIT">LIMIT</MenuItem>
                                <MenuItem value="MARKET">MARKET</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                            <InputLabel>Validity</InputLabel>
                            <Select
                                name="validity"
                                value={soOrderDetails.validity}
                                label="Validity"
                                onChange={e => setSOOrderDetails(prev => ({ ...prev, validity: e.target.value }))}
                            >
                                <MenuItem value="DAY">DAY</MenuItem>
                                <MenuItem value="IOC">IOC</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                            <InputLabel>Exchange</InputLabel>
                            <Select
                                name="exchange"
                                value={soOrderDetails.exchange}
                                label="Exchange"
                                onChange={e => {
                                    const newExchange = e.target.value;
                                    setSOOrderDetails(prev => ({
                                        ...prev,
                                        exchange: newExchange,
                                        product: newExchange === 'NFO' ? 'NRML' : prev.product,
                                        order_type: newExchange === 'NFO' ? 'LIMIT' : prev.order_type,
                                        validity: newExchange === 'NFO' ? 'IOC' : prev.validity
                                    }));
                                }}
                            >
                                <MenuItem value="NSE">NSE</MenuItem>
                                <MenuItem value="BSE">BSE</MenuItem>
                                <MenuItem value="NFO">NFO</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
                {soOrderError && <Alert severity="error" sx={{ mt: 2 }}>{soOrderError}</Alert>}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button
                    variant="contained"
                    color="success"
                    onClick={handleSaveSOManual}
                    disabled={soOrderLoading}
                >
                    {soOrderLoading ? 'Saving...' : 'Save'}
                </Button>
            </DialogActions>
        </Dialog>
    );
} 