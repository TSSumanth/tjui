import React, { useState } from 'react';
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
    Paper,
    CircularProgress,
    Alert,
    Snackbar
} from '@mui/material';
import { useZerodha } from '../../context/ZerodhaContext';
import { createOaoOrderPair } from '../../services/zerodha/oao';

const CreateOAOOrder = ({ open, onClose }) => {
    const { orders } = useZerodha();
    const [step, setStep] = useState(1);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [showValidation, setShowValidation] = useState(false);
    const [order2Details, setOrder2Details] = useState({
        tradingsymbol: '',
        transaction_type: 'BUY',
        quantity: '',
        price: '',
        product: 'CNC',
        order_type: 'LIMIT',
        validity: 'DAY',
        exchange: 'NSE'
    });

    // Filter open orders
    const openOrders = orders.filter(order =>
        order.status === 'OPEN' &&
        order.order_type === 'LIMIT'
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

    const validateForm = () => {
        if (!order2Details.tradingsymbol) return 'Trading symbol is required';
        if (!order2Details.quantity || order2Details.quantity <= 0) return 'Valid quantity is required';
        if (!order2Details.price || order2Details.price <= 0) return 'Valid price is required';
        if (!order2Details.exchange) return 'Exchange is required';
        return null;
    };

    const handleCreateOAO = async () => {
        setShowValidation(true);
        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            await createOaoOrderPair({
                order1_id: selectedOrder.order_id,
                order2_id: "WAITINGFORORDER1",
                order1_details: {
                    tradingsymbol: selectedOrder.tradingsymbol,
                    transaction_type: selectedOrder.transaction_type,
                    quantity: selectedOrder.quantity,
                    price: selectedOrder.price,
                    product: selectedOrder.product,
                    order_type: selectedOrder.order_type,
                    validity: selectedOrder.validity,
                    orderstatus: selectedOrder.status || 'OPEN'
                },
                order2_details: {
                    ...order2Details,
                    orderstatus: 'OPEN'
                }
            });
            setSuccess(true);
            setTimeout(() => {
                onClose();
                setSuccess(false);
                setStep(1);
                setSelectedOrder(null);
                setShowValidation(false);
                setOrder2Details({
                    tradingsymbol: '',
                    transaction_type: 'BUY',
                    quantity: '',
                    price: '',
                    product: 'CNC',
                    order_type: 'LIMIT',
                    validity: 'DAY',
                    exchange: 'NSE'
                });
            }, 1500);
        } catch (error) {
            console.error('Error creating OAO order:', error);
            setError(error.response?.data?.message || 'Failed to create OAO order. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setError(null);
        setSuccess(false);
        setShowValidation(false);
        setStep(1);
        setSelectedOrder(null);
        setOrder2Details({
            tradingsymbol: '',
            transaction_type: 'BUY',
            quantity: '',
            price: '',
            product: 'CNC',
            order_type: 'LIMIT',
            validity: 'DAY',
            exchange: 'NSE'
        });
        onClose();
    };

    return (
        <>
            <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
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
                                    required
                                    error={showValidation && !order2Details.tradingsymbol}
                                    helperText={showValidation && !order2Details.tradingsymbol ? 'Trading symbol is required' : ''}
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
                                    required
                                    error={showValidation && (!order2Details.quantity || order2Details.quantity <= 0)}
                                    helperText={showValidation && (!order2Details.quantity || order2Details.quantity <= 0) ? 'Valid quantity is required' : ''}
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
                                    required
                                    error={showValidation && (!order2Details.price || order2Details.price <= 0)}
                                    helperText={showValidation && (!order2Details.price || order2Details.price <= 0) ? 'Valid price is required' : ''}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth required error={showValidation && !order2Details.exchange}>
                                    <InputLabel>Exchange</InputLabel>
                                    <Select
                                        name="exchange"
                                        value={order2Details.exchange}
                                        label="Exchange"
                                        onChange={handleOrder2Change}
                                    >
                                        <MenuItem value="">Select Exchange</MenuItem>
                                        <MenuItem value="NSE">NSE</MenuItem>
                                        <MenuItem value="NFO">NFO</MenuItem>
                                        <MenuItem value="BSE">BSE</MenuItem>
                                    </Select>
                                    {showValidation && !order2Details.exchange && (
                                        <Typography variant="caption" color="error">Exchange is required</Typography>
                                    )}
                                </FormControl>
                            </Grid>
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
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
                            disabled={loading}
                            startIcon={loading ? <CircularProgress size={20} /> : null}
                        >
                            {loading ? 'Creating...' : 'Create OAO Order'}
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
            <Snackbar
                open={!!error}
                autoHideDuration={6000}
                onClose={() => setError(null)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={() => setError(null)} severity="error">
                    {error}
                </Alert>
            </Snackbar>
            <Snackbar
                open={success}
                autoHideDuration={1500}
                onClose={() => setSuccess(false)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={() => setSuccess(false)} severity="success">
                    OAO order created successfully!
                </Alert>
            </Snackbar>
        </>
    );
};

export default CreateOAOOrder; 