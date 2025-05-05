import React, { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Typography,
    Box,
    Chip,
    CircularProgress,
    IconButton,
    Menu,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    LinearProgress,
    Skeleton
} from '@mui/material';
import { MoreVert, Link } from '@mui/icons-material';
import { useZerodha } from '../../context/ZerodhaContext';
import moment from 'moment';
import { cancelZerodhaOrder, modifyZerodhaOrder, getOrders } from '../../services/zerodha/api';
import { formatCurrency } from '../../utils/formatters';
import LinkToTradePopup from './LinkToTradePopup';
import { getOrders as getAppOrders } from '../../services/orders';
import OcoOrderDialog from './OcoOrderDialog';
import { isOcoOrder, getPairedOrderId } from '../../services/zerodha/oco';

function formatOrderTime(timestamp) {
    if (!timestamp) return '';
    try {
        return moment(timestamp).format('DD MMM YYYY, hh:mm A');
    } catch {
        return new Date(timestamp).toLocaleString();
    }
}

function ModifyOrderDialog({ open, order, onClose, onSubmit, loading }) {
    const [quantity, setQuantity] = useState(order?.quantity || '');
    const [price, setPrice] = useState(order?.price || '');
    React.useEffect(() => {
        setQuantity(order?.quantity || '');
        setPrice(order?.price || '');
    }, [order]);
    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle>Modify Order</DialogTitle>
            <DialogContent>
                <Box display="flex" flexDirection="column" gap={2} mt={1}>
                    <TextField
                        label="Quantity"
                        type="number"
                        value={quantity}
                        onChange={e => setQuantity(e.target.value)}
                        fullWidth
                    />
                    <TextField
                        label="Price"
                        type="number"
                        value={price}
                        onChange={e => setPrice(e.target.value)}
                        fullWidth
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={loading}>Cancel</Button>
                <Button onClick={() => onSubmit({ quantity, price })} variant="contained" disabled={loading || !quantity || !price}>
                    {loading ? <CircularProgress size={20} /> : 'Submit'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

function OrdersTable({ orders, title, showActions, onCancel, onModify, onLinkToTrade }) {
    const [menuAnchorEl, setMenuAnchorEl] = useState(null);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [linkedOrderIds, setLinkedOrderIds] = useState(new Set());
    const [ocoOrderIds, setOcoOrderIds] = useState(new Set());

    React.useEffect(() => {
        let isMounted = true;
        async function checkLinkedOrders() {
            const linkedIds = new Set();
            const ocoIds = new Set();
            // Only check for completed orders
            const completedOrders = orders.filter(o => o.status === 'COMPLETE');
            await Promise.all(completedOrders.map(async (zOrder) => {
                let appOrders = [];
                if (isOptionOrFuture(zOrder)) {
                    appOrders = await getAppOrders({ tags: zOrder.order_id, type: 'option' });
                } else {
                    appOrders = await getAppOrders({ tags: zOrder.order_id, type: 'stock' });
                }
                if (appOrders && appOrders.length > 0) {
                    linkedIds.add(zOrder.order_id);
                }
                if (isOcoOrder(zOrder.order_id)) {
                    ocoIds.add(zOrder.order_id);
                    ocoIds.add(getPairedOrderId(zOrder.order_id));
                }
            }));
            if (isMounted) {
                setLinkedOrderIds(linkedIds);
                setOcoOrderIds(ocoIds);
            }
        }
        checkLinkedOrders();
        return () => { isMounted = false; };
    }, []);

    const handleMenuClick = (event, order) => {
        setMenuAnchorEl(event.currentTarget);
        setSelectedOrder(order);
    };
    const handleMenuClose = () => {
        setMenuAnchorEl(null);
        setSelectedOrder(null);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'COMPLETE':
                return 'success';
            case 'CANCELLED':
                return 'default';
            case 'TRIGGER PENDING':
                return 'info';
            default:
                return 'warning';
        }
    };

    if (!orders.length) return null;
    return (
        <Box mb={4}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                {title}
            </Typography>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Order ID</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Symbol</TableCell>
                            <TableCell>Transaction</TableCell>
                            <TableCell>Quantity</TableCell>
                            <TableCell>Price</TableCell>
                            <TableCell>Trigger Price</TableCell>
                            <TableCell>Time</TableCell>
                            {showActions && <TableCell align="right">Actions</TableCell>}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {orders.map((order) => (
                            <TableRow key={order.order_id}>
                                <TableCell>
                                    {order.order_id}
                                    {order.status === 'COMPLETE' && linkedOrderIds.has(order.order_id) && (
                                        <Chip label="Linked" color="success" size="small" sx={{ ml: 1 }} />
                                    )}
                                    {ocoOrderIds.has(order.order_id) && (
                                        <Chip label="OCO" color="info" size="small" sx={{ ml: 1 }} />
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={order.status}
                                        color={getStatusColor(order.status)}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>{order.order_type}</TableCell>
                                <TableCell>{order.tradingsymbol}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={order.transaction_type}
                                        color={order.transaction_type === 'BUY' ? 'success' : 'error'}
                                        size="small"
                                        variant="outlined"
                                    />
                                </TableCell>
                                <TableCell>{order.quantity}</TableCell>
                                <TableCell>{formatCurrency(order.price)}</TableCell>
                                <TableCell>{order.trigger_price ? formatCurrency(order.trigger_price) : '-'}</TableCell>
                                <TableCell>{formatOrderTime(order.order_timestamp)}</TableCell>
                                {showActions && (
                                    <TableCell align="right">
                                        <IconButton size="small" onClick={e => handleMenuClick(e, order)}>
                                            <MoreVert fontSize="small" />
                                        </IconButton>
                                        <Menu
                                            anchorEl={menuAnchorEl}
                                            open={Boolean(menuAnchorEl) && selectedOrder?.order_id === order.order_id}
                                            onClose={handleMenuClose}
                                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                                        >
                                            {order.status === 'TRIGGER PENDING' && [
                                                <MenuItem key="cancel" onClick={() => { handleMenuClose(); onCancel(order); }}>Cancel</MenuItem>
                                            ]}
                                            {(order.status === 'OPEN' || order.status === 'AMO REQ RECEIVED') && [
                                                <MenuItem key="modify" onClick={() => { handleMenuClose(); onModify(order); }}>Modify</MenuItem>,
                                                <MenuItem key="cancel" onClick={() => { handleMenuClose(); onCancel(order); }}>Cancel</MenuItem>
                                            ]}
                                            {order.status === 'COMPLETE' && [
                                                <MenuItem key="view" onClick={handleMenuClose}>View Details</MenuItem>,
                                                <MenuItem key="linktotrade" onClick={() => { handleMenuClose(); onLinkToTrade(order); }}>Link to Trade</MenuItem>
                                            ]}
                                        </Menu>
                                    </TableCell>
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}

// Utility to determine if a Zerodha order is an option/future
function isOptionOrFuture(order) {
    // Check if it's from NFO exchange
    if (order.exchange === 'NFO') return true;
    const symbol = order.tradingsymbol || '';
    // Check for CE/PE at the end of the symbol
    const hasOptionSuffix = /(CE|PE)$/.test(symbol);
    if (!hasOptionSuffix) return false;
    // Check if it has a valid expiry format (e.g., 24MAY, 24JUN, etc.)
    const hasExpiry = /[0-9]{2}(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)/.test(symbol);
    if (!hasExpiry) return false;
    // Check if it has a strike price (numbers before CE/PE)
    const hasStrike = /[0-9]+(CE|PE|FUT)$/.test(symbol);
    return hasStrike;
}

function Orders() {
    const { orders, loadingStates, fetchOrders } = useZerodha();
    const isLoading = loadingStates.orders;
    const [modifyDialogOpen, setModifyDialogOpen] = useState(false);
    const [modifyOrder, setModifyOrder] = useState(null);
    const [modifyLoading, setModifyLoading] = useState(false);
    const [cancelLoading, setCancelLoading] = useState(false);
    const [linkToTradeOpen, setLinkToTradeOpen] = useState(false);
    const [linkToTradeOrder, setLinkToTradeOrder] = useState(null);
    const [showOcoDialog, setShowOcoDialog] = useState(false);

    if (isLoading) {
        return (
            <Box>
                <Box sx={{ width: '100%', mb: 2 }}>
                    <LinearProgress />
                </Box>
                {[1, 2, 3].map((i) => (
                    <Box key={i} sx={{ mb: 1 }}>
                        <Skeleton variant="rectangular" height={40} />
                    </Box>
                ))}
            </Box>
        );
    }

    if (!orders || orders.length === 0) {
        return (
            <Typography variant="body1" color="text.secondary" align="center" py={4}>
                No orders found
            </Typography>
        );
    }

    // Cancel order handler
    const handleCancelOrder = async (order) => {
        if (!window.confirm(`Cancel order ${order.order_id}?`)) return;
        setCancelLoading(true);
        try {
            await cancelZerodhaOrder(order.order_id);
            await fetchOrders();
        } catch (err) {
            alert(err.message || 'Failed to cancel order');
        } finally {
            setCancelLoading(false);
        }
    };

    // Modify order handler
    const handleModifyOrder = (order) => {
        setModifyOrder(order);
        setModifyDialogOpen(true);
    };
    const handleModifySubmit = async (fields) => {
        setModifyLoading(true);
        try {
            await modifyZerodhaOrder(modifyOrder.order_id, fields);
            setModifyDialogOpen(false);
            setModifyOrder(null);
            await fetchOrders();
        } catch (err) {
            alert(err.message || 'Failed to modify order');
        } finally {
            setModifyLoading(false);
        }
    };
    const handleModifyClose = () => {
        setModifyDialogOpen(false);
        setModifyOrder(null);
    };

    // Link to trade handler
    const handleLinkToTrade = (order) => {
        setLinkToTradeOrder(order);
        setLinkToTradeOpen(true);
    };
    const handleLinkToTradeClose = () => {
        setLinkToTradeOpen(false);
        setLinkToTradeOrder(null);
    };
    const handleLinkToTradeSuccess = async () => {
        await fetchOrders();
    };

    // Split orders by status
    const openOrders = orders.filter(o => o.status === 'OPEN' || o.status === 'AMO REQ RECEIVED');
    const triggerPendingOrders = orders.filter(o => o.status === 'TRIGGER PENDING');
    const completedOrders = orders.filter(o => o.status === 'COMPLETE');
    const cancelledOrders = orders.filter(o => o.status === 'CANCELLED');

    return (
        <Box p={4}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Orders</Typography>
                <Button
                    variant="contained"
                    startIcon={<Link />}
                    onClick={() => setShowOcoDialog(true)}
                    sx={{
                        textTransform: 'none',
                        borderRadius: 1.5,
                        px: 2
                    }}
                >
                    Create OCO Order
                </Button>
            </Box>
            <OrdersTable orders={openOrders} title="Open Orders" showActions onCancel={handleCancelOrder} onModify={handleModifyOrder} />
            <OrdersTable orders={triggerPendingOrders} title="Stop Loss Orders (Trigger Pending)" showActions onCancel={handleCancelOrder} onModify={handleModifyOrder} />
            <OrdersTable orders={completedOrders} title="Completed Orders" showActions onCancel={() => { }} onModify={() => { }} onLinkToTrade={handleLinkToTrade} />
            <OrdersTable orders={cancelledOrders} title="Cancelled Orders" showActions={false} />
            <ModifyOrderDialog
                open={modifyDialogOpen}
                order={modifyOrder}
                onClose={handleModifyClose}
                onSubmit={handleModifySubmit}
                loading={modifyLoading}
            />
            <LinkToTradePopup
                open={linkToTradeOpen}
                onClose={handleLinkToTradeClose}
                zerodhaOrder={linkToTradeOrder}
                onSuccess={handleLinkToTradeSuccess}
            />
            <OcoOrderDialog
                open={showOcoDialog}
                onClose={() => setShowOcoDialog(false)}
                orders={orders.filter(o => o.status === 'OPEN' || o.status === 'TRIGGER PENDING')}
            />
        </Box>
    );
}

export default Orders; 