import React, { useContext, useEffect, useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Button,
    Chip,
    Typography,
    Divider,
    CircularProgress,
    Alert,
    Snackbar,
    Dialog, DialogTitle, DialogContent, DialogActions, Grid, TextField, FormControl, InputLabel, Select, MenuItem, Tooltip, Box, IconButton, Radio
} from '@mui/material';
import { useZerodha } from '../../context/ZerodhaContext';
import { deleteOaoOrderPair, updateOaoOrderPair } from '../../services/pairedorders/oao';
import { deleteOrderPair, createOrderPair } from '../../services/pairedorders/oco';
import { Delete, Edit, Refresh } from '@mui/icons-material';
import { placeOrder, getOrders } from '../../services/zerodha/api';

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleString();
}

function isToday(dateStr) {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

export default function PairedOrdersTable({ onChange, showCompleted = false }) {
    const { ocoPairs, completedOcoPairs, ocoStatusMap, refreshOcoPairs, refreshCompletedOrders } = useZerodha();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [editOaoDialogOpen, setEditOaoDialogOpen] = useState(false);
    const [editingOaoPair, setEditingOaoPair] = useState(null);
    const [showStoreCancelledOrderDialog, setShowStoreCancelledOrderDialog] = useState(false);
    const [cancelledOrders, setCancelledOrders] = useState([]);
    const [selectedCancelledOrder, setSelectedCancelledOrder] = useState(null);

    useEffect(() => {
        refreshOcoPairs();
        // Only on mount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleCancel = async (id, type) => {
        setLoading(true);
        setError(null);
        try {
            if (type === 'OAO') {
                await deleteOaoOrderPair(id);
            } else {
                await deleteOrderPair(id);
            }
            await refreshOcoPairs();
            if (onChange) onChange();
        } catch (error) {
            console.error('Error cancelling order pair:', error);
            setError(error.response?.data?.message || 'Failed to cancel order pair. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleEditOao = (pair) => {
        setEditingOaoPair(pair);
        setEditOaoDialogOpen(true);
    };

    const handleEditOaoDialogClose = () => {
        setEditOaoDialogOpen(false);
        setEditingOaoPair(null);
    };

    const handleEditOaoDialogSave = async (order2_details) => {
        setLoading(true);
        setError(null);
        try {
            await updateOaoOrderPair(editingOaoPair.id, order2_details);
            await refreshOcoPairs();
            if (onChange) onChange();
            handleEditOaoDialogClose();
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to update OAO order. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleStoreCancelledOrder = async () => {
        setShowStoreCancelledOrderDialog(true);
        try {
            const today = new Date().toISOString().slice(0, 10);
            const response = await getOrders();
            const allOrders = response.data || [];
            const ordersArray = Array.isArray(allOrders) ? allOrders : [];
            const filtered = ordersArray.filter(o => {
                const isCancelled = o.status && o.status.toUpperCase() === 'CANCELLED';
                let orderDate;
                const timestamp = o.order_timestamp || o.created_at || o.modified_at || o.timestamp;
                if (timestamp) {
                    const date = new Date(timestamp);
                    orderDate = date.toISOString().slice(0, 10);
                }
                return isCancelled && orderDate === today;
            });
            setCancelledOrders(filtered);
        } catch (error) {
            console.error('Error fetching cancelled orders:', error);
            setError('Failed to fetch cancelled orders');
        }
    };

    const handleSaveSO = async () => {
        if (!selectedCancelledOrder) return;
        setLoading(true);
        setError(null);
        try {
            const { order_id, ...orderDetails } = selectedCancelledOrder;
            const payload = {
                type: 'SO',
                order1_id: order_id,
                order1_details: {
                    ...orderDetails,
                    lastupdatedat: new Date().toISOString(),
                },
                order2_id: '',
                order2_details: {},
            };
            await createOrderPair(payload);
            await refreshOcoPairs();
            if (onChange) onChange();
            setShowStoreCancelledOrderDialog(false);
            setSelectedCancelledOrder(null);
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to save order. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!ocoPairs.length) return null;

    const getStatusColor = (status) => {
        switch (status) {
            case 'COMPLETE': return 'success';
            case 'CANCELLED': return 'default';
            case 'TRIGGER PENDING': return 'info';
            default: return 'warning';
        }
    };

    // Split pairs into OCO and OAO
    const ocoOnlyPairs = ocoPairs.filter(pair => pair.type === 'OCO' && isToday(pair.created_at));
    const oaoOnlyPairs = ocoPairs.filter(pair => pair.type === 'OAO' && isToday(pair.created_at));

    // OCO: Split into active and completed
    const activePairs = ocoOnlyPairs.filter(pair => pair.status !== 'COMPLETED');
    const completedTodayPairs = completedOcoPairs.filter(pair =>
        pair.type === 'OCO' &&
        isToday(pair.created_at)
    );

    // OAO: Show all (or split if needed)
    const activeOaoPairs = oaoOnlyPairs.filter(pair => pair.status !== 'COMPLETED');
    const completedOaoPairs = oaoOnlyPairs.filter(pair => pair.status === 'COMPLETED');

    if (showCompleted) {
        return (
            <Box>
                {/* Completed OCO Orders */}
                <Box mb={4}>
                    {/* <Typography variant="h6" gutterBottom>
                        Completed OCO Orders
                        <IconButton
                            onClick={refreshCompletedOrders}
                            size="small"
                            sx={{ ml: 1 }}
                        >
                            <Refresh />
                        </IconButton>
                    </Typography> */}
                    {completedTodayPairs.length > 0 ? (
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ color: '#1a237e' }}>
                                Completed OCO Orders
                                {/* <IconButton
                            onClick={refreshCompletedOrders}
                            size="small"
                            sx={{ ml: 1 }}
                        >
                            <Refresh />
                        </IconButton> */}
                            </Typography>
                            <TableContainer component={Paper}>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Order 1</TableCell>
                                            <TableCell>Type</TableCell>
                                            <TableCell>Status</TableCell>
                                            <TableCell>Order 2</TableCell>
                                            <TableCell>Type</TableCell>
                                            <TableCell>Status</TableCell>
                                            <TableCell>Completed At</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {completedTodayPairs.map((pair) => {
                                            const status1 = pair.order1_details?.orderstatus || '';
                                            const status2 = pair.order2_details?.orderstatus || '';
                                            return (
                                                <TableRow key={pair.id}>
                                                    <TableCell>
                                                        {pair.order1_details?.tradingsymbol || ''} <br />
                                                        <small>{pair.order1_id}</small>
                                                    </TableCell>
                                                    <TableCell>{pair.order1_details?.transaction_type || ''}</TableCell>
                                                    <TableCell><Chip label={status1} color={getStatusColor(status1)} size="small" /></TableCell>
                                                    <TableCell>
                                                        {pair.order2_details?.tradingsymbol || ''} <br />
                                                        <small>{pair.order2_id}</small>
                                                    </TableCell>
                                                    <TableCell>{pair.order2_details?.transaction_type || ''}</TableCell>
                                                    <TableCell><Chip label={status2} color={getStatusColor(status2)} size="small" /></TableCell>
                                                    <TableCell>{formatDate(pair.updated_at)}</TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    ) : (
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ color: '#1a237e' }}>
                                Completed OCO Orders
                                {/* <IconButton
                                    onClick={refreshCompletedOrders}
                                    size="small"
                                    sx={{ ml: 1 }}
                                >
                                    <Refresh />
                                </IconButton> */}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                No completed OCO orders for today
                            </Typography>
                        </Box>
                    )}
                </Box>

                {/* Completed OAO Orders */}
                {completedOaoPairs.length > 0 ? (
                    <Box mb={4}>
                        <Typography variant="h6" gutterBottom sx={{ color: '#1a237e' }}>
                            Completed OAO Orders
                        </Typography>
                        <TableContainer component={Paper}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Order 1</TableCell>
                                        <TableCell>Type</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell>Order 2 Details</TableCell>
                                        <TableCell>Order 2 ID</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell>Last Updated</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {completedOaoPairs.map((pair) => {
                                        const status1 = ocoStatusMap[pair.order1_id] || '';
                                        const status2 = pair.order2_id ? (ocoStatusMap[pair.order2_id] || '') : '';
                                        return (
                                            <TableRow key={pair.id}>
                                                <TableCell>{pair.order1_details?.tradingsymbol || ''} <br /> <small>{pair.order1_id}</small></TableCell>
                                                <TableCell>{pair.order1_details?.transaction_type || ''}</TableCell>
                                                <TableCell><Chip label={status1} color={getStatusColor(status1)} size="small" /></TableCell>
                                                <TableCell>
                                                    {pair.order2_details ? (
                                                        <>
                                                            {pair.order2_details.tradingsymbol || ''} <br />
                                                            {pair.order2_details.transaction_type || ''} <br />
                                                            Qty: {pair.order2_details.quantity || ''} <br />
                                                            Price: {pair.order2_details.price || ''}
                                                        </>
                                                    ) : ''}
                                                </TableCell>
                                                <TableCell>{pair.order2_id || '-'}</TableCell>
                                                <TableCell><Chip label={status2} color={getStatusColor(status2)} size="small" /></TableCell>
                                                <TableCell>{formatDate(pair.updated_at)}</TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                ) : (
                    <Box>
                        <Typography variant="h6" gutterBottom sx={{ color: '#1a237e' }}>
                            Completed OAO Orders
                            {/* <IconButton
                                onClick={refreshCompletedOrders}
                                size="small"
                                sx={{ ml: 1 }}
                            >
                                <Refresh />
                            </IconButton> */}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            No completed OAO orders for today
                        </Typography>
                    </Box>
                )}
            </Box>
        );
    }

    return (
        <>
            <Box>
                {/* Active OCO Orders */}
                <Box mb={4}>
                    <Typography variant="h6" gutterBottom sx={{ color: '#1a237e' }}>
                        Active OCO Orders
                    </Typography>
                    {activePairs.length > 0 ? (
                        <TableContainer component={Paper}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Order 1</TableCell>
                                        <TableCell>Type</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell>Order 2</TableCell>
                                        <TableCell>Type</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell>Last Updated</TableCell>
                                        <TableCell>Action</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {activePairs.map((pair) => {
                                        const status1 = ocoStatusMap[pair.order1_id] || '';
                                        const status2 = ocoStatusMap[pair.order2_id] || '';
                                        return (
                                            <TableRow key={pair.id}>
                                                <TableCell>
                                                    {pair.order1_details?.tradingsymbol || ''} <br />
                                                    <small>{pair.order1_id}</small>
                                                </TableCell>
                                                <TableCell>{pair.order1_details?.transaction_type || ''}</TableCell>
                                                <TableCell><Chip label={status1} color={getStatusColor(status1)} size="small" /></TableCell>
                                                <TableCell>
                                                    {pair.order2_details?.tradingsymbol || ''} <br />
                                                    <small>{pair.order2_id}</small>
                                                </TableCell>
                                                <TableCell>{pair.order2_details?.transaction_type || ''}</TableCell>
                                                <TableCell><Chip label={status2} color={getStatusColor(status2)} size="small" /></TableCell>
                                                <TableCell>{formatDate(pair.updated_at)}</TableCell>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                                        <Button
                                                            variant="outlined"
                                                            color="error"
                                                            size="small"
                                                            onClick={() => handleCancel(pair.id, pair.type)}
                                                            disabled={loading}
                                                        >
                                                            Cancel
                                                        </Button>
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    ) : (
                        <Typography variant="body2" color="text.secondary">
                            No active OCO orders for today
                        </Typography>
                    )}
                </Box>

                {/* Active OAO Orders */}
                <Box mb={4}>
                    <Typography variant="h6" gutterBottom sx={{ color: '#1a237e' }}>
                        Active OAO Orders
                    </Typography>
                    {activeOaoPairs.length > 0 ? (
                        <Box mb={4}>
                            <Typography variant="h6" gutterBottom sx={{ color: '#1a237e' }}>
                                Active OAO Orders
                            </Typography>
                            <TableContainer component={Paper}>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Order 1</TableCell>
                                            <TableCell>Type</TableCell>
                                            <TableCell>Status</TableCell>
                                            <TableCell>Order 2 Details</TableCell>
                                            <TableCell>Order 2 ID</TableCell>
                                            <TableCell>Status</TableCell>
                                            <TableCell>Last Updated</TableCell>
                                            <TableCell>Action</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {activeOaoPairs.map((pair) => {
                                            const status1 = ocoStatusMap[pair.order1_id] || '';
                                            const status2 = pair.order2_id ? (ocoStatusMap[pair.order2_id] || '') : '';
                                            const showRetry = pair.order2_id === 'FAILED';
                                            return (
                                                <TableRow key={pair.id}>
                                                    <TableCell>
                                                        {pair.order1_details?.tradingsymbol || ''} <br />
                                                        <small>{pair.order1_id}</small>
                                                    </TableCell>
                                                    <TableCell>{pair.order1_details?.transaction_type || ''}</TableCell>
                                                    <TableCell><Chip label={status1} color={getStatusColor(status1)} size="small" /></TableCell>
                                                    <TableCell>
                                                        {pair.order2_details ? (
                                                            <>
                                                                {pair.order2_details.tradingsymbol || ''} <br />
                                                                {pair.order2_details.transaction_type || ''} <br />
                                                                Qty: {pair.order2_details.quantity || ''} <br />
                                                                Price: {pair.order2_details.price || ''}
                                                            </>
                                                        ) : ''}
                                                    </TableCell>
                                                    <TableCell>{pair.order2_id || '-'}</TableCell>
                                                    <TableCell><Chip label={status2} color={getStatusColor(status2)} size="small" /></TableCell>
                                                    <TableCell>{formatDate(pair.updated_at)}</TableCell>
                                                    <TableCell>
                                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                                            {showRetry ? (
                                                                <Button
                                                                    variant="outlined"
                                                                    color="primary"
                                                                    size="small"
                                                                    onClick={() => handleEditOao(pair)}
                                                                    disabled={loading}
                                                                >
                                                                    Retry
                                                                </Button>
                                                            ) : (
                                                                <Button
                                                                    variant="outlined"
                                                                    color="primary"
                                                                    size="small"
                                                                    onClick={() => handleEditOao(pair)}
                                                                    disabled={loading}
                                                                >
                                                                    Edit
                                                                </Button>
                                                            )}
                                                            <Button
                                                                variant="outlined"
                                                                color="error"
                                                                size="small"
                                                                onClick={() => handleCancel(pair.id, pair.type)}
                                                                disabled={loading}
                                                            >
                                                                Cancel
                                                            </Button>
                                                        </Box>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    ) : (
                        <Typography variant="body2" color="text.secondary">
                            No active OAO orders for today
                        </Typography>
                    )}
                </Box>
            </Box>

            {/* Store Cancelled Order Dialog */}
            <Dialog
                open={showStoreCancelledOrderDialog}
                onClose={() => {
                    setShowStoreCancelledOrderDialog(false);
                    setSelectedCancelledOrder(null);
                }}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>Store Cancelled Order</DialogTitle>
                <DialogContent>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Select</TableCell>
                                    <TableCell>Order ID</TableCell>
                                    <TableCell>Symbol</TableCell>
                                    <TableCell>Type</TableCell>
                                    <TableCell>Quantity</TableCell>
                                    <TableCell>Price</TableCell>
                                    <TableCell>Status</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {cancelledOrders.map((order) => (
                                    <TableRow key={order.order_id}>
                                        <TableCell>
                                            <Radio
                                                checked={selectedCancelledOrder?.order_id === order.order_id}
                                                onChange={() => setSelectedCancelledOrder(order)}
                                            />
                                        </TableCell>
                                        <TableCell>{order.order_id}</TableCell>
                                        <TableCell>{order.tradingsymbol}</TableCell>
                                        <TableCell>{order.transaction_type}</TableCell>
                                        <TableCell>{order.quantity}</TableCell>
                                        <TableCell>{order.price}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={order.status}
                                                color="default"
                                                size="small"
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => {
                            setShowStoreCancelledOrderDialog(false);
                            setSelectedCancelledOrder(null);
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSaveSO}
                        variant="contained"
                        color="primary"
                        disabled={!selectedCancelledOrder || loading}
                    >
                        {loading ? 'Saving...' : 'Save Order'}
                    </Button>
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
        </>
    );
}

function EditOaoOrder2Dialog({ open, onClose, initialOrder2Details, onSave }) {
    const [order2Details, setOrder2Details] = useState({ ...initialOrder2Details });
    const [showValidation, setShowValidation] = useState(false);
    const [saving, setSaving] = useState(false);
    const validateForm = () => {
        if (!order2Details.tradingsymbol) return 'Trading symbol is required';
        if (!order2Details.quantity || order2Details.quantity <= 0) return 'Valid quantity is required';
        if (!order2Details.price || order2Details.price <= 0) return 'Valid price is required';
        if (!order2Details.exchange) return 'Exchange is required';
        if (order2Details.order_type === 'LIMIT' && (!order2Details.price || order2Details.price <= 0)) return 'Price is required for LIMIT orders';
        return null;
    };
    const handleChange = (e) => {
        const { name, value } = e.target;
        setOrder2Details(prev => ({ ...prev, [name]: value }));
    };
    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Edit Second Order Details</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Trading Symbol"
                            name="tradingsymbol"
                            value={order2Details.tradingsymbol}
                            onChange={handleChange}
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
                                onChange={handleChange}
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
                            onChange={handleChange}
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
                            onChange={handleChange}
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
                                onChange={handleChange}
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
                                onChange={handleChange}
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
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={async () => {
                        setShowValidation(true);
                        const validationError = validateForm();
                        if (validationError) return;
                        setSaving(true);
                        await onSave(order2Details);
                        setSaving(false);
                    }}
                    disabled={saving}
                >
                    {saving ? 'Saving...' : 'Save'}
                </Button>
            </DialogActions>
        </Dialog>
    );
} 