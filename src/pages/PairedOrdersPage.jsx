import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Box,
    Button,
    Snackbar,
    Alert,
    Tabs,
    Tab,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Grid,
    Paper
} from '@mui/material';
import PairedOrdersTable from '../components/PairedOrders/PairedOrdersTable';
import ZerodhaSubHeader from '../components/zerodha/ZerodhaSubHeader';
import OcoOrderDialog from '../components/PairedOrders/OcoOrderDialog';
import CreateOAOOrder from '../components/PairedOrders/CreateOAOOrder';
import { useZerodha } from '../context/ZerodhaContext';
import { createOrderPair, getOrderPairs, getActivePairs, updateOrderPair, deleteOrderPair, createOaoOrderPair, updateOaoOrderPair, deleteOaoOrderPair } from '../services/pairedorders/pairedorders';
import { getOrders, placeOrder, getInstruments } from '../services/zerodha/api';
import SavedOrdersTable from '../components/PairedOrders/SavedOrdersTable';
import RefreshIcon from '@mui/icons-material/Refresh';
import StockOrderDialog from '../components/PairedOrders/StockOrderDialog';
import FoOrderDialog from '../components/PairedOrders/FoOrderDialog';
import { getCompletedOrderPairs } from '../services/pairedorders/pairedorders';

function TabPanel({ children, value, index }) {
    return (
        <div hidden={value !== index} style={{ padding: '20px 0' }}>
            {value === index && children}
        </div>
    );
}

export default function PairedOrdersPage() {
    const [tabValue, setTabValue] = useState(0);
    const [isOCODialogOpen, setIsOCODialogOpen] = useState(false);
    const [isOAODialogOpen, setIsOAODialogOpen] = useState(false);
    const [showStoreCancelledOrderDialog, setShowStoreCancelledOrderDialog] = useState(false);
    const [cancelledOrders, setCancelledOrders] = useState([]);
    const [selectedCancelledOrder, setSelectedCancelledOrder] = useState(null);
    const [savedOrders, setSavedOrders] = useState([]);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const { orders, refreshActiveOrderPairs } = useZerodha();
    const [showCreateSOOrderDialog, setShowCreateSOOrderDialog] = useState(false);
    const [showCreateFOOrderDialog, setShowCreateFOOrderDialog] = useState(false);
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
    const [foOrderDetails, setFOOrderDetails] = useState({
        tradingsymbol: '',
        transaction_type: 'BUY',
        quantity: '',
        price: '',
        product: 'CNC',
        order_type: 'LIMIT',
        validity: 'DAY',
        exchange: 'NSE'
    });
    const [foOrderError, setFOOrderError] = useState(null);
    const [foOrderLoading, setFOOrderLoading] = useState(false);
    const [editingFO, setEditingFO] = useState(null);
    const [isUpdateFODialogOpen, setIsUpdateFODialogOpen] = useState(false);
    const [completedOrders, setCompletedOrders] = useState([]);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
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
            setSnackbar({
                open: true,
                message: 'Failed to fetch cancelled orders',
                severity: 'error'
            });
            setCancelledOrders([]);
        }
    };

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
            const allPairs = await getActivePairs();
            setSavedOrders(allPairs.filter(pair => (pair.type === 'SO' || pair.type === 'FO') && pair.status === 'active'));
        };
        fetchSavedOrders();
    }, [showStoreCancelledOrderDialog, snackbar.open]);

    // Handler to save SO
    const handleSaveSO = async () => {
        if (!selectedCancelledOrder) return;
        setSOOrderLoading(true);
        setSOOrderError(null);
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
            await refreshActiveOrderPairs();
            setShowStoreCancelledOrderDialog(false);
            setSelectedCancelledOrder(null);
            setSnackbar({ open: true, message: 'Order saved successfully!', severity: 'success' });
        } catch (e) {
            setSOOrderError('Failed to save order.');
        } finally {
            setSOOrderLoading(false);
        }
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

    // Handler for updating SO/FO
    const handleUpdateSO = (order) => {
        // Check if it's a F&O order by looking at the exchange
        const isFOOrder = order.order1_details.exchange === 'NFO';

        if (isFOOrder) {
            // Set F&O form data
            setFOOrderDetails({
                tradingsymbol: order.order1_details.tradingsymbol || order.order1_details.symbol,
                transaction_type: order.order1_details.transaction_type || 'BUY',
                quantity: order.order1_details.quantity || '',
                price: order.order1_details.price || '',
                product: order.order1_details.product || 'NRML',
                order_type: order.order1_details.order_type || 'LIMIT',
                validity: order.order1_details.validity || 'IOC',
                exchange: order.order1_details.exchange || 'NFO'
            });
            // Set editing state for F&O
            setEditingFO(order);
            setIsUpdateFODialogOpen(true);
        } else {
            // Set Stock form data
            setSOOrderDetails({
                tradingsymbol: order.order1_details.tradingsymbol || order.order1_details.symbol,
                transaction_type: order.order1_details.transaction_type || 'BUY',
                quantity: order.order1_details.quantity || '',
                price: order.order1_details.price || '',
                product: order.order1_details.product || 'CNC',
                order_type: order.order1_details.order_type || 'LIMIT',
                validity: order.order1_details.validity || 'DAY',
                exchange: order.order1_details.exchange || 'NSE'
            });
            // Set editing state for Stock
            setEditingSO(order);
            setIsUpdateSODialogOpen(true);
        }
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
            // Close dialog and reset state
            setIsUpdateSODialogOpen(false);
            setEditingSO(null);
            resetSOForm();
            // Refresh the saved orders list
            const allPairs = await getActivePairs();
            setSavedOrders(allPairs.filter(pair => pair.type === 'SO' && pair.status === 'active'));
        } catch (e) {
            setSOOrderError('Failed to update order.');
        }
        setSOOrderLoading(false);
    };

    // Handler for saving updated FO
    const handleSaveUpdatedFO = async () => {
        if (!editingFO) return;
        setFOOrderLoading(true);
        setFOOrderError(null);
        const payload = {
            order1_details: {
                ...foOrderDetails,
                lastupdatedat: new Date().toISOString(),
            }
        };
        try {
            await updateOrderPair(editingFO.id, payload);
            setSnackbar({ open: true, message: 'F&O Order updated successfully!', severity: 'success' });
            // Close dialog and reset state
            setIsUpdateFODialogOpen(false);
            setEditingFO(null);
            setFOOrderDetails({
                tradingsymbol: '',
                transaction_type: 'BUY',
                quantity: '',
                price: '',
                product: 'NRML',
                order_type: 'LIMIT',
                validity: 'IOC',
                exchange: 'NFO'
            });
            // Refresh the saved orders list
            const allPairs = await getActivePairs();
            setSavedOrders(allPairs.filter(pair => (pair.type === 'SO' || pair.type === 'FO') && pair.status === 'active'));
        } catch (e) {
            setFOOrderError('Failed to update F&O order.');
        }
        setFOOrderLoading(false);
    };

    // Handler for placing order
    const handlePlaceOrder = async (order) => {
        setPlacingOrder(true);
        try {
            // First, get the instrument token with appropriate parameters based on order type
            const isStockOrder = order.order1_details.exchange === 'NSE' || order.order1_details.exchange === 'BSE';
            const instrumentsResponse = await getInstruments({
                search: order.order1_details.tradingsymbol || order.order1_details.symbol,
                exchange: order.order1_details.exchange,
                type: isStockOrder ? 'EQ' : undefined
            });

            if (!instrumentsResponse.success || !instrumentsResponse.data || instrumentsResponse.data.length === 0) {
                throw new Error('Could not find instrument details');
            }

            const instrument = instrumentsResponse.data[0];

            // Validate quantity against lot size only for F&O orders
            const quantity = parseInt(order.order1_details.quantity);
            if (!isStockOrder && quantity % instrument.lot_size !== 0) {
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
                throw new Error(response.message || 'Failed to place order');
            }
        } catch (error) {
            setSnackbar({ open: true, message: error.message || 'Failed to place order', severity: 'error' });
        } finally {
            setPlacingOrder(false);
        }
    };

    // Handler for deleting SO
    const handleDeleteSO = async (order) => {
        try {
            await deleteOrderPair(order.id);
            setSnackbar({ open: true, message: 'Order deleted successfully!', severity: 'success' });
            // Refresh the saved orders list
            const allPairs = await getActivePairs();
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

    // Handler to save F&O Order from manual entry
    const handleSaveFOManual = async () => {
        // Validation
        if (!foOrderDetails.tradingsymbol) return setFOOrderError('Trading symbol is required');
        if (!foOrderDetails.quantity || foOrderDetails.quantity <= 0) return setFOOrderError('Valid quantity is required');
        if (!foOrderDetails.price || foOrderDetails.price <= 0) return setFOOrderError('Valid price is required');
        if (!foOrderDetails.exchange) return setFOOrderError('Exchange is required');
        setFOOrderLoading(true);
        setFOOrderError(null);
        const payload = {
            type: 'FO',
            order1_id: 'MANUAL',
            order1_details: {
                ...foOrderDetails,
                lastupdatedat: new Date().toISOString(),
            },
            order2_id: '',
            order2_details: {},
        };
        try {
            await createOrderPair(payload);
            setSnackbar({ open: true, message: 'F&O Order saved successfully!', severity: 'success' });
            setShowCreateFOOrderDialog(false);
            setFOOrderDetails({
                tradingsymbol: '',
                transaction_type: 'BUY',
                quantity: '',
                price: '',
                product: 'NRML',
                order_type: 'LIMIT',
                validity: 'IOC',
                exchange: 'NFO'
            });
        } catch (e) {
            setFOOrderError('Failed to save F&O order.');
        }
        setFOOrderLoading(false);
    };

    useEffect(() => {
        if (tabValue === 1) {
            const fetchCompletedOrders = async () => {
                try {
                    const response = await getCompletedOrderPairs();
                    setCompletedOrders(response);
                } catch (error) {
                    console.error('Error fetching completed orders:', error);
                    setSnackbar({
                        open: true,
                        message: 'Failed to fetch completed orders',
                        severity: 'error'
                    });
                }
            };
            fetchCompletedOrders();
        }
    }, [tabValue]);

    return (
        <>
            <ZerodhaSubHeader />
            <Box sx={{ my: 4, p: 3, bgcolor: 'grey.50', minHeight: '100vh' }}>
                <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#1a237e' }}>
                    Paired Orders
                </Typography>

                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={tabValue} onChange={handleTabChange}>
                        <Tab label="Active Orders" />
                        <Tab label="Completed Orders" />
                    </Tabs>
                </Box>

                {/* Active Orders Tab */}
                <TabPanel value={tabValue} index={0}>
                    <Box sx={{ mb: 4 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'right', alignItems: 'center', mb: 2 }}>
                            <Box>
                                <Button
                                    variant="outlined"
                                    color="primary"
                                    onClick={async () => {
                                        await refreshActiveOrderPairs();
                                        const allPairs = await getActivePairs();
                                        setSavedOrders(allPairs.filter(pair => pair.type === 'SO' && pair.status === 'active'));
                                        setSnackbar({ open: true, message: 'Orders refreshed successfully!', severity: 'success' });
                                    }}
                                    startIcon={<RefreshIcon />}
                                    sx={{ mr: 1 }}
                                >
                                    Refresh Orders
                                </Button>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={() => setIsOCODialogOpen(true)}
                                    sx={{ mr: 1 }}
                                >
                                    Create OCO
                                </Button>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={() => setIsOAODialogOpen(true)}
                                    sx={{ mr: 1 }}
                                >
                                    Create OAO
                                </Button>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={() => {
                                        setSOOrderDetails(prev => ({
                                            ...prev,
                                            exchange: 'NSE',
                                            product: 'CNC',
                                            order_type: 'LIMIT',
                                            validity: 'DAY'
                                        }));
                                        setShowCreateSOOrderDialog(true);
                                    }}
                                    sx={{ mr: 1 }}
                                >
                                    Save Stock Order
                                </Button>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={() => {
                                        setSOOrderDetails(prev => ({
                                            ...prev,
                                            exchange: 'NFO',
                                            product: 'NRML'
                                        }));
                                        setShowCreateFOOrderDialog(true);
                                    }}
                                    sx={{ mr: 1 }}
                                >
                                    Save F&O Order
                                </Button>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handleStoreCancelledOrder}
                                    disabled={placingOrder}
                                    sx={{ mr: 1 }}
                                >
                                    Store Cancelled Order
                                </Button>
                            </Box>
                        </Box>
                        <PairedOrdersTable />
                        <SavedOrdersTable
                            savedOrders={savedOrders}
                            onEdit={handleUpdateSO}
                            onPlace={handlePlaceOrder}
                            onDelete={handleDeleteSO}
                            placingOrder={placingOrder}
                        />
                    </Box>
                </TabPanel>

                {/* Completed Orders Tab */}
                <TabPanel value={tabValue} index={1}>
                    <Box sx={{ mb: 4 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'right', alignItems: 'center', mb: 2 }}>
                            <Button
                                variant="outlined"
                                color="primary"
                                onClick={async () => {
                                    await refreshActiveOrderPairs();
                                    setSnackbar({ open: true, message: 'Orders refreshed successfully!', severity: 'success' });
                                }}
                                startIcon={<RefreshIcon />}
                            >
                                Refresh Orders
                            </Button>
                        </Box>
                        <PairedOrdersTable showCompleted={true} />
                    </Box>
                </TabPanel>
            </Box>

            {/* Dialogs */}
            <OcoOrderDialog
                open={isOCODialogOpen}
                onClose={() => setIsOCODialogOpen(false)}
                orders={orders ? orders.filter(order => order.status === 'OPEN') : []}
            />
            <CreateOAOOrder
                open={isOAODialogOpen}
                onClose={() => setIsOAODialogOpen(false)}
            />

            {/* Stock Order Dialog */}
            <StockOrderDialog
                open={showCreateSOOrderDialog || isUpdateSODialogOpen}
                onClose={() => {
                    setShowCreateSOOrderDialog(false);
                    setIsUpdateSODialogOpen(false);
                    resetSOForm();
                }}
                orderDetails={soOrderDetails}
                setOrderDetails={setSOOrderDetails}
                error={soOrderError}
                loading={soOrderLoading}
                onSave={isUpdateSODialogOpen ? handleSaveUpdatedSO : handleSaveSOManual}
                isEditing={isUpdateSODialogOpen}
            />

            {/* F&O Order Dialog */}
            <FoOrderDialog
                open={showCreateFOOrderDialog || isUpdateFODialogOpen}
                onClose={() => {
                    setShowCreateFOOrderDialog(false);
                    setIsUpdateFODialogOpen(false);
                    setFOOrderDetails({
                        tradingsymbol: '',
                        transaction_type: 'BUY',
                        quantity: '',
                        price: '',
                        product: 'NRML',
                        order_type: 'LIMIT',
                        validity: 'IOC',
                        exchange: 'NFO'
                    });
                }}
                orderDetails={foOrderDetails}
                setOrderDetails={setFOOrderDetails}
                error={foOrderError}
                loading={foOrderLoading}
                onSave={isUpdateFODialogOpen ? handleSaveUpdatedFO : handleSaveFOManual}
                isEditing={isUpdateFODialogOpen}
            />

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
                    {cancelledOrders.length === 0 ? (
                        <Typography>No cancelled orders found for today.</Typography>
                    ) : (
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle1" gutterBottom>
                                Select a cancelled order to save:
                            </Typography>
                            <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                                {cancelledOrders.map((order) => (
                                    <Paper
                                        key={order.order_id}
                                        sx={{
                                            p: 2,
                                            mb: 1,
                                            cursor: 'pointer',
                                            bgcolor: selectedCancelledOrder?.order_id === order.order_id ? 'action.selected' : 'background.paper',
                                            '&:hover': {
                                                bgcolor: 'action.hover'
                                            }
                                        }}
                                        onClick={() => setSelectedCancelledOrder(order)}
                                    >
                                        <Grid container spacing={2}>
                                            <Grid item xs={12} sm={6}>
                                                <Typography variant="subtitle2">
                                                    {order.tradingsymbol || order.symbol}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {order.exchange}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <Typography variant="body2">
                                                    Type: {order.transaction_type}
                                                </Typography>
                                                <Typography variant="body2">
                                                    Qty: {order.quantity}
                                                </Typography>
                                                <Typography variant="body2">
                                                    Price: {order.price}
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                    </Paper>
                                ))}
                            </Box>
                        </Box>
                    )}
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
                        disabled={!selectedCancelledOrder || soOrderLoading}
                        variant="contained"
                        color="primary"
                    >
                        {soOrderLoading ? 'Saving...' : 'Save Order'}
                    </Button>
                </DialogActions>
            </Dialog>

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
} 