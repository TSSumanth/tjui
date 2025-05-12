import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, Table, TableHead, TableRow, TableCell, TableBody, Radio, Snackbar, Alert, TextField, Grid, FormControl, InputLabel, Select, MenuItem, IconButton, Tooltip, Paper, TableContainer, Chip } from '@mui/material';
import PairedOrdersTable from '../components/PairedOrders/PairedOrdersTable';
import ZerodhaSubHeader from '../components/zerodha/ZerodhaSubHeader';
import OcoOrderDialog from '../components/PairedOrders/OcoOrderDialog';
import CreateOAOOrder from '../components/PairedOrders/CreateOAOOrder';
import { useZerodha } from '../context/ZerodhaContext';
import { createOrderPair, getOrderPairs, updateOrderPair, deleteOrderPair } from '../services/zerodha/oco';
import { getOrders, placeOrder, getInstruments } from '../services/zerodha/api';
import SavedOrdersTable from '../components/PairedOrders/SavedOrdersTable';
import SOCreateDialog from '../components/PairedOrders/SOCreateDialog';

export default function PairedOrdersPage() {
    const [isOCODialogOpen, setIsOCODialogOpen] = useState(false);
    const [isOAODialogOpen, setIsOAODialogOpen] = useState(false);
    const [showStoreCancelledOrderDialog, setShowStoreCancelledOrderDialog] = useState(false);
    const [cancelledOrders, setCancelledOrders] = useState([]);
    const [selectedCancelledOrder, setSelectedCancelledOrder] = useState(null);
    const [savedOrders, setSavedOrders] = useState([]);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const { orders } = useZerodha();
    const [showCreateSOOrderDialog, setShowCreateSOOrderDialog] = useState(false);
    const [soOrderDetails, setSOOrderDetails] = useState({
        tradingsymbol: '',
        transaction_type: 'BUY',
        quantity: '',
        price: '',
        product: 'CNC',
        order_type: 'LIMIT',
        validity: 'DAY',
        exchange: 'NSE'
    });
    const [soOrderError, setSOOrderError] = useState(null);
    const [soOrderLoading, setSOOrderLoading] = useState(false);
    const [editingSO, setEditingSO] = useState(null);
    const [isUpdateSODialogOpen, setIsUpdateSODialogOpen] = useState(false);
    const [placingOrder, setPlacingOrder] = useState(false);

    // Fetch today's cancelled orders when dialog opens
    useEffect(() => {
        if (showStoreCancelledOrderDialog) {
            const fetchCancelledOrders = async () => {
                try {
                    const today = new Date().toISOString().slice(0, 10);
                    const response = await getOrders();
                    console.log('Raw orders response:', response);
                    const allOrders = response.data || [];
                    console.log('All orders:', allOrders);
                    const ordersArray = Array.isArray(allOrders) ? allOrders : [];
                    const filtered = ordersArray.filter(
                        o => {
                            console.log('Complete order object:', o);
                            // Check if status is CANCELLED (case insensitive)
                            const isCancelled = o.status && o.status.toUpperCase() === 'CANCELLED';

                            // Try different timestamp fields
                            let orderDate;
                            const timestamp = o.order_timestamp || o.created_at || o.modified_at || o.timestamp;
                            if (timestamp) {
                                const date = new Date(timestamp);
                                orderDate = date.toISOString().slice(0, 10);
                            }

                            console.log('Order details:', {
                                status: o.status,
                                isCancelled,
                                timestamp,
                                orderDate,
                                today
                            });

                            return isCancelled && orderDate === today;
                        }
                    );
                    console.log('Filtered cancelled orders:', filtered);
                    setCancelledOrders(filtered);
                } catch (error) {
                    console.error('Error fetching cancelled orders:', error);
                    setSnackbar({
                        open: true,
                        message: 'Failed to fetch cancelled orders',
                        severity: 'error'
                    });
                    setCancelledOrders([]);
                }
            };
            fetchCancelledOrders();
        }
    }, [showStoreCancelledOrderDialog]);

    // Fetch all SOs (Saved Orders)
    useEffect(() => {
        const fetchSavedOrders = async () => {
            const allPairs = await getOrderPairs();
            setSavedOrders(allPairs.filter(pair => pair.type === 'SO' && pair.status === 'active'));
        };
        fetchSavedOrders();
    }, [showStoreCancelledOrderDialog, snackbar.open]);

    // Handler to save SO
    const handleSaveSO = async () => {
        if (!selectedCancelledOrder) return;
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
        try {
            await createOrderPair(payload);
            setSnackbar({ open: true, message: 'Order saved successfully!', severity: 'success' });
        } catch (e) {
            setSnackbar({ open: true, message: 'Failed to save order.', severity: 'error' });
        }
        setShowStoreCancelledOrderDialog(false);
        setSelectedCancelledOrder(null);
    };

    // Handler to save SO from manual entry
    const handleSaveSOManual = async () => {
        // Validation (reuse OAO logic)
        if (!soOrderDetails.tradingsymbol) return setSOOrderError('Trading symbol is required');
        if (!soOrderDetails.quantity || soOrderDetails.quantity <= 0) return setSOOrderError('Valid quantity is required');
        if (!soOrderDetails.price || soOrderDetails.price <= 0) return setSOOrderError('Valid price is required');
        if (!soOrderDetails.exchange) return setSOOrderError('Exchange is required');
        setSOOrderLoading(true);
        setSOOrderError(null);
        const payload = {
            type: 'SO',
            order1_id: 'MANUAL',
            order1_details: {
                ...soOrderDetails,
                lastupdatedat: new Date().toISOString(),
            },
            order2_id: '',
            order2_details: {},
        };
        try {
            await createOrderPair(payload);
            setSnackbar({ open: true, message: 'Order saved successfully!', severity: 'success' });
            setShowCreateSOOrderDialog(false);
            setSOOrderDetails({
                tradingsymbol: '',
                transaction_type: 'BUY',
                quantity: '',
                price: '',
                product: 'CNC',
                order_type: 'LIMIT',
                validity: 'DAY',
                exchange: 'NSE'
            });
        } catch (e) {
            setSOOrderError('Failed to save order.');
        }
        setSOOrderLoading(false);
    };

    // Handler for updating SO
    const handleUpdateSO = (order) => {
        setEditingSO(order);
        setSOOrderDetails({
            tradingsymbol: order.order1_details.tradingsymbol || order.order1_details.symbol,
            transaction_type: order.order1_details.transaction_type,
            quantity: order.order1_details.quantity,
            price: order.order1_details.price,
            product: order.order1_details.product,
            order_type: order.order1_details.order_type,
            validity: order.order1_details.validity,
            exchange: order.order1_details.exchange
        });
        setIsUpdateSODialogOpen(true);
    };

    // Handler for saving updated SO
    const handleSaveUpdatedSO = async () => {
        if (!editingSO) return;
        setSOOrderLoading(true);
        setSOOrderError(null);
        const payload = {
            order1_details: {
                ...soOrderDetails,
                lastupdatedat: new Date().toISOString(),
            }
        };
        try {
            await updateOrderPair(editingSO.id, payload);
            setSnackbar({ open: true, message: 'Order updated successfully!', severity: 'success' });
            setIsUpdateSODialogOpen(false);
            setEditingSO(null);
            // Refresh the saved orders list
            const allPairs = await getOrderPairs();
            setSavedOrders(allPairs.filter(pair => pair.type === 'SO' && pair.status === 'active'));
        } catch (e) {
            setSOOrderError('Failed to update order.');
        }
        setSOOrderLoading(false);
    };

    // Handler for placing order
    const handlePlaceOrder = async (order) => {
        setPlacingOrder(true);
        try {
            // First, get the instrument token
            const instrumentsResponse = await getInstruments({
                search: order.order1_details.tradingsymbol || order.order1_details.symbol
            });

            if (!instrumentsResponse.success || !instrumentsResponse.data || instrumentsResponse.data.length === 0) {
                throw new Error('Could not find instrument details');
            }

            const instrument = instrumentsResponse.data[0];

            // Validate quantity against lot size
            const quantity = parseInt(order.order1_details.quantity);
            if (quantity % instrument.lot_size !== 0) {
                throw new Error(`Quantity must be in multiples of lot size (${instrument.lot_size})`);
            }

            const orderPayload = {
                tradingsymbol: instrument.tradingsymbol, // Use the exact tradingsymbol from instrument
                transaction_type: order.order1_details.transaction_type,
                quantity: quantity,
                price: order.order1_details.price,
                product: order.order1_details.product,
                order_type: order.order1_details.order_type,
                validity: order.order1_details.validity,
                exchange: instrument.segment.split('-')[0], // Use NFO from segment
                instrument_token: instrument.instrument_token
            };

            const response = await placeOrder(orderPayload);
            if (response.success) {
                setSnackbar({ open: true, message: 'Order placed successfully!', severity: 'success' });
                // Refresh the orders list
                const allOrders = await getOrders();
                const ordersArray = Array.isArray(allOrders) ? allOrders : [];
                setSavedOrders(ordersArray.filter(o => o.type === 'SO'));
            } else {
                throw new Error(response.error || 'Failed to place order');
            }
        } catch (e) {
            setSnackbar({
                open: true,
                message: e.message || 'Failed to place order',
                severity: 'error'
            });
        }
        setPlacingOrder(false);
    };

    // Handler for deleting SO
    const handleDeleteSO = async (order) => {
        try {
            await deleteOrderPair(order.id);
            setSnackbar({ open: true, message: 'Order deleted successfully!', severity: 'success' });
            // Refresh the saved orders list
            const allPairs = await getOrderPairs();
            setSavedOrders(allPairs.filter(pair => pair.type === 'SO' && pair.status === 'active'));
        } catch (e) {
            setSnackbar({
                open: true,
                message: e.message || 'Failed to delete order',
                severity: 'error'
            });
        }
    };

    const resetSOForm = () => {
        setSOOrderDetails({
            tradingsymbol: '',
            transaction_type: 'BUY',
            quantity: '',
            price: '',
            product: 'CNC',
            order_type: 'LIMIT',
            validity: 'DAY',
            exchange: 'NSE'
        });
        setSOOrderError(null);
    };

    return (
        <>
            <ZerodhaSubHeader />
            <Container maxWidth="xl">
                <Box sx={{ my: 4 }}>
                    <Typography variant="body1" color="text.secondary" paragraph>
                        Manage your One-Cancels-Other (OCO), One-After-Other (OAO), and Saved Orders (SO) here.
                    </Typography>
                    <div style={{ marginBottom: '20px' }}>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => setIsOCODialogOpen(true)}
                            style={{ marginRight: '10px' }}
                        >
                            Create OCO Order
                        </Button>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => setIsOAODialogOpen(true)}
                            style={{ marginRight: '10px' }}
                        >
                            Create OAO Order
                        </Button>
                        <Button
                            variant="contained"
                            color="secondary"
                            onClick={() => setShowStoreCancelledOrderDialog(true)}
                            style={{ marginRight: '10px' }}
                        >
                            Store Cancelled Order
                        </Button>
                        <Button
                            variant="contained"
                            color="success"
                            onClick={() => {
                                resetSOForm();
                                setShowCreateSOOrderDialog(true);
                            }}
                        >
                            Create Saved Order
                        </Button>
                    </div>
                    <PairedOrdersTable />

                    {/* Saved Orders (SO) Table */}
                    <SavedOrdersTable
                        savedOrders={savedOrders}
                        onEdit={handleUpdateSO}
                        onPlace={handlePlaceOrder}
                        onDelete={handleDeleteSO}
                        placingOrder={placingOrder}
                    />
                </Box>
                <OcoOrderDialog
                    open={isOCODialogOpen}
                    onClose={() => setIsOCODialogOpen(false)}
                    orders={orders ? orders.filter(order => order.status === 'OPEN') : []}
                />
                <CreateOAOOrder
                    open={isOAODialogOpen}
                    onClose={() => setIsOAODialogOpen(false)}
                />

                {/* Store Cancelled Order Dialog */}
                <Dialog
                    open={showStoreCancelledOrderDialog}
                    onClose={() => setShowStoreCancelledOrderDialog(false)}
                    maxWidth="md"
                    fullWidth
                    aria-labelledby="store-cancelled-order-dialog-title"
                    aria-describedby="store-cancelled-order-dialog-description"
                >
                    <DialogTitle id="store-cancelled-order-dialog-title">Select a Cancelled Order to Save</DialogTitle>
                    <DialogContent id="store-cancelled-order-dialog-description">
                        {cancelledOrders.length === 0 ? (
                            <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 2 }}>
                                No cancelled orders found for today.
                            </Typography>
                        ) : (
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell />
                                        <TableCell>Symbol</TableCell>
                                        <TableCell>Qty</TableCell>
                                        <TableCell>Price</TableCell>
                                        <TableCell>Type</TableCell>
                                        <TableCell>Last Updated</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {cancelledOrders.map(order => (
                                        <TableRow
                                            key={order.order_id}
                                            selected={selectedCancelledOrder && selectedCancelledOrder.order_id === order.order_id}
                                            onClick={() => setSelectedCancelledOrder(order)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <TableCell>
                                                <Radio
                                                    checked={Boolean(selectedCancelledOrder && selectedCancelledOrder.order_id === order.order_id)}
                                                    onChange={() => setSelectedCancelledOrder(order)}
                                                />
                                            </TableCell>
                                            <TableCell>{order.tradingsymbol}</TableCell>
                                            <TableCell>{order.quantity}</TableCell>
                                            <TableCell>{order.price}</TableCell>
                                            <TableCell>{order.order_type}</TableCell>
                                            <TableCell>
                                                {order.order_timestamp || order.created_at || order.modified_at || order.timestamp
                                                    ? new Date(order.order_timestamp || order.created_at || order.modified_at || order.timestamp).toLocaleString()
                                                    : 'N/A'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setShowStoreCancelledOrderDialog(false)}>Cancel</Button>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleSaveSO}
                            disabled={!selectedCancelledOrder}
                        >
                            Save
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Create Saved Order Dialog (manual entry) */}
                <SOCreateDialog
                    open={showCreateSOOrderDialog}
                    onClose={() => setShowCreateSOOrderDialog(false)}
                    soOrderDetails={soOrderDetails}
                    setSOOrderDetails={setSOOrderDetails}
                    soOrderError={soOrderError}
                    soOrderLoading={soOrderLoading}
                    handleSaveSOManual={handleSaveSOManual}
                />

                {/* Update SO Dialog */}
                <Dialog
                    open={isUpdateSODialogOpen}
                    onClose={() => {
                        setIsUpdateSODialogOpen(false);
                        setEditingSO(null);
                    }}
                    maxWidth="sm"
                    fullWidth
                >
                    <DialogTitle>Update Saved Order (SO)</DialogTitle>
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
                                    disabled={soOrderDetails.order_type === 'MARKET'}
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
                        <Button onClick={() => {
                            setIsUpdateSODialogOpen(false);
                            setEditingSO(null);
                        }}>Cancel</Button>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleSaveUpdatedSO}
                            disabled={soOrderLoading}
                        >
                            {soOrderLoading ? 'Updating...' : 'Update'}
                        </Button>
                    </DialogActions>
                </Dialog>
                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={3000}
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                >
                    <Alert
                        onClose={() => setSnackbar({ ...snackbar, open: false })}
                        severity={snackbar.severity}
                        sx={{ width: '100%' }}
                    >
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </Container>
        </>
    );
} 