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
    Alert,
    IconButton,
    Menu,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button
} from '@mui/material';
import { MoreVert } from '@mui/icons-material';
// import { useZerodha } from '../../context/ZerodhaContext';
import moment from 'moment';
import { cancelZerodhaOrder, modifyZerodhaOrder, getOrders } from '../../services/zerodha/api';

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

function OrdersTable({ orders, title, showActions, onCancel, onModify }) {
    const [menuAnchorEl, setMenuAnchorEl] = useState(null);
    const [selectedOrder, setSelectedOrder] = useState(null);

    const handleMenuClick = (event, order) => {
        setMenuAnchorEl(event.currentTarget);
        setSelectedOrder(order);
    };
    const handleMenuClose = () => {
        setMenuAnchorEl(null);
        setSelectedOrder(null);
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
                            <TableCell>Quantity</TableCell>
                            <TableCell>Price</TableCell>
                            <TableCell>Time</TableCell>
                            {showActions && <TableCell align="right">Actions</TableCell>}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {orders.map((order) => (
                            <TableRow key={order.order_id}>
                                <TableCell>{order.order_id}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={order.status}
                                        color={order.status === 'COMPLETE' ? 'success' : order.status === 'CANCELLED' ? 'default' : 'warning'}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>{order.order_type}</TableCell>
                                <TableCell>{order.tradingsymbol}</TableCell>
                                <TableCell>{order.quantity}</TableCell>
                                <TableCell>{order.price}</TableCell>
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
                                            {(order.status === 'OPEN' || order.status === 'AMO REQ RECEIVED') && [
                                                <MenuItem key="modify" onClick={() => { handleMenuClose(); onModify(order); }}>Modify</MenuItem>,
                                                <MenuItem key="cancel" onClick={() => { handleMenuClose(); onCancel(order); }}>Cancel</MenuItem>
                                            ]}
                                            {order.status === 'COMPLETE' && [
                                                <MenuItem key="view" onClick={handleMenuClose}>View Details</MenuItem>
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

function Orders() {
    // const { orders, loading, error } = useZerodha();
    const [orders, setOrders] = useState([]); // Use state for refresh
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [modifyDialogOpen, setModifyDialogOpen] = useState(false);
    const [modifyOrder, setModifyOrder] = useState(null);
    const [modifyLoading, setModifyLoading] = useState(false);
    const [cancelLoading, setCancelLoading] = useState(false);

    // Fetch orders on mount/refresh
    const fetchOrders = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await getOrders();
            setOrders(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            setError(err.message || 'Failed to fetch orders');
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };
    React.useEffect(() => { fetchOrders(); }, []);

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

    // Split orders by status
    const openOrders = orders.filter(o => o.status === 'OPEN' || o.status === 'AMO REQ RECEIVED');
    const completedOrders = orders.filter(o => o.status === 'COMPLETE');
    const cancelledOrders = orders.filter(o => o.status === 'CANCELLED');

    return (
        <Box p={4}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
                Orders
            </Typography>
            {loading ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                    <CircularProgress />
                </Box>
            ) : error ? (
                <Box p={2}>
                    <Alert severity="error">{error}</Alert>
                </Box>
            ) : (
                <>
                    <OrdersTable orders={openOrders} title="Open Orders" showActions onCancel={handleCancelOrder} onModify={handleModifyOrder} />
                    <OrdersTable orders={completedOrders} title="Completed Orders" showActions onCancel={() => { }} onModify={() => { }} />
                    <OrdersTable orders={cancelledOrders} title="Cancelled Orders" showActions={false} />
                </>
            )}
            <ModifyOrderDialog
                open={modifyDialogOpen}
                order={modifyOrder}
                onClose={handleModifyClose}
                onSubmit={handleModifySubmit}
                loading={modifyLoading}
            />
        </Box>
    );
}

export default Orders; 