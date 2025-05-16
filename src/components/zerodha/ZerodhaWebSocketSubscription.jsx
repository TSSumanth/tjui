import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Typography, Alert, CircularProgress, Paper, Grid, MenuItem, Select, FormControl, InputLabel, Stack, Snackbar } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import { getInstruments } from '../../services/zerodha/api';
import { getWebSocketSubscriptions, subscribeToTokens, unsubscribeFromTokens, getWebSocketStatus } from '../../services/zerodha/webhook';

const ZerodhaWebSocketSubscription = () => {
    const [selectedInstrument, setSelectedInstrument] = useState(null);
    const [options, setOptions] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [subscribed, setSubscribed] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [unsubscribeToken, setUnsubscribeToken] = useState('');
    const [unsubLoading, setUnsubLoading] = useState(false);
    const [unsubError, setUnsubError] = useState('');
    const [unsubSuccess, setUnsubSuccess] = useState('');
    const [openSuccess, setOpenSuccess] = useState(false);
    const [openError, setOpenError] = useState(false);
    const [openUnsubSuccess, setOpenUnsubSuccess] = useState(false);
    const [openUnsubError, setOpenUnsubError] = useState(false);
    const [webhookStatus, setWebhookStatus] = useState({ tickerConnected: false, loading: false });
    const [statusLoading, setStatusLoading] = useState(false);

    const fetchSubscriptions = async () => {
        try {
            const res = await getWebSocketSubscriptions();
            setSubscribed(res.data || []);
        } catch (err) {
            setError('Failed to fetch subscriptions');
            setOpenError(true);
        }
    };

    useEffect(() => {
        fetchSubscriptions();
        const interval = setInterval(fetchSubscriptions, 2000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (success) setOpenSuccess(true);
    }, [success]);
    useEffect(() => {
        if (error) setOpenError(true);
    }, [error]);
    useEffect(() => {
        if (unsubSuccess) setOpenUnsubSuccess(true);
    }, [unsubSuccess]);
    useEffect(() => {
        if (unsubError) setOpenUnsubError(true);
    }, [unsubError]);

    const handleInputChange = async (event, value) => {
        if (!value || value.length < 2) {
            setOptions([]);
            return;
        }
        setSearchLoading(true);
        try {
            const resp = await getInstruments({ search: value });
            if (resp.success) setOptions(resp.data);
            else setOptions([]);
        } catch {
            setOptions([]);
        } finally {
            setSearchLoading(false);
        }
    };

    const handleSubscribe = async () => {
        setError('');
        setSuccess('');
        if (!selectedInstrument) {
            setError('Please select an instrument');
            setOpenError(true);
            return;
        }
        setLoading(true);
        try {
            await subscribeToTokens([selectedInstrument.instrument_token.toString()]);
            setSuccess('Subscribed successfully!');
            setOpenSuccess(true);
            setSelectedInstrument(null);
            fetchSubscriptions();
        } catch (err) {
            setError('Failed to subscribe');
            setOpenError(true);
        } finally {
            setLoading(false);
        }
    };

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
            fetchSubscriptions();
        } catch (err) {
            setUnsubError('Failed to unsubscribe');
            setOpenUnsubError(true);
        } finally {
            setUnsubLoading(false);
        }
    };

    // Snackbar close handlers
    const handleCloseSuccess = () => { setOpenSuccess(false); setSuccess(''); };
    const handleCloseError = () => { setOpenError(false); setError(''); };
    const handleCloseUnsubSuccess = () => { setOpenUnsubSuccess(false); setUnsubSuccess(''); };
    const handleCloseUnsubError = () => { setOpenUnsubError(false); setUnsubError(''); };

    // Poll status every 2 seconds
    const fetchStatus = async () => {
        setStatusLoading(true);
        try {
            const res = await getWebSocketStatus();
            setWebhookStatus({ tickerConnected: res.tickerConnected, loading: false });
        } catch {
            setWebhookStatus({ tickerConnected: false, loading: false });
        } finally {
            setStatusLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 2000);
        return () => clearInterval(interval);
    }, []);

    // Connect to Webhook button handler
    const handleConnectWebhook = async () => {
        setWebhookStatus(ws => ({ ...ws, loading: true }));
        try {
            // Call subscribe endpoint with empty array to trigger initTicker
            await subscribeToTokens([]);
            // Wait a moment for status to update
            setTimeout(fetchStatus, 1000);
        } catch {
            // ignore
        } finally {
            setWebhookStatus(ws => ({ ...ws, loading: false }));
        }
    };

    return (
        <>
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Button
                    variant={webhookStatus.tickerConnected ? 'contained' : 'outlined'}
                    color={webhookStatus.tickerConnected ? 'success' : 'primary'}
                    disabled={webhookStatus.tickerConnected || webhookStatus.loading}
                    onClick={handleConnectWebhook}
                    sx={{ minWidth: 220, fontWeight: 600, fontSize: 16, mt: 2 }}
                >
                    {webhookStatus.tickerConnected
                        ? 'Webhook Active'
                        : webhookStatus.loading
                            ? 'Connecting...'
                            : 'Connect to Webhook for Live Data'}
                </Button>
                {statusLoading && <CircularProgress size={22} />}
            </Box>
            <Snackbar open={openSuccess} autoHideDuration={3000} onClose={handleCloseSuccess} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                <Alert onClose={handleCloseSuccess} severity="success" sx={{ fontSize: 13 }}>{success}</Alert>
            </Snackbar>
            <Snackbar open={openError} autoHideDuration={3000} onClose={handleCloseError} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                <Alert onClose={handleCloseError} severity="error" sx={{ fontSize: 13 }}>{error}</Alert>
            </Snackbar>
            <Snackbar open={openUnsubSuccess} autoHideDuration={3000} onClose={handleCloseUnsubSuccess} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                <Alert onClose={handleCloseUnsubSuccess} severity="success" sx={{ fontSize: 13 }}>{unsubSuccess}</Alert>
            </Snackbar>
            <Snackbar open={openUnsubError} autoHideDuration={3000} onClose={handleCloseUnsubError} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                <Alert onClose={handleCloseUnsubError} severity="error" sx={{ fontSize: 13 }}>{unsubError}</Alert>
            </Snackbar>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} alignItems="flex-start" justifyContent="space-between" sx={{ mt: 4, mb: 4, width: '100%' }}>
                <Box sx={{ flex: 1, minWidth: 320, maxWidth: '45%' }}>
                    <Paper elevation={1} sx={{ p: 2, border: '1px solid black' }}>
                        <Typography variant="h6" fontWeight={700} sx={{ mb: 2, color: '#1a237e', letterSpacing: 1, fontSize: 20 }}>Subscribe Here</Typography>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" width="100%">
                            <Autocomplete
                                options={options}
                                getOptionLabel={option => `${option.tradingsymbol} (${option.name}) [${option.instrument_token}]`}
                                filterOptions={x => x}
                                onInputChange={handleInputChange}
                                onChange={(e, value) => setSelectedInstrument(value)}
                                value={selectedInstrument}
                                loading={searchLoading}
                                sx={{ width: '100%' }}
                                renderInput={params => (
                                    <TextField
                                        {...params}
                                        label="Search Instrument"
                                        size="small"
                                        variant="outlined"
                                        sx={{ width: '100%' }}
                                        disabled={loading}
                                    />
                                )}
                            />
                            <Button
                                variant="contained"
                                color="success"
                                size="small"
                                onClick={handleSubscribe}
                                disabled={loading || !selectedInstrument}
                                sx={{ minWidth: 110, fontWeight: 600, fontSize: 15, boxShadow: 1, '&:hover': { backgroundColor: '#388e3c' } }}
                            >
                                {loading ? 'Subscribing...' : 'Subscribe'}
                            </Button>
                        </Stack>
                    </Paper>
                </Box>
                <Box sx={{ flex: 1, minWidth: 320, maxWidth: '45%' }}>
                    <Paper elevation={1} sx={{ p: 2, border: '1px solid black' }}>
                        <Typography variant="h6" fontWeight={700} sx={{ mb: 2, color: '#1a237e', letterSpacing: 1, fontSize: 20 }}>Unsubscribe Here</Typography>
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
                </Box>
            </Stack>
            <Box sx={{ width: '100%', px: { xs: 1, sm: 4, md: 8 }, mt: 2 }}>
                <Paper elevation={1} sx={{ p: 2, width: '100%', border: '1px solid black' }}>
                    <Typography variant="h6" fontWeight={700} sx={{ color: '#1a237e', mb: 2, fontSize: 20 }}>Subscribed Tokens</Typography>
                    {subscribed.length === 0 ? (
                        <Typography color="text.secondary" fontSize={15}>No tokens subscribed.</Typography>
                    ) : (
                        <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', mt: 1 }}>
                            <Box component="thead" sx={{ backgroundColor: '#f5f5f5' }}>
                                <Box component="tr">
                                    <Box component="th" sx={{ textAlign: 'left', p: 1, fontSize: 15, color: '#1a237e' }}>Token</Box>
                                    <Box component="th" sx={{ textAlign: 'left', p: 1, fontSize: 15, color: '#1a237e' }}>Symbol</Box>
                                    <Box component="th" sx={{ textAlign: 'left', p: 1, fontSize: 15, color: '#1a237e' }}>Name</Box>
                                    <Box component="th" sx={{ textAlign: 'left', p: 1, fontSize: 15, color: '#1a237e' }}>Exchange</Box>
                                    <Box component="th" sx={{ textAlign: 'left', p: 1, fontSize: 15, color: '#1a237e' }}>LTP</Box>
                                    <Box component="th" sx={{ textAlign: 'left', p: 1, fontSize: 15, color: '#1a237e' }}>Tick Time</Box>
                                </Box>
                            </Box>
                            <Box component="tbody">
                                {subscribed.map(row => (
                                    <Box component="tr" key={row.instrument_token}>
                                        <Box component="td" sx={{ p: 1, fontSize: 15 }}>{row.instrument_token}</Box>
                                        <Box component="td" sx={{ p: 1, fontSize: 15 }}>{row.tradingsymbol || '-'}</Box>
                                        <Box component="td" sx={{ p: 1, fontSize: 15 }}>{row.name || '-'}</Box>
                                        <Box component="td" sx={{ p: 1, fontSize: 15 }}>{row.exchange || '-'}</Box>
                                        <Box component="td" sx={{ p: 1, fontSize: 15 }}>{row.ltp !== null && row.ltp !== undefined ? row.ltp : '-'}</Box>
                                        <Box component="td" sx={{ p: 1, fontSize: 15 }}>{row.tick_time ? new Date(row.tick_time).toLocaleString() : '-'}</Box>
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    )}
                </Paper>
            </Box>
        </>
    );
};

export default ZerodhaWebSocketSubscription; 