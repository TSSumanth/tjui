import React, { useState, useEffect } from 'react';
import {
    Box,
    LinearProgress,
    Skeleton,
    Button,
    Stack,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    Grid
} from '@mui/material';
import { useZerodha } from '../../context/ZerodhaContext';
import { cancelZerodhaOrder, modifyZerodhaOrder, getOrders } from '../../services/zerodha/api';
import LinkToTradePopup from './LinkToTradePopup';
import OcoOrderDialog from '../PairedOrders/OcoOrderDialog';
import OrderTable from './OrderTable';
import ModifyOrderDialog from './ModifyOrderDialog';
import { Link } from '@mui/icons-material';
import { formatDateTime, formatPrice } from '../../utils/formatters';

const Orders = () => {
    const { orders, loadingStates, fetchOrders } = useZerodha();
    const isLoading = loadingStates.orders;
    const [modifyOrder, setModifyOrder] = useState(null);
    const [modifyLoading, setModifyLoading] = useState(false);
    const [linkToTradeOrder, setLinkToTradeOrder] = useState(null);
    const [showOcoDialog, setShowOcoDialog] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showDetails, setShowDetails] = useState(false);

    const handleCancelOrder = async (order) => {
        try {
            await cancelZerodhaOrder(order.order_id);
            fetchOrders();
        } catch (error) {
            console.error('Error cancelling order:', error);
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
            fetchOrders();
            setModifyOrder(null);
        } catch (error) {
            console.error('Error modifying order:', error);
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
        await fetchOrders();
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

    if (isLoading) {
        return (
            <Box sx={{ width: '100%' }}>
                <LinearProgress />
                <Box sx={{ p: 2 }}>
                    <Skeleton variant="rectangular" height={400} />
                </Box>
            </Box>
        );
    }

    const pendingOrders = orders.filter(order =>
        order.status === 'OPEN' ||
        order.status === 'TRIGGER PENDING' ||
        order.status === 'AMO REQ RECEIVED'
    );

    const completedOrders = orders.filter(order =>
        order.status === 'COMPLETE'
    );

    const cancelledOrders = orders.filter(order =>
        order.status === 'CANCELLED' ||
        order.status === 'REJECTED'
    );

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
        </Box>
    );
};

export default Orders; 