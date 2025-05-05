import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Chip, Typography, Divider } from '@mui/material';
import { getOrderPairs, deleteOrderPair, updateOrderPairStatus } from '../../services/zerodha/oco';
import { getOrderById, cancelZerodhaOrder } from '../../services/zerodha/api';

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleString(); // You can use toISOString() or a library for more control
}

function isToday(dateStr) {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

export default function OcoPairsTable({ onChange }) {
    const [pairs, setPairs] = useState([]);
    const [orderStatusMap, setOrderStatusMap] = useState({});
    const [loading, setLoading] = useState(false);

    // Poll OCO pairs and their order statuses
    const fetchPairsAndStatuses = async () => {
        setLoading(true);
        try {
            const pairsData = await getOrderPairs();
            setPairs(pairsData);

            // Fetch status for each order in OCO pairs
            const statusMap = {};
            await Promise.all(pairsData.map(async (pair) => {
                if (pair.order1_id) {
                    try {
                        const resp1 = await getOrderById(pair.order1_id);
                        if (resp1.success && Array.isArray(resp1.data) && resp1.data.length > 0) {
                            const status = resp1.data[resp1.data.length - 1].status;
                            statusMap[pair.order1_id] = status;
                            console.log(`Order ${pair.order1_id} status: ${status}`);
                        }
                    } catch (err) {
                        console.error(`Error fetching status for order ${pair.order1_id}:`, err);
                    }
                }
                if (pair.order2_id) {
                    try {
                        const resp2 = await getOrderById(pair.order2_id);
                        if (resp2.success && Array.isArray(resp2.data) && resp2.data.length > 0) {
                            const status = resp2.data[resp2.data.length - 1].status;
                            statusMap[pair.order2_id] = status;
                            console.log(`Order ${pair.order2_id} status: ${status}`);
                        }
                    } catch (err) {
                        console.error(`Error fetching status for order ${pair.order2_id}:`, err);
                    }
                }
            }));
            setOrderStatusMap(statusMap);

            // OCO logic: if one order is COMPLETE and the other is OPEN, cancel the open one and mark the pair as completed
            await Promise.all(pairsData.map(async (pair) => {
                if (pair.status !== 'completed') {
                    const status1 = statusMap[pair.order1_id];
                    const status2 = statusMap[pair.order2_id];

                    console.log(`Checking pair ${pair.id}: Order1(${pair.order1_id})=${status1}, Order2(${pair.order2_id})=${status2}`);

                    if (status1 === 'COMPLETE' && status2 === 'OPEN') {
                        console.log(`Cancelling order ${pair.order2_id} and marking pair ${pair.id} as completed`);
                        await cancelZerodhaOrder(pair.order2_id);
                        await updateOrderPairStatus(pair.id, 'completed');
                    } else if (status2 === 'COMPLETE' && status1 === 'OPEN') {
                        console.log(`Cancelling order ${pair.order1_id} and marking pair ${pair.id} as completed`);
                        await cancelZerodhaOrder(pair.order1_id);
                        await updateOrderPairStatus(pair.id, 'completed');
                    } else if (status1 === 'COMPLETE' && status2 === 'COMPLETE') {
                        console.log(`Both orders completed for pair ${pair.id}, marking as completed`);
                        await updateOrderPairStatus(pair.id, 'completed');
                    } else if (status1 === 'CANCELLED' && status2 === 'CANCELLED') {
                        console.log(`Both orders cancelled for pair ${pair.id}, marking as completed`);
                        await updateOrderPairStatus(pair.id, 'completed');
                    }
                }
            }));
        } catch (error) {
            console.error('Error in fetchPairsAndStatuses:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPairsAndStatuses();
        const interval = setInterval(fetchPairsAndStatuses, 15000); // Poll every 15s
        return () => clearInterval(interval);
    }, []);

    const handleCancel = async (id) => {
        await deleteOrderPair(id);
        fetchPairsAndStatuses();
        if (onChange) onChange();
    };

    if (!pairs.length) return null;

    const getStatusColor = (status) => {
        switch (status) {
            case 'COMPLETE': return 'success';
            case 'CANCELLED': return 'default';
            case 'TRIGGER PENDING': return 'info';
            default: return 'warning';
        }
    };

    // Split pairs into active and completed (today only)
    const activePairs = pairs.filter(pair => pair.status !== 'completed');
    const completedTodayPairs = pairs.filter(pair => pair.status === 'completed' && isToday(pair.created_at));

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
                        {activePairs.map((pair) => {
                            const status1 = orderStatusMap[pair.order1_id] || '';
                            const status2 = orderStatusMap[pair.order2_id] || '';
                            return (
                                <TableRow key={pair.id}>
                                    <TableCell>{pair.order1_symbol || ''} <br /> <small>{pair.order1_id}</small></TableCell>
                                    <TableCell>{pair.order1_type || ''}</TableCell>
                                    <TableCell><Chip label={status1} color={getStatusColor(status1)} size="small" /></TableCell>
                                    <TableCell>{pair.order2_symbol || ''} <br /> <small>{pair.order2_id}</small></TableCell>
                                    <TableCell>{pair.order2_type || ''}</TableCell>
                                    <TableCell><Chip label={status2} color={getStatusColor(status2)} size="small" /></TableCell>
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
            {completedTodayPairs.length > 0 && (
                <>
                    <Divider sx={{ my: 3 }} />
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                        Completed OCO Pairs (Today)
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
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {completedTodayPairs.map((pair) => {
                                    const status1 = orderStatusMap[pair.order1_id] || '';
                                    const status2 = orderStatusMap[pair.order2_id] || '';
                                    return (
                                        <TableRow key={pair.id}>
                                            <TableCell>{pair.order1_symbol || ''} <br /> <small>{pair.order1_id}</small></TableCell>
                                            <TableCell>{pair.order1_type || ''}</TableCell>
                                            <TableCell><Chip label={status1} color={getStatusColor(status1)} size="small" /></TableCell>
                                            <TableCell>{pair.order2_symbol || ''} <br /> <small>{pair.order2_id}</small></TableCell>
                                            <TableCell>{pair.order2_type || ''}</TableCell>
                                            <TableCell><Chip label={status2} color={getStatusColor(status2)} size="small" /></TableCell>
                                            <TableCell>{formatDate(pair.updated_at)}</TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </>
            )}
        </Paper>
    );
} 