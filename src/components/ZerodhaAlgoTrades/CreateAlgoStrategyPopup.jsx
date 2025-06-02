import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Typography, Box, Checkbox, List, ListItem, ListItemText } from '@mui/material';
import { getPositions } from '../../services/zerodha/api';
import { createAlgoStrategy } from '../../services/algoStrategies';

const STATUS_OPTIONS = ['Open', 'Closed'];

const CreateAlgoStrategyPopup = ({ open, onClose, onSuccess }) => {
    const [strategyType, setStrategyType] = useState('');
    const [status, setStatus] = useState('Open');
    const [positions, setPositions] = useState([]);
    const [selected, setSelected] = useState([]);
    const [loading, setLoading] = useState(false);
    const [underlyingInstrument, setUnderlyingInstrument] = useState('');

    useEffect(() => {
        if (open) {
            getPositions().then(data => {
                const openPositions = (data.data.net || []).filter(pos => pos.quantity !== 0);
                console.log('Open positions:', openPositions);
                console.log('data:', data.data);
                setPositions(openPositions);
            });
        }
    }, [open]);

    const handleSelect = (token) => {
        setSelected(prev =>
            prev.includes(token) ? prev.filter(t => t !== token) : [...prev, token]
        );
    };

    const handleSubmit = async () => {
        setLoading(true);
        const instruments_details = positions
            .filter(pos => selected.includes(pos.instrument_token))
            .map(pos => ({
                tradingsymbol: pos.tradingsymbol,
                exchange: pos.exchange,
                instrument_token: pos.instrument_token,
                product: pos.product,
                quantity: pos.quantity,
                transaction_type: pos.quantity < 0 ? 'sell' : 'buy'
            }));

        await createAlgoStrategy({
            instruments_details,
            underlying_instrument: underlyingInstrument,
            status,
            strategy_type: strategyType
        });
        setLoading(false);
        onSuccess && onSuccess();
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Create New Algo Strategy</DialogTitle>
            <DialogContent>
                <TextField
                    label="Strategy Type"
                    value={strategyType}
                    onChange={e => setStrategyType(e.target.value)}
                    fullWidth
                    margin="normal"
                />
                <TextField
                    select
                    label="Status"
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                    fullWidth
                    margin="normal"
                >
                    {STATUS_OPTIONS.map(opt => (
                        <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                    ))}
                </TextField>
                <TextField
                    label="Underlying Instrument"
                    value={underlyingInstrument}
                    onChange={e => setUnderlyingInstrument(e.target.value)}
                    fullWidth
                    margin="normal"
                />
                <Typography variant="subtitle1" sx={{ mt: 2 }}>Select Open Positions</Typography>
                <List>
                    {positions.length === 0 && (
                        <Typography color="text.secondary" sx={{ p: 2 }}>
                            No open positions found.
                        </Typography>
                    )}
                    {positions.map(pos => (
                        <ListItem key={pos.instrument_token} dense button onClick={() => handleSelect(pos.instrument_token)}>
                            <Checkbox checked={selected.includes(pos.instrument_token)} />
                            <ListItemText
                                primary={`${pos.tradingsymbol} (${pos.exchange})`}
                                secondary={
                                    <>
                                        <span>Token: {pos.instrument_token}</span> | <span>Product: {pos.product}</span> | <span>Qty: {pos.quantity}</span> | <span>Type: {pos.quantity < 0 ? 'sell' : 'buy'}</span>
                                    </>
                                }
                            />
                        </ListItem>
                    ))}
                </List>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={loading}>Cancel</Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={loading || !strategyType || selected.length === 0}
                >
                    Submit
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CreateAlgoStrategyPopup; 