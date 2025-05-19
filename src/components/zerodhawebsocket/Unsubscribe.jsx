import React, { useState } from 'react';
import {
    Box,
    Typography,
    Button,
    Paper,
    Stack,
    FormControl,
    Select,
    MenuItem,
    Alert,
    Snackbar
} from '@mui/material';
import { unsubscribeFromTokens } from '../../services/zerodha/webhook';

const Unsubscribe = ({ subscribed, onUnsubscribeSuccess }) => {
    const [unsubscribeToken, setUnsubscribeToken] = useState('');
    const [unsubLoading, setUnsubLoading] = useState(false);
    const [unsubError, setUnsubError] = useState('');
    const [unsubSuccess, setUnsubSuccess] = useState('');
    const [openUnsubSuccess, setOpenUnsubSuccess] = useState(false);
    const [openUnsubError, setOpenUnsubError] = useState(false);

    const handleUnsubscribe = async () => {
        setUnsubError('');
        setUnsubSuccess('');
        if (!unsubscribeToken) {
            setUnsubError('Please select a token to unsubscribe');
            setOpenUnsubError(true);
            return;
        }
        setUnsubLoading(true);
        try {
            await unsubscribeFromTokens([unsubscribeToken]);
            setUnsubSuccess('Unsubscribed successfully!');
            setOpenUnsubSuccess(true);
            setUnsubscribeToken('');
            if (onUnsubscribeSuccess) {
                onUnsubscribeSuccess();
            }
        } catch (err) {
            setUnsubError('Failed to unsubscribe');
            setOpenUnsubError(true);
        } finally {
            setUnsubLoading(false);
        }
    };

    // Snackbar close handlers
    const handleCloseUnsubSuccess = () => { setOpenUnsubSuccess(false); setUnsubSuccess(''); };
    const handleCloseUnsubError = () => { setOpenUnsubError(false); setUnsubError(''); };

    return (
        <Box sx={{ flex: 1, minWidth: 320, maxWidth: '45%' }}>
            <Paper elevation={1} sx={{ p: 2, border: '1px solid black' }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2, color: '#1a237e', letterSpacing: 1, fontSize: 20 }}>
                    Unsubscribe Here
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" width="100%">
                    <FormControl size="small" sx={{ width: '100%' }}>
                        <Select
                            value={unsubscribeToken}
                            onChange={e => setUnsubscribeToken(e.target.value)}
                            displayEmpty
                            size="small"
                            disabled={unsubLoading || subscribed.length === 0}
                        >
                            <MenuItem value="" disabled>Select Token</MenuItem>
                            {subscribed.map(row => (
                                <MenuItem key={row.instrument_token} value={row.instrument_token}>
                                    {row.tradingsymbol ? `${row.tradingsymbol} (${row.instrument_token})` : row.instrument_token}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Button
                        variant="contained"
                        color="error"
                        size="small"
                        onClick={handleUnsubscribe}
                        disabled={unsubLoading || !unsubscribeToken}
                        sx={{ minWidth: 130, fontWeight: 600, fontSize: 15, boxShadow: 1, '&:hover': { backgroundColor: '#b71c1c' } }}
                    >
                        {unsubLoading ? 'Unsubscribing...' : 'Unsubscribe'}
                    </Button>
                </Stack>
            </Paper>
            <Snackbar open={openUnsubSuccess} autoHideDuration={3000} onClose={handleCloseUnsubSuccess} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                <Alert onClose={handleCloseUnsubSuccess} severity="success" sx={{ fontSize: 13 }}>{unsubSuccess}</Alert>
            </Snackbar>
            <Snackbar open={openUnsubError} autoHideDuration={3000} onClose={handleCloseUnsubError} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                <Alert onClose={handleCloseUnsubError} severity="error" sx={{ fontSize: 13 }}>{unsubError}</Alert>
            </Snackbar>
        </Box>
    );
};

export default Unsubscribe; 