import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Chip, Typography } from '@mui/material';
import { getOrderPairs, deleteOrderPair } from '../../services/zerodha/oco';
import { getOrders } from '../../services/zerodha/api';

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleString(); // You can use toISOString() or a library for more control
}

export default function OcoPairsTable({ onChange }) {
    const [pairs, setPairs] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchPairs = async () => {
        setLoading(true);
        setPairs(await getOrderPairs());
        const ordersResult = await getOrders();
        setOrders(Array.isArray(ordersResult) ? ordersResult : []);
        setLoading(false);
    };

    useEffect(() => {
        fetchPairs();
        const interval = setInterval(fetchPairs, 10000);
        return () => clearInterval(interval);
    }, []);

    const handleCancel = async (id) => {
        await deleteOrderPair(id);
        fetchPairs();
        if (onChange) onChange();
    };

    if (!pairs.length) return null;

    const getOrder = (id) => Array.isArray(orders) ? orders.find(o => o.order_id === id) || {} : {};
    const getStatusColor = (status) => {
        switch (status) {
            case 'COMPLETE': return 'success';
            case 'CANCELLED': return 'default';
            case 'TRIGGER PENDING': return 'info';
            default: return 'warning';
        }
    };

    return (
        <Paper sx={{ mb: 3, p: 2 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                OCO Pairs
            </Typography>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Order 1</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Order 2</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Last Updated</TableCell>
                            <TableCell>Action</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {pairs.map((pair) => {
                            const o1 = getOrder(pair.order1_id);
                            const o2 = getOrder(pair.order2_id);
                            return (
                                <TableRow key={pair.id}>
                                    <TableCell>{pair.order1_symbol || o1.tradingsymbol || ''} <br /> <small>{pair.order1_id}</small></TableCell>
                                    <TableCell>{pair.order1_type || o1.ordertype || ''}</TableCell>
                                    <TableCell><Chip label={o1.status} color={getStatusColor(o1.status)} size="small" /></TableCell>
                                    <TableCell>{pair.order2_symbol || o2.tradingsymbol || ''} <br /> <small>{pair.order2_id}</small></TableCell>
                                    <TableCell>{pair.order2_type || o2.ordertype || ''}</TableCell>
                                    <TableCell><Chip label={o2.status} color={getStatusColor(o2.status)} size="small" /></TableCell>
                                    <TableCell>{formatDate(pair.updated_at)}</TableCell>
                                    <TableCell>
                                        <Button variant="outlined" color="error" size="small" onClick={() => handleCancel(pair.id)}>
                                            Cancel OCO
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
    );
} 