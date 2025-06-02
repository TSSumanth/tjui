import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Table, TableHead, TableRow, TableCell, TableBody, Divider, Grid, Snackbar, Alert, TextField, MenuItem, Button, Box } from '@mui/material';
import { getAlgoStrategies, updateAlgoStrategy } from '../../services/algoStrategies';

const STATUS_OPTIONS = ['Open', 'Closed'];

const StrategyBox = () => {
    const [strategies, setStrategies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' });
    const [editStates, setEditStates] = useState({});
    const [updating, setUpdating] = useState({});

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
                                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
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
                                </Box>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Trading Symbol</TableCell>
                                            <TableCell>Exchange</TableCell>
                                            <TableCell>Instrument Token</TableCell>
                                            <TableCell>Product</TableCell>
                                            <TableCell>Quantity</TableCell>
                                            <TableCell>Type</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {Array.isArray(strategy.instruments_details) && strategy.instruments_details.map((inst, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell>{inst.tradingsymbol}</TableCell>
                                                <TableCell>{inst.exchange}</TableCell>
                                                <TableCell>{inst.instrument_token}</TableCell>
                                                <TableCell>{inst.product}</TableCell>
                                                <TableCell>{inst.quantity}</TableCell>
                                                <TableCell>{inst.transaction_type}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                <Divider sx={{ my: 2 }} />
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                    Strategy ID: {strategy.strategyid}
                                </Typography>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={() => handleUpdate(strategy.strategyid)}
                                    disabled={updating[strategy.strategyid]}
                                >
                                    {updating[strategy.strategyid] ? 'Updating...' : 'Update'}
                                </Button>
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