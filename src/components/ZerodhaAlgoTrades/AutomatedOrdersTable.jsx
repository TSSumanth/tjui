import React, { useState } from 'react';
import { Table, TableHead, TableRow, TableCell, TableBody, Typography, IconButton, Snackbar, Alert, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Box, Tooltip, CircularProgress } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RefreshIcon from '@mui/icons-material/Refresh';
import { deleteAutomatedOrder, updateAutomatedOrder } from '../../services/automatedOrders';
import { placeRegularOrder } from '../../services/zerodha/api';
import { updateAlgoStrategy, getAlgoStrategyById } from '../../services/algoStrategies';

const ORDER_TYPES = ['LIMIT', 'MARKET'];

const AutomatedOrdersTable = ({ orders, onRefresh, onStatusCheck, checkingStatus, strategyId, onStrategyUpdate }) => {
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [editOrder, setEditOrder] = useState(null);
    const [editState, setEditState] = useState({ order_type: 'MARKET', price: '' });
    const [loading, setLoading] = useState(false);

    const handleDelete = async (order) => {
        setLoading(true);
        try {
            console.log(`🗑️ Starting delete for order ${order.id} in strategy ${strategyId}`);
            
            // Delete the automated order
            await deleteAutomatedOrder(order.id);
            console.log(`✅ Order ${order.id} deleted successfully`);

            // Update the strategy to remove the order ID from automated_order_ids array
            if (strategyId) {
                console.log(`🔄 Updating strategy ${strategyId} to remove order ${order.id}`);
                try {
                    const strategy = await getAlgoStrategyById(strategyId);
                    console.log(`📊 Strategy data received:`, strategy);
                    
                    // Handle both response formats: { success: true, data: {...} } and direct object
                    if (strategy && (strategy.success ? strategy.data : strategy)) {
                        const strategyData = strategy.success ? strategy.data : strategy;
                        const currentOrderIds = strategyData.automated_order_ids || [];
                        console.log(`📋 Current automated_order_ids:`, currentOrderIds);
                        
                        const updatedOrderIds = currentOrderIds.filter(id => id !== order.id);
                        console.log(`🔄 Filtered automated_order_ids:`, updatedOrderIds);
                        
                        console.log(`💾 Calling updateAlgoStrategy with:`, { automated_order_ids: updatedOrderIds });
                    await updateAlgoStrategy(strategyId, {
                        automated_order_ids: updatedOrderIds
                    });
                        
                        console.log(`✅ Strategy ${strategyId} updated successfully. Removed order ${order.id}. New automated_order_ids:`, updatedOrderIds);
                    } else {
                        console.warn(`⚠️ Strategy data not found or invalid:`, strategy);
                    }
                } catch (strategyUpdateErr) {
                    console.error('❌ Error updating strategy automated_order_ids:', strategyUpdateErr);
                    // Don't fail the entire delete operation if strategy update fails
                    // The order is already deleted, so we just log the error
                }
            } else {
                console.warn(`⚠️ No strategyId provided, skipping strategy update`);
            }

            setSnackbar({ open: true, message: 'Order deleted successfully', severity: 'success' });
            
            // Refresh both the orders and the strategy data
            if (onRefresh) {
                onRefresh();
            }
            
            // Also trigger a strategy refresh to update automated_order_ids
            if (onStrategyUpdate) {
                onStrategyUpdate();
            }
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

    const handleExecute = async (order) => {
        setLoading(true);
        try {
            const orderParams = {
                tradingsymbol: order.trading_symbol,
                exchange: order.exchange,
                transaction_type: order.transaction_type,
                quantity: Math.abs(order.quantity),
                product: order.product,
                order_type: order.order_type,
                validity: order.validity
            };

            // Only add price for LIMIT orders
            if (order.order_type === 'LIMIT' && order.price !== null) {
                orderParams.price = order.price;
            }

            const response = await placeRegularOrder(orderParams);
            const zerodhaOrderId = response.order_id;
            await updateAutomatedOrder(order.id, {
                status: 'SENT TO ZERODHA',
                zerodha_orderid: zerodhaOrderId
            });
            setSnackbar({ open: true, message: 'Order executed successfully', severity: 'success' });
            onRefresh && onRefresh();
        } catch (err) {
            setSnackbar({ open: true, message: err?.response?.data?.error || err.message || 'Failed to execute order', severity: 'error' });
        }
        setLoading(false);
    };

    const handleCloseSnackbar = () => setSnackbar(prev => ({ ...prev, open: false }));
    const handleCloseEdit = () => setEditOrder(null);

    if (!orders || orders.length === 0) {
        return (
            <Box sx={{ 
                textAlign: 'center', 
                py: 3,
                color: 'text.secondary',
                bgcolor: 'grey.50',
                borderRadius: 2,
                border: '1px dashed',
                borderColor: 'grey.300'
            }}>
                <Typography variant="body1" sx={{ mb: 1 }}>
                No automated orders found for this strategy.
            </Typography>
                <Typography variant="body2" color="text.secondary">
                    Create automated orders to manage your position exits.
                </Typography>
            </Box>
        );
    }
    return (
        <>
            {/* Table Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                        {orders.length} Automated Order{orders.length !== 1 ? 's' : ''}
                    </Typography>
                    {/* Status Summary */}
                    {orders.some(order => order.status === 'SENT TO ZERODHA') && (
                        <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 1,
                            px: 1.5,
                            py: 0.5,
                            bgcolor: 'warning.50',
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: 'warning.200'
                        }}>
                            <Typography variant="caption" color="warning.main" sx={{ fontWeight: 600 }}>
                                {orders.filter(o => o.status === 'SENT TO ZERODHA').length} Order{orders.filter(o => o.status === 'SENT TO ZERODHA').length > 1 ? 's' : ''} Pending
                            </Typography>
                        </Box>
                    )}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                        Manage exit orders for your positions
                    </Typography>
                    <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1,
                        px: 1.5,
                        py: 0.5,
                        bgcolor: 'info.50',
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'info.200'
                    }}>
                        <Typography variant="caption" color="info.main" sx={{ fontWeight: 600 }}>
                            Actions Available: OPEN orders only
                        </Typography>
                    </Box>
                    {/* Manual Refresh Button */}
                    {orders.some(order => order.status === 'SENT TO ZERODHA') && (
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={onStatusCheck}
                            disabled={loading || checkingStatus}
                            startIcon={checkingStatus ? <CircularProgress size={16} /> : <RefreshIcon />}
                            sx={{
                                borderColor: 'warning.main',
                                color: 'warning.main',
                                '&:hover': {
                                    borderColor: 'warning.dark',
                                    backgroundColor: 'warning.50'
                                }
                            }}
                        >
                            {checkingStatus ? 'Checking...' : 'Check Status'}
                        </Button>
                    )}
                </Box>
            </Box>
            
            <Table size="small" sx={{ mb: 2, borderRadius: 2, overflow: 'hidden', boxShadow: 1 }}>
                <TableHead>
                    <TableRow sx={{ backgroundColor: 'primary.main' }}>
                        <TableCell sx={{ p: 1, fontWeight: 700, color: 'white', fontSize: '0.875rem', textAlign: 'left' }}>
                            Trading Symbol
                        </TableCell>
                        <TableCell sx={{ p: 1, fontWeight: 700, color: 'white', fontSize: '0.875rem', textAlign: 'center' }}>
                            Quantity
                        </TableCell>
                        <TableCell sx={{ p: 1, fontWeight: 700, color: 'white', fontSize: '0.875rem', textAlign: 'center' }}>
                            Order Type
                        </TableCell>
                        <TableCell sx={{ p: 1, fontWeight: 700, color: 'white', fontSize: '0.875rem', textAlign: 'right' }}>
                            Price
                        </TableCell>
                        <TableCell sx={{ p: 1, fontWeight: 700, color: 'white', fontSize: '0.875rem', textAlign: 'center' }}>
                            Status
                        </TableCell>
                        <TableCell sx={{ p: 1, fontWeight: 700, color: 'white', fontSize: '0.875rem', textAlign: 'center' }}>
                            Zerodha Order ID
                        </TableCell>
                        <TableCell sx={{ p: 1, fontWeight: 700, color: 'white', fontSize: '0.875rem', textAlign: 'center' }}>
                            Actions
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {orders.map((order, idx) => (
                        <TableRow 
                            key={order.id || idx}
                            sx={{
                                backgroundColor: idx % 2 === 0 ? 'background.paper' : 'grey.50',
                                '&:hover': {
                                    backgroundColor: 'action.hover',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                },
                                transition: 'all 0.2s ease-in-out'
                            }}
                        >
                            <TableCell sx={{ p: 1, fontSize: 14, textAlign: 'left', fontWeight: 500 }}>
                                {order.trading_symbol}
                            </TableCell>
                            <TableCell sx={{ p: 1, fontSize: 14, textAlign: 'center', fontWeight: 500 }}>
                                {order.quantity}
                            </TableCell>
                            <TableCell sx={{ p: 1, fontSize: 14, textAlign: 'center' }}>
                                <Tooltip 
                                    title={order.order_type === 'LIMIT' ? 'Limit order: Execute at specified price or better' : 'Market order: Execute at current market price'}
                                    arrow
                                    placement="top"
                                >
                                    <Box
                                        sx={{
                                            display: 'inline-block',
                                            px: 1.5,
                                            py: 0.5,
                                            borderRadius: 1,
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                            textTransform: 'uppercase',
                                            backgroundColor: order.order_type === 'LIMIT' ? 'primary.100' : 'success.100',
                                            color: order.order_type === 'LIMIT' ? 'primary.700' : 'success.700',
                                            border: '1px solid',
                                            borderColor: order.order_type === 'LIMIT' ? 'primary.300' : 'success.300'
                                        }}
                                    >
                                        {order.order_type}
                                    </Box>
                                </Tooltip>
                            </TableCell>
                            <TableCell sx={{ p: 1, fontSize: 14, textAlign: 'right', fontWeight: 500 }}>
                                <Tooltip 
                                    title={order.price ? `Limit price: ${order.price}` : 'No price set (Market order)'}
                                    arrow
                                    placement="top"
                                >
                                    <span>{order.price || '-'}</span>
                                </Tooltip>
                            </TableCell>
                            <TableCell sx={{ p: 1, fontSize: 14, textAlign: 'center' }}>
                                <Tooltip 
                                    title={(() => {
                                        switch(order.status) {
                                            case 'OPEN':
                                                return 'Order created and ready for execution';
                                            case 'SENT TO ZERODHA':
                                                return 'Order sent to Zerodha, waiting for execution';
                                            case 'COMPLETED':
                                                return 'Order executed successfully';
                                            case 'CANCELLED':
                                                return 'Order was cancelled';
                                            default:
                                                return 'Unknown order status';
                                        }
                                    })()}
                                    arrow
                                    placement="top"
                                >
                                    <Box
                                        sx={{
                                            display: 'inline-block',
                                            px: 1.5,
                                            py: 0.5,
                                            borderRadius: 1,
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                            textTransform: 'uppercase',
                                            backgroundColor: 
                                                order.status === 'OPEN' ? 'warning.100' :
                                                order.status === 'SENT TO ZERODHA' ? 'info.100' :
                                                order.status === 'COMPLETED' ? 'success.100' :
                                                order.status === 'CANCELLED' ? 'error.100' : 'grey.100',
                                            color: 
                                                order.status === 'OPEN' ? 'warning.700' :
                                                order.status === 'SENT TO ZERODHA' ? 'info.700' :
                                                order.status === 'COMPLETED' ? 'success.700' :
                                                order.status === 'CANCELLED' ? 'error.700' : 'grey.700',
                                            border: '1px solid',
                                            borderColor: 
                                                order.status === 'OPEN' ? 'warning.300' :
                                                order.status === 'SENT TO ZERODHA' ? 'info.300' :
                                                order.status === 'COMPLETED' ? 'success.300' :
                                                order.status === 'CANCELLED' ? 'error.300' : 'grey.300'
                                        }}
                                    >
                                        {order.status}
                                    </Box>
                                </Tooltip>
                            </TableCell>
                            <TableCell sx={{ p: 1, fontSize: 14, textAlign: 'center', color: 'text.secondary' }}>
                                {order.zerodha_orderid || '-'}
                            </TableCell>
                            <TableCell sx={{ p: 1, textAlign: 'center' }}>
                                <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                                    <Tooltip 
                                        title={order.status === 'OPEN' ? 'Edit order type and price' : 'Cannot edit order after execution'}
                                        arrow
                                        placement="top"
                                    >
                                        <span>
                                            <IconButton 
                                                size="small" 
                                                onClick={() => handleEdit(order)}
                                                disabled={order.status !== 'OPEN'}
                                                sx={{ 
                                                    color: 'primary.main',
                                                    '&:hover': { backgroundColor: 'primary.50' },
                                                    '&:disabled': { color: 'grey.400' }
                                                }}
                                            >
                                    <EditIcon fontSize="small" />
                                </IconButton>
                                        </span>
                                    </Tooltip>
                                    <Tooltip 
                                        title={(() => {
                                            switch(order.status) {
                                                case 'OPEN':
                                                    return 'Send order to Zerodha for execution';
                                                case 'SENT TO ZERODHA':
                                                    return 'Order already sent to Zerodha';
                                                case 'COMPLETED':
                                                    return 'Order already completed';
                                                case 'CANCELLED':
                                                    return 'Order was cancelled';
                                                default:
                                                    return 'Order cannot be executed';
                                            }
                                        })()}
                                        arrow
                                        placement="top"
                                    >
                                        <span>
                                            <IconButton 
                                                size="small" 
                                                onClick={() => handleExecute(order)} 
                                                disabled={loading || order.status !== 'OPEN'}
                                                sx={{ 
                                                    color: 'success.main',
                                                    '&:hover': { backgroundColor: 'success.50' },
                                                    '&:disabled': { color: 'grey.400' }
                                                }}
                                            >
                                    <PlayArrowIcon fontSize="small" />
                                </IconButton>
                                        </span>
                                    </Tooltip>
                                    <Tooltip 
                                        title={(() => {
                                            switch(order.status) {
                                                case 'OPEN':
                                                    return 'Delete this automated order';
                                                case 'SENT TO ZERODHA':
                                                    return 'Cannot delete order sent to Zerodha';
                                                case 'COMPLETED':
                                                    return 'Cannot delete completed order';
                                                case 'CANCELLED':
                                                    return 'Cannot delete cancelled order';
                                                default:
                                                    return 'Cannot delete this order';
                                            }
                                        })()}
                                        arrow
                                        placement="top"
                                    >
                                        <span>
                                            <IconButton 
                                                size="small" 
                                                onClick={() => handleDelete(order)} 
                                                disabled={loading || order.status !== 'OPEN'}
                                                sx={{ 
                                                    color: 'error.main',
                                                    '&:hover': { backgroundColor: 'error.50' },
                                                    '&:disabled': { color: 'grey.400' }
                                                }}
                                            >
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                                        </span>
                                    </Tooltip>
                                </Box>
                            </TableCell>
                        </TableRow>
                    ))}
                    
                    {/* Summary Row */}
                    <TableRow sx={{ backgroundColor: 'grey.100', borderTop: '2px solid', borderTopColor: 'primary.main' }}>
                        <TableCell colSpan={3} sx={{ p: 1, fontWeight: 700, textAlign: 'left', fontSize: '0.875rem' }}>
                            Total Orders: {orders.length}
                        </TableCell>
                        <TableCell sx={{ p: 1, fontWeight: 700, textAlign: 'center', fontSize: '0.875rem' }}>
                            {orders.filter(o => o.status === 'OPEN').length} Open
                        </TableCell>
                        <TableCell sx={{ p: 1, fontWeight: 700, textAlign: 'center', fontSize: '0.875rem' }}>
                            {orders.filter(o => o.status === 'SENT TO ZERODHA').length} Sent
                        </TableCell>
                        <TableCell sx={{ p: 1, fontWeight: 700, textAlign: 'center', fontSize: '0.875rem' }}>
                            {orders.filter(o => o.status === 'COMPLETED').length} Completed
                        </TableCell>
                        <TableCell></TableCell>
                    </TableRow>
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
            <Dialog 
                open={!!editOrder} 
                onClose={handleCloseEdit} 
                maxWidth="sm" 
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
                    }
                }}
            >
                <DialogTitle sx={{ 
                    pb: 1, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    borderBottom: '1px solid #e0e0e0'
                }}>
                    <Typography variant="h6" fontWeight={600}>
                        Edit Automated Order
                    </Typography>
                </DialogTitle>
                <DialogContent sx={{ p: 3 }}>
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Order Details
                        </Typography>
                        <Box sx={{ 
                            p: 2, 
                            bgcolor: 'grey.50', 
                            borderRadius: 2,
                            display: 'flex',
                            gap: 3,
                            alignItems: 'center'
                        }}>
                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    Trading Symbol:
                                </Typography>
                                <Typography variant="body2" fontWeight={500}>
                                    {editOrder?.trading_symbol}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    Quantity:
                                </Typography>
                                <Typography variant="body2" fontWeight={500}>
                                    {editOrder?.quantity}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    Transaction Type:
                                </Typography>
                                <Box sx={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    px: 1.5,
                                    py: 0.5,
                                    borderRadius: 1,
                                    backgroundColor: editOrder?.transaction_type?.toUpperCase() === 'BUY' ? 'success.light' : 'error.light',
                                    color: editOrder?.transaction_type?.toUpperCase() === 'BUY' ? 'success.dark' : 'error.dark',
                                    fontWeight: 600,
                                    fontSize: '0.75rem',
                                    textTransform: 'uppercase'
                                }}>
                                    {editOrder?.transaction_type}
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                    
                    <TextField
                        select
                        label="Order Type"
                        value={editState.order_type}
                        onChange={e => handleEditChange('order_type', e.target.value)}
                        size="small"
                        fullWidth
                        sx={{ mb: 3 }}
                    >
                        {ORDER_TYPES.map(opt => (
                            <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                        ))}
                    </TextField>
                    
                    <TextField
                        label="Limit Price (optional)"
                        value={editState.price}
                        onChange={e => handleEditChange('price', e.target.value)}
                        size="small"
                        fullWidth
                        disabled={editState.order_type !== 'LIMIT'}
                        placeholder={editState.order_type === 'LIMIT' ? 'Enter limit price' : 'Not required for market orders'}
                        helperText={editState.order_type === 'LIMIT' ? 'Set a specific price for limit orders' : 'Market orders will execute at current market price'}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 0 }}>
                    <Button 
                        onClick={handleCloseEdit} 
                        disabled={loading}
                        variant="outlined"
                        sx={{ minWidth: 100 }}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleEditSubmit} 
                        variant="contained" 
                        disabled={loading}
                        sx={{ minWidth: 100 }}
                    >
                        {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default AutomatedOrdersTable; 