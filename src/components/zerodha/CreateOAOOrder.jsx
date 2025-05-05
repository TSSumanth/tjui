import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper
} from '@mui/material';
import { useZerodha } from '../../context/ZerodhaContext';

const CreateOAOOrder = ({ open, onClose }) => {
    const { orders } = useZerodha();
    const [step, setStep] = useState(1);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [order2Details, setOrder2Details] = useState({
        tradingsymbol: '',
        transaction_type: 'BUY',
        quantity: '',
        price: '',
        product: 'CNC',
        order_type: 'LIMIT',
        validity: 'DAY'
    });

    // Filter open orders
    const openOrders = orders.filter(order =>
        order.status === 'OPEN' &&
        order.order_type === 'LIMIT' &&
        order.product === 'CNC'
    );

    const handleOrderSelect = (order) => {
        setSelectedOrder(order);
        setStep(2);
    };

    const handleOrder2Change = (e) => {
        const { name, value } = e.target;
        setOrder2Details(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleCreateOAO = async () => {
        try {
            // Create OAO pair with order1_id, order1 details, and order2 details
            const response = await fetch('/api/zerodha/order-pairs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    order1_id: selectedOrder.order_id,
                    order1_details: {
                        tradingsymbol: selectedOrder.tradingsymbol,
                        transaction_type: selectedOrder.transaction_type,
                        quantity: selectedOrder.quantity,
                        price: selectedOrder.price,
                        product: selectedOrder.product,
                        order_type: selectedOrder.order_type,
                        validity: selectedOrder.validity
                    },
                    order1_tradingsymbol: selectedOrder.tradingsymbol,
                    order1_transaction_type: selectedOrder.transaction_type,
                    order1_quantity: selectedOrder.quantity,
                    order1_price: selectedOrder.price,
                    order1_product: selectedOrder.product,
                    order1_order_type: selectedOrder.order_type,
                    order1_validity: selectedOrder.validity,
                    order2_details: order2Details,
                    order2_tradingsymbol: order2Details.tradingsymbol,
                    order2_transaction_type: order2Details.transaction_type,
                    order2_quantity: order2Details.quantity,
                    order2_price: order2Details.price,
                    order2_product: order2Details.product,
                    order2_order_type: order2Details.order_type,
                    order2_validity: order2Details.validity,
                    type: 'OAO'
                })
            });

            if (!response.ok) {
                throw new Error('Failed to create OAO order');
            }

            onClose();
            // You might want to refresh the orders list here
        } catch (error) {
            console.error('Error creating OAO order:', error);
            // Handle error (show error message to user)
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                {step === 1 ? 'Select First Order' : 'Specify Second Order Details'}
            </DialogTitle>
            <DialogContent>
                {step === 1 ? (
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Symbol</TableCell>
                                    <TableCell>Type</TableCell>
                                    <TableCell>Quantity</TableCell>
                                    <TableCell>Price</TableCell>
                                    <TableCell>Action</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {openOrders.map((order) => (
                                    <TableRow key={order.order_id}>
                                        <TableCell>{order.tradingsymbol}</TableCell>
                                        <TableCell>{order.transaction_type}</TableCell>
                                        <TableCell>{order.quantity}</TableCell>
                                        <TableCell>{order.price}</TableCell>
                                        <TableCell>
                                            <Button
                                                variant="contained"
                                                onClick={() => handleOrderSelect(order)}
                                            >
                                                Select
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                ) : (
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <Typography variant="subtitle1">
                                First Order: {selectedOrder.tradingsymbol} ({selectedOrder.transaction_type})
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Trading Symbol"
                                name="tradingsymbol"
                                value={order2Details.tradingsymbol}
                                onChange={handleOrder2Change}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                                <InputLabel>Transaction Type</InputLabel>
                                <Select
                                    name="transaction_type"
                                    value={order2Details.transaction_type}
                                    onChange={handleOrder2Change}
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
                                value={order2Details.quantity}
                                onChange={handleOrder2Change}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Price"
                                name="price"
                                type="number"
                                value={order2Details.price}
                                onChange={handleOrder2Change}
                            />
                        </Grid>
                    </Grid>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                {step === 1 ? (
                    <Button
                        variant="contained"
                        onClick={() => setStep(2)}
                        disabled={!selectedOrder}
                    >
                        Next
                    </Button>
                ) : (
                    <Button
                        variant="contained"
                        onClick={handleCreateOAO}
                        disabled={!order2Details.tradingsymbol || !order2Details.quantity || !order2Details.price}
                    >
                        Create OAO Order
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default CreateOAOOrder; 