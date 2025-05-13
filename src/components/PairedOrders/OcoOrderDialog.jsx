import React, { useState } from 'react';
import moment from 'moment';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    CircularProgress,
    Alert,
    Snackbar,
    IconButton
} from '@mui/material';
import { addOcoPair, isOcoOrder, createOrderPair } from '../../services/zerodha/oco';
import { formatCurrency } from '../../utils/formatters';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useZerodha } from '../../context/ZerodhaContext';

function formatOrderTime(timestamp) {
    if (!timestamp) return '';
    try {
        return moment(timestamp).format('DD MMM YYYY, hh:mm A');
    } catch {
        return new Date(timestamp).toLocaleString();
    }
}

export default function OcoOrderDialog({ open, onClose, orders }) {
    const [selectedOrders, setSelectedOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const { fetchOrders } = useZerodha();

    const handleOrderSelect = (order) => {
        if (selectedOrders.find(o => o.order_id === order.order_id)) {
            setSelectedOrders(selectedOrders.filter(o => o.order_id !== order.order_id));
        } else if (selectedOrders.length < 2) {
            setSelectedOrders([...selectedOrders, order]);
        }
    };

    const handleSubmit = async () => {
        if (selectedOrders.length !== 2) return;

        setLoading(true);
        setError('');

        try {
            const [order1, order2] = selectedOrders;
            await createOrderPair({
                order1_id: order1.order_id,
                order2_id: order2.order_id,
                type: 'OCO',
                order1_details: {
                    tradingsymbol: order1.tradingsymbol,
                    transaction_type: order1.transaction_type,
                    quantity: order1.quantity,
                    price: order1.price,
                    product: order1.product,
                    order_type: order1.order_type,
                    validity: order1.validity,
                    orderstatus: order1.status || 'OPEN'
                },
                order2_details: {
                    tradingsymbol: order2.tradingsymbol,
                    transaction_type: order2.transaction_type,
                    quantity: order2.quantity,
                    price: order2.price,
                    product: order2.product,
                    order_type: order2.order_type,
                    validity: order2.validity,
                    orderstatus: order2.status || 'OPEN'
                }
            });

            setShowSuccess(true);
            onClose();
        } catch (err) {
            console.error('Error creating OCO pair:', err);
            setError(err.message || 'Failed to create OCO pair');
        } finally {
            setLoading(false);
        }
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

    return (
        <>
            <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Create One Cancels Other (OCO) Order
                    <IconButton
                        onClick={async () => {
                            await fetchOrders();
                            setSnackbar({ open: true, message: 'Orders refreshed successfully!', severity: 'success' });
                        }}
                        size="small"
                    >
                        <RefreshIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Paper elevation={3} sx={{ p: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6">Open Orders</Typography>
                                <IconButton
                                    size="small"
                                    onClick={async () => {
                                        await fetchOrders();
                                        setSnackbar({ open: true, message: 'Orders refreshed successfully', severity: 'success' });
                                    }}
                                >
                                    <RefreshIcon />
                                </IconButton>
                            </Box>
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Order ID</TableCell>
                                            <TableCell>Symbol</TableCell>
                                            <TableCell>Type</TableCell>
                                            <TableCell>Price</TableCell>
                                            <TableCell>Status</TableCell>
                                            <TableCell>Action</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {orders.map((order) => (
                                            <TableRow key={order.order_id}>
                                                <TableCell>{order.order_id}</TableCell>
                                                <TableCell>{order.tradingsymbol}</TableCell>
                                                <TableCell>{order.order_type}</TableCell>
                                                <TableCell>{order.price}</TableCell>
                                                <TableCell>{order.status}</TableCell>
                                                <TableCell>
                                                    <Button
                                                        size="small"
                                                        variant="contained"
                                                        color="primary"
                                                        onClick={() => handleOrderSelect(order)}
                                                        disabled={selectedOrders.length >= 2}
                                                    >
                                                        Select
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose} disabled={loading}>Cancel</Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        disabled={loading || selectedOrders.length !== 2}
                    >
                        {loading ? <CircularProgress size={20} /> : 'Create OCO Pair'}
                    </Button>
                </DialogActions>
            </Dialog>
            <Snackbar
                open={showSuccess}
                autoHideDuration={1200}
                onClose={() => setShowSuccess(false)}
                message="OCO Pair created successfully!"
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            />
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