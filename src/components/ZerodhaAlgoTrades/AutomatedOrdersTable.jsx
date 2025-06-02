import React, { useState } from 'react';
import { Table, TableHead, TableRow, TableCell, TableBody, Typography, IconButton, Snackbar, Alert, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { deleteAutomatedOrder, updateAutomatedOrder } from '../../services/automatedOrders';

const ORDER_TYPES = ['LIMIT', 'MARKET'];

const AutomatedOrdersTable = ({ orders, onRefresh }) => {
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [editOrder, setEditOrder] = useState(null);
    const [editState, setEditState] = useState({ order_type: 'MARKET', price: '' });
    const [loading, setLoading] = useState(false);

    const handleDelete = async (order) => {
        setLoading(true);
        try {
            await deleteAutomatedOrder(order.id);
            setSnackbar({ open: true, message: 'Order deleted successfully', severity: 'success' });
            onRefresh && onRefresh();
        } catch (err) {
            setSnackbar({ open: true, message: err?.response?.data?.error || err.message || 'Failed to delete order', severity: 'error' });
        }
        setLoading(false);
    };

    const handleEdit = (order) => {
        setEditOrder(order);
        setEditState({ order_type: order.order_type, price: order.price || '' });
    };

    const handleEditChange = (field, value) => {
        setEditState(prev => ({ ...prev, [field]: value }));
    };

    const handleEditSubmit = async () => {
        setLoading(true);
        try {
            await updateAutomatedOrder(editOrder.id, {
                order_type: editState.order_type,
                price: editState.order_type === 'LIMIT' ? editState.price : null
            });
            setSnackbar({ open: true, message: 'Order updated successfully', severity: 'success' });
            setEditOrder(null);
            onRefresh && onRefresh();
        } catch (err) {
            setSnackbar({ open: true, message: err?.response?.data?.error || err.message || 'Failed to update order', severity: 'error' });
        }
        setLoading(false);
    };

    const handleCloseSnackbar = () => setSnackbar(prev => ({ ...prev, open: false }));
    const handleCloseEdit = () => setEditOrder(null);

    if (!orders || orders.length === 0) {
        return (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                No automated orders found for this strategy.
            </Typography>
        );
    }
    return (
        <>
            <Table size="small" sx={{ mb: 1 }}>
                <TableHead>
                    <TableRow>
                        <TableCell sx={{ p: 0.5, fontWeight: 600 }}>Trading Symbol</TableCell>
                        <TableCell sx={{ p: 0.5, fontWeight: 600 }}>Quantity</TableCell>
                        <TableCell sx={{ p: 0.5, fontWeight: 600 }}>Status</TableCell>
                        <TableCell sx={{ p: 0.5, fontWeight: 600 }}>Order Type</TableCell>
                        <TableCell sx={{ p: 0.5, fontWeight: 600 }}>Price</TableCell>
                        <TableCell sx={{ p: 0.5, fontWeight: 600 }}>Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {orders.map((order, idx) => (
                        <TableRow key={order.id || idx}>
                            <TableCell sx={{ p: 0.5, fontSize: 14 }}>{order.trading_symbol}</TableCell>
                            <TableCell sx={{ p: 0.5, fontSize: 14 }}>{order.quantity}</TableCell>
                            <TableCell sx={{ p: 0.5, fontSize: 14 }}>{order.status}</TableCell>
                            <TableCell sx={{ p: 0.5, fontSize: 14 }}>{order.order_type}</TableCell>
                            <TableCell sx={{ p: 0.5, fontSize: 14 }}>{order.price}</TableCell>
                            <TableCell sx={{ p: 0.5 }}>
                                <IconButton size="small" onClick={() => handleEdit(order)}>
                                    <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton size="small" onClick={() => {/* Placeholder for execute */ }}>
                                    <PlayArrowIcon fontSize="small" />
                                </IconButton>
                                <IconButton size="small" onClick={() => handleDelete(order)} disabled={loading}>
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
            <Dialog open={!!editOrder} onClose={handleCloseEdit} maxWidth="xs" fullWidth>
                <DialogTitle>Edit Automated Order</DialogTitle>
                <DialogContent>
                    <TextField
                        select
                        label="Order Type"
                        value={editState.order_type}
                        onChange={e => handleEditChange('order_type', e.target.value)}
                        size="small"
                        fullWidth
                        sx={{ mb: 2 }}
                    >
                        {ORDER_TYPES.map(opt => (
                            <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                        ))}
                    </TextField>
                    <TextField
                        label="Price"
                        value={editState.price}
                        onChange={e => handleEditChange('price', e.target.value)}
                        size="small"
                        fullWidth
                        disabled={editState.order_type !== 'LIMIT'}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseEdit} disabled={loading}>Cancel</Button>
                    <Button onClick={handleEditSubmit} variant="contained" disabled={loading}>
                        {loading ? 'Saving...' : 'Save'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default AutomatedOrdersTable; 