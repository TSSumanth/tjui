import React from 'react';
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
    Alert
} from '@mui/material';
import { useZerodha } from '../../context/ZerodhaContext';

function Orders() {
    const { orders, loading, error } = useZerodha();

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box p={2}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    return (
        <Box p={4}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
                Orders
            </Typography>
            {orders.length > 0 ? (
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
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {orders.map((order) => (
                                <TableRow key={order.order_id}>
                                    <TableCell>{order.order_id}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={order.status}
                                            color={order.status === 'COMPLETE' ? 'success' : 'warning'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>{order.order_type}</TableCell>
                                    <TableCell>{order.tradingsymbol}</TableCell>
                                    <TableCell>{order.quantity}</TableCell>
                                    <TableCell>{order.price}</TableCell>
                                    <TableCell>{order.order_timestamp}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            ) : (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                    <Typography variant="body1" color="textSecondary" align="center">
                        No data available. Click &quot;Get Orders&quot; to load data.
                    </Typography>
                </Box>
            )}
        </Box>
    );
}

export default Orders; 