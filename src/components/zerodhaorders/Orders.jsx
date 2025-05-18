import React, { useState } from 'react';
import {
    Box,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    Grid,
    Snackbar,
    Alert
} from '@mui/material';
import { cancelZerodhaOrder, modifyZerodhaOrder } from '../../services/zerodha/api';
import LinkToTradePopup from './LinkToTradePopup';
import OcoOrderDialog from '../PairedOrders/OcoOrderDialog';
import OrderTable from './OrderTable';
import ModifyOrderDialog from './ModifyOrderDialog';
import { formatDateTime, formatPrice } from '../../utils/formatters';

const Orders = ({ orders = [], onRefresh }) => {
    const [modifyOrder, setModifyOrder] = useState(null);
    const [modifyLoading, setModifyLoading] = useState(false);
    const [linkToTradeOrder, setLinkToTradeOrder] = useState(null);
    const [showOcoDialog, setShowOcoDialog] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'error'
    });

    const handleCancelOrder = async (order) => {
        try {
            await cancelZerodhaOrder(order.order_id);
            onRefresh();
        } catch (error) {
            console.error('Error cancelling order:', error);
            setSnackbar({
                open: true,
                message: 'Failed to cancel order. Please try again.',
                severity: 'error'
            });
        }
    };

    const handleModifyOrder = (order) => {
        setModifyOrder(order);
    };

    const handleModifySubmit = async (fields) => {
        if (!modifyOrder) return;
        setModifyLoading(true);
        try {
            await modifyZerodhaOrder(modifyOrder.order_id, fields);
            onRefresh();
            setModifyOrder(null);
        } catch (error) {
            console.error('Error modifying order:', error);
            setSnackbar({
                open: true,
                message: 'Failed to modify order. Please try again.',
                severity: 'error'
            });
        } finally {
            setModifyLoading(false);
        }
    };

    const handleModifyClose = () => {
        setModifyOrder(null);
    };

    const handleLinkToTrade = (order) => {
        setLinkToTradeOrder(order);
    };

    const handleLinkToTradeClose = () => {
        setLinkToTradeOrder(null);
    };

    const handleLinkToTradeSuccess = async () => {
        onRefresh();
        setLinkToTradeOrder(null);
    };

    const handleViewDetails = (order) => {
        setSelectedOrder(order);
        setShowDetails(true);
    };

    const handleCloseDetails = () => {
        setShowDetails(false);
        setSelectedOrder(null);
    };

    const handleCloseSnackbar = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    // Only filter orders if we have them
    const pendingOrders = orders?.filter(order =>
        order.status === 'OPEN' ||
        order.status === 'TRIGGER PENDING' ||
        order.status === 'AMO REQ RECEIVED'
    ) || [];

    const completedOrders = orders?.filter(order =>
        order.status === 'COMPLETE'
    ) || [];

    const cancelledOrders = orders?.filter(order =>
        order.status === 'CANCELLED' ||
        order.status === 'REJECTED'
    ) || [];

    const noOrders = pendingOrders.length === 0 && completedOrders.length === 0 && cancelledOrders.length === 0;

    return (
        <Box>
            {noOrders ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, color: 'text.secondary' }}>
                    <Box sx={{ fontSize: 64, mb: 2 }}>
                        <span role="img" aria-label="No Orders">📭</span>
                    </Box>
                    <Typography variant="h6" color="text.secondary">No orders found.</Typography>
                </Box>
            ) : (
                <>
                    {pendingOrders.length > 0 && (
                        <Box mb={4}>
                            <Typography
                                variant="h6"
                                sx={{
                                    mb: 2,
                                    color: 'white',
                                    backgroundColor: 'primary.main',
                                    p: 1.5,
                                    borderRadius: 1,
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1
                                }}
                            >
                                Open Orders
                            </Typography>
                            <OrderTable
                                orders={pendingOrders}
                                onCancel={handleCancelOrder}
                                onModify={handleModifyOrder}
                                onViewDetails={handleViewDetails}
                                onLinkToTrade={handleLinkToTrade}
                            />
                        </Box>
                    )}

                    {completedOrders.length > 0 && (
                        <Box mb={4}>
                            <Typography
                                variant="h6"
                                sx={{
                                    mb: 2,
                                    color: 'white',
                                    backgroundColor: 'success.main',
                                    p: 1.5,
                                    borderRadius: 1,
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1
                                }}
                            >
                                Completed Orders
                            </Typography>
                            <OrderTable
                                orders={completedOrders}
                                onCancel={handleCancelOrder}
                                onModify={handleModifyOrder}
                                onViewDetails={handleViewDetails}
                                onLinkToTrade={handleLinkToTrade}
                            />
                        </Box>
                    )}

                    {cancelledOrders.length > 0 && (
                        <Box mb={4}>
                            <Typography
                                variant="h6"
                                sx={{
                                    mb: 2,
                                    color: 'white',
                                    backgroundColor: 'error.main',
                                    p: 1.5,
                                    borderRadius: 1,
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1
                                }}
                            >
                                Cancelled Orders
                            </Typography>
                            <OrderTable
                                orders={cancelledOrders}
                                onCancel={handleCancelOrder}
                                onModify={handleModifyOrder}
                                onViewDetails={handleViewDetails}
                                onLinkToTrade={handleLinkToTrade}
                            />
                        </Box>
                    )}
                </>
            )}

            <ModifyOrderDialog
                open={Boolean(modifyOrder)}
                order={modifyOrder}
                onClose={handleModifyClose}
                onSuccess={handleModifySubmit}
                loading={modifyLoading}
            />

            <LinkToTradePopup
                open={Boolean(linkToTradeOrder)}
                order={linkToTradeOrder}
                onClose={handleLinkToTradeClose}
                onSuccess={handleLinkToTradeSuccess}
            />

            <OcoOrderDialog
                open={showOcoDialog}
                onClose={() => setShowOcoDialog(false)}
                orders={pendingOrders}
            />

            <Dialog open={showDetails} onClose={handleCloseDetails} maxWidth="md" fullWidth>
                <DialogTitle>Order Details</DialogTitle>
                <DialogContent>
                    {selectedOrder && (
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <Typography variant="subtitle2">Order ID</Typography>
                                <Typography>{selectedOrder.order_id}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="subtitle2">Status</Typography>
                                <Typography>{selectedOrder.status}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="subtitle2">Trading Symbol</Typography>
                                <Typography>{selectedOrder.tradingsymbol}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="subtitle2">Order Type</Typography>
                                <Typography>{selectedOrder.order_type}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="subtitle2">Transaction Type</Typography>
                                <Typography>{selectedOrder.transaction_type}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="subtitle2">Quantity</Typography>
                                <Typography>{selectedOrder.quantity}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="subtitle2">Price</Typography>
                                <Typography>{formatPrice(selectedOrder.price)}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="subtitle2">Trigger Price</Typography>
                                <Typography>{formatPrice(selectedOrder.trigger_price)}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="subtitle2">Order Time</Typography>
                                <Typography>{formatDateTime(selectedOrder.order_timestamp)}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="subtitle2">Exchange</Typography>
                                <Typography>{selectedOrder.exchange}</Typography>
                            </Grid>
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDetails}>Close</Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                    variant="filled"
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default Orders; 