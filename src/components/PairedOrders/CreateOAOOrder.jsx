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
    Paper,
    CircularProgress,
    Alert,
    Snackbar,
    Tooltip,
    IconButton,
    Box
} from '@mui/material';
import { createOaoOrderPair } from '../../services/pairedorders/oao';
import { getOrders } from '../../services/zerodha/api';
import RefreshIcon from '@mui/icons-material/Refresh';

const CreateOAOOrder = ({ open, onClose }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [showValidation, setShowValidation] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [step, setStep] = useState(1);
    const [selectedOrder, setSelectedOrder] = useState(null);
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

    // Fetch open orders when component mounts or dialog opens
    useEffect(() => {
        if (open) {
            fetchOpenOrders();
        }
    }, [open]);

    const fetchOpenOrders = async () => {
        try {
            setLoading(true);
            const response = await getOrders();
            const allOrders = response.data || [];
            // Filter only open and LIMIT orders
            const openOrders = allOrders.filter(order =>
                order.status === 'OPEN' &&
                order.order_type === 'LIMIT'
            );
            setOrders(openOrders);
        } catch (err) {
            console.error('Error fetching orders:', err);
            setError('Failed to fetch orders. Please try again.');
        } finally {
            setLoading(false);
        }
    };

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
        if (order2Details.order_type === 'LIMIT' && (!order2Details.price || order2Details.price <= 0)) return 'Price is required for LIMIT orders';
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
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {step === 1 ? 'Select First Order' : 'Specify Second Order Details'}
                    <IconButton
                        onClick={fetchOpenOrders}
                        size="small"
                    >
                        <RefreshIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    {step === 1 ? (
                        <>
                            {loading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                                    <CircularProgress />
                                </Box>
                            ) : error ? (
                                <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
                            ) : (
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
                                            {orders.map((order) => (
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
                            )}
                        </>
                    ) : (
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <Typography variant="subtitle1" sx={{ color: '#1a237e' }}>
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
                                        label="Transaction Type"
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
                                    disabled={order2Details.order_type === 'MARKET'}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Product</InputLabel>
                                    <Select
                                        name="product"
                                        value={order2Details.product}
                                        label="Product"
                                        onChange={handleOrder2Change}
                                        disabled={order2Details.exchange === 'NFO'}
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
                                        value={order2Details.order_type}
                                        label="Order Type"
                                        onChange={e => {
                                            const newOrderType = e.target.value;
                                            setOrder2Details(prev => ({
                                                ...prev,
                                                order_type: newOrderType,
                                                price: newOrderType === 'MARKET' ? '' : prev.price
                                            }));
                                        }}
                                        disabled={order2Details.exchange === 'NFO'}
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
                                        value={order2Details.validity}
                                        label="Validity"
                                        onChange={handleOrder2Change}
                                    >
                                        <MenuItem value="DAY">DAY</MenuItem>
                                        <MenuItem value="IOC">IOC</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth required error={showValidation && !order2Details.exchange}>
                                    <InputLabel>Exchange</InputLabel>
                                    <Select
                                        name="exchange"
                                        value={order2Details.exchange}
                                        label="Exchange"
                                        onChange={e => {
                                            const newExchange = e.target.value;
                                            setOrder2Details(prev => ({
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
            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
};

export default CreateOAOOrder; 