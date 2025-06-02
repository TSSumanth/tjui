import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Table, TableHead, TableRow, TableCell, TableBody, Divider, Grid, Snackbar, Alert, TextField, MenuItem, Button, Box } from '@mui/material';
import { getAlgoStrategies, updateAlgoStrategy } from '../../services/algoStrategies';
import { getAutomatedOrderById } from '../../services/automatedOrders';

const STATUS_OPTIONS = ['Open', 'Closed'];

const StrategyBox = () => {
    const [strategies, setStrategies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' });
    const [editStates, setEditStates] = useState({});
    const [updating, setUpdating] = useState({});
    const [ordersByStrategy, setOrdersByStrategy] = useState({});

    useEffect(() => {
        const fetchStrategies = async () => {
            setLoading(true);
            try {
                const data = await getAlgoStrategies({ status: 'Open' });
                setStrategies(data);
                // Initialize edit states
                const initialEdit = {};
                data.forEach(s => {
                    initialEdit[s.strategyid] = {
                        status: s.status,
                        underlying_instrument: s.underlying_instrument,
                        strategy_type: s.strategy_type
                    };
                });
                setEditStates(initialEdit);
                // Fetch automated orders for each strategy
                const ordersMap = {};
                for (const s of data) {
                    if (Array.isArray(s.automated_order_ids) && s.automated_order_ids.length > 0) {
                        const orders = await Promise.all(
                            s.automated_order_ids.map(async (orderId) => {
                                try {
                                    return await getAutomatedOrderById(orderId);
                                } catch {
                                    return null;
                                }
                            })
                        );
                        ordersMap[s.strategyid] = orders.filter(Boolean);
                    }
                }
                setOrdersByStrategy(ordersMap);
            } catch (err) {
                setStrategies([]);
                setSnackbar({
                    open: true,
                    message: err?.response?.data?.error || err.message || 'An error occurred',
                    severity: 'error'
                });
            }
            setLoading(false);
        };
        fetchStrategies();
    }, []);

    const handleEditChange = (id, field, value) => {
        setEditStates(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                [field]: value
            }
        }));
    };

    const handleUpdate = async (id) => {
        setUpdating(prev => ({ ...prev, [id]: true }));
        try {
            const updates = editStates[id];
            await updateAlgoStrategy(id, updates);
            setSnackbar({
                open: true,
                message: 'Strategy updated successfully!',
                severity: 'success'
            });
            // Optionally, refresh strategies
            const data = await getAlgoStrategies({ status: 'Open' });
            setStrategies(data);
            // Re-init edit states
            const initialEdit = {};
            data.forEach(s => {
                initialEdit[s.strategyid] = {
                    status: s.status,
                    underlying_instrument: s.underlying_instrument,
                    strategy_type: s.strategy_type
                };
            });
            setEditStates(initialEdit);
        } catch (err) {
            setSnackbar({
                open: true,
                message: err?.response?.data?.error || err.message || 'An error occurred',
                severity: 'error'
            });
        }
        setUpdating(prev => ({ ...prev, [id]: false }));
    };

    const handleCloseSnackbar = () => setSnackbar(prev => ({ ...prev, open: false }));

    if (loading) {
        return <Typography>Loading strategies...</Typography>;
    }

    if (!strategies.length) {
        return <Typography>No open strategies found.</Typography>;
    }

    return (
        <>
            <Grid container spacing={3}>
                {strategies.map((strategy) => (
                    <Grid item xs={12} md={6} key={strategy.strategyid}>
                        <Card sx={{ mb: 3, minWidth: 400 }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                                    <TextField
                                        label="Strategy Type"
                                        value={editStates[strategy.strategyid]?.strategy_type || ''}
                                        onChange={e => handleEditChange(strategy.strategyid, 'strategy_type', e.target.value)}
                                        size="small"
                                        fullWidth
                                    />
                                    <TextField
                                        label="Underlying Instrument"
                                        value={editStates[strategy.strategyid]?.underlying_instrument || ''}
                                        onChange={e => handleEditChange(strategy.strategyid, 'underlying_instrument', e.target.value)}
                                        size="small"
                                        fullWidth
                                    />
                                    <TextField
                                        select
                                        label="Status"
                                        value={editStates[strategy.strategyid]?.status || ''}
                                        onChange={e => handleEditChange(strategy.strategyid, 'status', e.target.value)}
                                        size="small"
                                        sx={{ minWidth: 140 }}
                                    >
                                        {STATUS_OPTIONS.map(opt => (
                                            <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                                        ))}
                                    </TextField>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        size="small"
                                        onClick={() => handleUpdate(strategy.strategyid)}
                                        disabled={updating[strategy.strategyid]}
                                        sx={{ minWidth: 80 }}
                                    >
                                        {updating[strategy.strategyid] ? '...' : 'Update'}
                                    </Button>
                                </Box>
                                <Typography sx={{ mb: 0.5, fontWeight: 1000 }}>
                                    Tracking Positions
                                </Typography>
                                <Table size="small" sx={{ mb: 1 }}>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ p: 0.5, fontWeight: 600 }}>Trading Symbol</TableCell>
                                            <TableCell sx={{ p: 0.5, fontWeight: 600 }}>Quantity</TableCell>
                                            <TableCell sx={{ p: 0.5, fontWeight: 600 }}>Type</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {Array.isArray(strategy.instruments_details) && strategy.instruments_details.map((inst, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell sx={{ p: 0.5, fontSize: 14 }}>{inst.tradingsymbol}</TableCell>
                                                <TableCell
                                                    sx={{
                                                        p: 0.5,
                                                        fontSize: 14,
                                                        color: inst.quantity < 0 ? 'error.main' : 'text.primary',
                                                        fontWeight: inst.quantity < 0 ? 700 : 500
                                                    }}
                                                >
                                                    {inst.quantity}
                                                </TableCell>
                                                <TableCell sx={{ p: 0.5, fontSize: 14, textTransform: 'capitalize' }}>
                                                    {inst.transaction_type}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                <Typography sx={{ mb: 0.5, fontWeight: 1000 }}>
                                    Automated Orders
                                </Typography>
                                {/* Automated Orders Table */}
                                {Array.isArray(strategy.automated_order_ids) && strategy.automated_order_ids.length > 0 ? (
                                    <>
                                        {(ordersByStrategy[strategy.strategyid] && ordersByStrategy[strategy.strategyid].length > 0) ? (
                                            <Table size="small" sx={{ mb: 1 }}>
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell sx={{ p: 0.5, fontWeight: 600 }}>Trading Symbol</TableCell>
                                                        <TableCell sx={{ p: 0.5, fontWeight: 600 }}>Quantity</TableCell>
                                                        <TableCell sx={{ p: 0.5, fontWeight: 600 }}>Status</TableCell>
                                                        <TableCell sx={{ p: 0.5, fontWeight: 600 }}>Order Type</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {ordersByStrategy[strategy.strategyid].map((order, idx) => (
                                                        <TableRow key={order.id || idx}>
                                                            <TableCell sx={{ p: 0.5, fontSize: 14 }}>{order.trading_symbol}</TableCell>
                                                            <TableCell sx={{ p: 0.5, fontSize: 14 }}>{order.quantity}</TableCell>
                                                            <TableCell sx={{ p: 0.5, fontSize: 14 }}>{order.status}</TableCell>
                                                            <TableCell sx={{ p: 0.5, fontSize: 14 }}>{order.order_type}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                No automated orders found for this strategy.
                                            </Typography>
                                        )}
                                    </>
                                ) : (
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                        No automated orders found for this strategy.
                                    </Typography>
                                )}
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                    Strategy ID: {strategy.strategyid}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
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
        </>
    );
};

export default StrategyBox;