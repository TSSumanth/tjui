import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Table, TableHead, TableRow, TableCell, TableBody, Divider, Grid, Snackbar, Alert, TextField, MenuItem, Button, Box, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TableContainer, Paper } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { updateAlgoStrategy } from '../../services/algoStrategies';
import { getAutomatedOrderById } from '../../services/automatedOrders';
import { getPositions } from '../../services/zerodha/api';
import AutomatedOrdersTable from './AutomatedOrdersTable';
import CreateAutomatedOrderPopup from './CreateAutomatedOrderPopup';

const STATUS_OPTIONS = ['Open', 'Closed'];

const StrategyBox = ({ strategy, onStrategyUpdate, zerodhaWebSocketData }) => {
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' });
    const [editState, setEditState] = useState({
        status: strategy.status,
        underlying_instrument: strategy.underlying_instrument,
        strategy_type: strategy.strategy_type,
        expected_return: strategy.expected_return ?? ''
    });
    const [updating, setUpdating] = useState(false);
    const [orders, setOrders] = useState([]);
    const [showOrderPopup, setShowOrderPopup] = useState(false);
    const [orderPopupPositions, setOrderPopupPositions] = useState([]);
    const [orderPopupStrategyDetails, setOrderPopupStrategyDetails] = useState(null);
    const [showAddPositionPopup, setShowAddPositionPopup] = useState(false);
    const [openPositions, setOpenPositions] = useState([]);
    const [selectedPositions, setSelectedPositions] = useState([]);
    const [totalPL, setTotalPL] = useState(0);

    useEffect(() => {
        if (totalPL > strategy.expected_return) {
            setSnackbar({
                open: true,
                message: 'Total P/L is greater than expected return for id: ' + strategy.strategyid,
                severity: 'success'
            });
        }
    }, [totalPL, strategy.expected_return])

    // Calculate total P/L for the strategy
    useEffect(() => {
        const calculateTotalPL = () => {
            if (!Array.isArray(strategy.instruments_details)) return 0;

            return strategy.instruments_details.reduce((total, inst) => {
                const ltp = zerodhaWebSocketData?.[inst.instrument_token]?.ltp;
                const price = inst.price;
                if (!ltp || !price) return total;

                const pl = inst.quantity < 0
                    ? (ltp - price) * inst.quantity
                    : (price - ltp) * inst.quantity;

                return total + pl;
            }, 0);
        };

        const total = calculateTotalPL();
        setTotalPL(total);
    }, [strategy, zerodhaWebSocketData]);

    // Fetch orders for the strategy
    const fetchOrders = async () => {
        if (Array.isArray(strategy.automated_order_ids) && strategy.automated_order_ids.length > 0) {
            const orders = await Promise.all(
                strategy.automated_order_ids.map(async (orderId) => {
                    try {
                        return await getAutomatedOrderById(orderId);
                    } catch {
                        return null;
                    }
                })
            );
            setOrders(orders.filter(Boolean));
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [strategy]);

    const handleEditChange = (field, value) => {
        setEditState(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleUpdate = async () => {
        setUpdating(true);
        try {
            await updateAlgoStrategy(strategy.strategyid, editState);
            setSnackbar({
                open: true,
                message: 'Strategy updated successfully!',
                severity: 'success'
            });
            onStrategyUpdate && onStrategyUpdate();
        } catch (err) {
            setSnackbar({
                open: true,
                message: err?.response?.data?.error || err.message || 'An error occurred',
                severity: 'error'
            });
        }
        setUpdating(false);
    };

    const handleCloseSnackbar = () => setSnackbar(prev => ({ ...prev, open: false }));

    const handleOpenOrderPopup = (positions, strategyDetails) => {
        setOrderPopupPositions(positions);
        setOrderPopupStrategyDetails(strategyDetails);
        setShowOrderPopup(true);
    };

    const handleCloseOrderPopup = () => {
        setShowOrderPopup(false);
        setTimeout(() => {
            setOrderPopupPositions([]);
            setOrderPopupStrategyDetails(null);
        }, 100);
    };

    const handleOrderPopupSuccess = async () => {
        await fetchOrders();
        handleCloseOrderPopup();
    };

    const handleOpenAddPosition = async () => {
        setShowAddPositionPopup(true);
        try {
            const data = await getPositions();
            const openPositions = (data.data.net || []).filter(pos => pos.quantity !== 0);
            setOpenPositions(openPositions);
        } catch (err) {
            setSnackbar({
                open: true,
                message: err?.response?.data?.error || err.message || 'Failed to fetch positions',
                severity: 'error'
            });
        }
    };

    const handleCloseAddPosition = () => {
        setShowAddPositionPopup(false);
        setSelectedPositions([]);
    };

    const handleAddPosition = async () => {
        if (selectedPositions.length === 0) return;

        try {
            const updatedInstruments = [
                ...(strategy.instruments_details || []),
                ...selectedPositions.map(pos => ({
                    tradingsymbol: pos.tradingsymbol,
                    quantity: pos.quantity,
                    transaction_type: pos.quantity > 0 ? 'BUY' : 'SELL',
                    price: pos.average_price,
                    instrument_token: pos.instrument_token,
                    exchange: pos.exchange,
                    product: pos.product
                }))
            ];

            await updateAlgoStrategy(strategy.strategyid, {
                instruments_details: updatedInstruments
            });

            setSnackbar({
                open: true,
                message: 'Positions added successfully!',
                severity: 'success'
            });

            onStrategyUpdate && onStrategyUpdate();
            handleCloseAddPosition();
        } catch (err) {
            setSnackbar({
                open: true,
                message: err?.response?.data?.error || err.message || 'Failed to add positions',
                severity: 'error'
            });
        }
    };

    const handlePositionSelect = (position) => {
        setSelectedPositions(prev => {
            const isSelected = prev.some(p => p.tradingsymbol === position.tradingsymbol);
            if (isSelected) {
                return prev.filter(p => p.tradingsymbol !== position.tradingsymbol);
            } else {
                return [...prev, position];
            }
        });
    };

    const handleDeletePosition = async (positionIndex) => {
        try {
            const updatedInstruments = [...strategy.instruments_details];
            updatedInstruments.splice(positionIndex, 1);

            await updateAlgoStrategy(strategy.strategyid, {
                instruments_details: updatedInstruments
            });

            setSnackbar({
                open: true,
                message: 'Position removed successfully!',
                severity: 'success'
            });

            onStrategyUpdate && onStrategyUpdate();
        } catch (err) {
            setSnackbar({
                open: true,
                message: err?.response?.data?.error || err.message || 'Failed to remove position',
                severity: 'error'
            });
        }
    };

    return (
        <Card sx={{ mb: 3, minWidth: 400 }}>
            <CardContent>
                <Box sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                    <TextField
                        label="Strategy Type"
                        value={editState.strategy_type || ''}
                        onChange={e => handleEditChange('strategy_type', e.target.value)}
                        size="small"
                        fullWidth
                    />
                    <TextField
                        label="Underlying Instrument"
                        value={editState.underlying_instrument || ''}
                        onChange={e => handleEditChange('underlying_instrument', e.target.value)}
                        size="small"
                        fullWidth
                    />
                    <TextField
                        select
                        label="Status"
                        value={editState.status || ''}
                        onChange={e => handleEditChange('status', e.target.value)}
                        size="small"
                        sx={{ minWidth: 140 }}
                    >
                        {STATUS_OPTIONS.map(opt => (
                            <MenuItem key={opt} value={opt}>
                                {opt}
                            </MenuItem>
                        ))}
                    </TextField>
                    <TextField
                        label="Expected Return"
                        type="number"
                        value={editState.expected_return}
                        onChange={e => handleEditChange('expected_return', e.target.value)}
                        size="small"
                        fullWidth
                        sx={{ maxWidth: 180 }}
                        inputProps={{ min: 0, step: 0.01 }}
                    />
                    <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        onClick={handleUpdate}
                        disabled={updating}
                        sx={{ minWidth: 80 }}
                    >
                        {updating ? '...' : 'Update'}
                    </Button>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                    <Typography sx={{ fontWeight: 1000 }}>
                        Tracking Positions
                    </Typography>
                    <IconButton
                        size="small"
                        onClick={handleOpenAddPosition}
                        sx={{ color: 'primary.main' }}
                    >
                        <AddIcon />
                    </IconButton>
                    <Button
                        variant="contained"
                        color="secondary"
                        size="small"
                        onClick={() => handleOpenOrderPopup(strategy.instruments_details, strategy)}
                    >
                        Create Orders
                    </Button>
                </Box>
                <Table size="small" sx={{ mb: 1 }}>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ p: 0.5, fontWeight: 600 }}>Trading Symbol(Qnty)</TableCell>
                            <TableCell sx={{ p: 0.5, fontWeight: 600 }}>Type</TableCell>
                            <TableCell sx={{ p: 0.5, fontWeight: 600 }}>Entry Price</TableCell>
                            <TableCell sx={{ p: 0.5, fontWeight: 600 }}>LTP</TableCell>
                            <TableCell sx={{ p: 0.5, fontWeight: 600 }}>Ask Price</TableCell>
                            <TableCell sx={{ p: 0.5, fontWeight: 600 }}>Bid Price</TableCell>
                            <TableCell sx={{ p: 0.5, fontWeight: 600 }}>P/L</TableCell>
                            <TableCell sx={{ p: 0.5, fontWeight: 600 }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {Array.isArray(strategy.instruments_details) && strategy.instruments_details.map((inst, idx) => (
                            <TableRow key={idx}>
                                <TableCell sx={{
                                    p: 0.5, fontSize: 14,
                                    color: inst.quantity < 0 ? 'error.main' : 'text.primary',
                                    fontWeight: inst.quantity < 0 ? 700 : 500
                                }}>{inst.tradingsymbol} {"(" + inst.quantity + ")"}</TableCell>
                                <TableCell sx={{ p: 0.5, fontSize: 14, textTransform: 'capitalize' }}>
                                    {inst.transaction_type}
                                </TableCell>
                                <TableCell sx={{ p: 0.5, fontSize: 14 }}>
                                    {inst.price}
                                </TableCell>
                                <TableCell sx={{ p: 0.5, fontSize: 14 }}>
                                    {zerodhaWebSocketData?.[inst.instrument_token]?.ltp}
                                </TableCell>
                                <TableCell sx={{ p: 0.5, fontSize: 14 }}>
                                    {zerodhaWebSocketData?.[inst.instrument_token]?.tick_current_ask_price}
                                </TableCell>
                                <TableCell sx={{ p: 0.5, fontSize: 14 }}>
                                    {zerodhaWebSocketData?.[inst.instrument_token]?.tick_current_bid_price}
                                </TableCell>
                                <TableCell sx={{ p: 0.5, fontSize: 14 }}>
                                    {(() => {
                                        const ltp = zerodhaWebSocketData?.[inst.instrument_token]?.ltp;
                                        const price = inst.price;
                                        if (!ltp || !price) return '-';

                                        const pl = inst.quantity < 0
                                            ? (ltp - price) * inst.quantity
                                            : (price - ltp) * inst.quantity;

                                        return pl.toFixed(2);
                                    })()}
                                </TableCell>
                                <TableCell sx={{ p: 0.5 }}>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleDeletePosition(idx)}
                                        sx={{ color: 'error.main' }}
                                    >
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                        <TableRow>
                            <TableCell colSpan={6} sx={{ p: 0.5, fontWeight: 600, textAlign: 'right' }}>
                                Total P/L:
                            </TableCell>
                            <TableCell sx={{
                                p: 0.5,
                                fontWeight: 600,
                                color: totalPL < 0 ? 'error.main' : 'success.main'
                            }}>
                                {totalPL?.toFixed(2) || '-'}
                            </TableCell>
                            <TableCell></TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
                <Typography sx={{ mb: 0.5, fontWeight: 1000 }}>
                    Automated Orders
                </Typography>
                {Array.isArray(strategy.automated_order_ids) && strategy.automated_order_ids.length > 0 ? (
                    <AutomatedOrdersTable
                        orders={orders}
                        onRefresh={fetchOrders}
                        strategyId={strategy.strategyid}
                    />
                ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        No automated orders found for this strategy.
                    </Typography>
                )}
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Strategy ID: {strategy.strategyid}
                </Typography>
            </CardContent>
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
            <CreateAutomatedOrderPopup
                open={showOrderPopup}
                onClose={handleCloseOrderPopup}
                positions={orderPopupPositions}
                onSuccess={handleOrderPopupSuccess}
                strategyDetails={orderPopupStrategyDetails}
            />
            <Dialog
                open={showAddPositionPopup}
                onClose={handleCloseAddPosition}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>Add Positions to Strategy</DialogTitle>
                <DialogContent>
                    <TableContainer component={Paper} sx={{ mt: 2 }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell padding="checkbox"></TableCell>
                                    <TableCell>Trading Symbol</TableCell>
                                    <TableCell>Quantity</TableCell>
                                    <TableCell>Type</TableCell>
                                    <TableCell>Average Price</TableCell>
                                    <TableCell>LTP</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {openPositions.map((position) => {
                                    const isSelected = selectedPositions.some(p => p.tradingsymbol === position.tradingsymbol);
                                    return (
                                        <TableRow
                                            key={position.tradingsymbol}
                                            hover
                                            onClick={() => handlePositionSelect(position)}
                                            sx={{
                                                cursor: 'pointer',
                                                backgroundColor: isSelected ? 'action.selected' : 'inherit'
                                            }}
                                        >
                                            <TableCell padding="checkbox">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => handlePositionSelect(position)}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </TableCell>
                                            <TableCell>{position.tradingsymbol}</TableCell>
                                            <TableCell sx={{
                                                color: position.quantity < 0 ? 'error.main' : 'text.primary',
                                                fontWeight: position.quantity < 0 ? 700 : 500
                                            }}>
                                                {position.quantity}
                                            </TableCell>
                                            <TableCell>
                                                {position.quantity > 0 ? 'BUY' : 'SELL'}
                                            </TableCell>
                                            <TableCell>{position.average_price}</TableCell>
                                            <TableCell>
                                                {zerodhaWebSocketData?.[position.instrument_token]?.ltp}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseAddPosition}>Cancel</Button>
                    <Button
                        onClick={handleAddPosition}
                        variant="contained"
                        disabled={selectedPositions.length === 0}
                    >
                        Add Selected Positions
                    </Button>
                </DialogActions>
            </Dialog>
        </Card>
    );
};

export default StrategyBox;