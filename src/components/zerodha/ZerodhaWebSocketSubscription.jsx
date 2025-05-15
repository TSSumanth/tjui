import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Typography, Chip, Stack, Alert, CircularProgress, Card, CardContent, Grid, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import { getInstruments } from '../../services/zerodha/api';
import { getWebSocketSubscriptions, subscribeToTokens, unsubscribeFromTokens } from '../../services/zerodha/webhook';

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

    const fetchSubscriptions = async () => {
        try {
            const res = await getWebSocketSubscriptions();
            setSubscribed(res.data || []);
        } catch (err) {
            setError('Failed to fetch subscriptions');
        }
    };

    useEffect(() => {
        fetchSubscriptions();
    }, []);

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
        setLoading(true);
        if (!selectedInstrument) {
            setError('Please select an instrument');
            setLoading(false);
            return;
        }
        try {
            await subscribeToTokens([selectedInstrument.instrument_token.toString()]);
            setSuccess('Subscribed successfully!');
            setSelectedInstrument(null);
            fetchSubscriptions();
        } catch (err) {
            setError('Failed to subscribe');
        } finally {
            setLoading(false);
        }
    };

    const handleUnsubscribe = async () => {
        setUnsubError('');
        setUnsubSuccess('');
        setUnsubLoading(true);
        if (!unsubscribeToken) {
            setUnsubError('Please select a token to unsubscribe');
            setUnsubLoading(false);
            return;
        }
        try {
            await unsubscribeFromTokens([unsubscribeToken]);
            setUnsubSuccess('Unsubscribed successfully!');
            setUnsubscribeToken('');
            fetchSubscriptions();
        } catch (err) {
            setUnsubError('Failed to unsubscribe');
        } finally {
            setUnsubLoading(false);
        }
    };

    return (
        <>
            <Grid container spacing={3} justifyContent="center" sx={{ mt: 4 }}>
                <Grid item xs={12} md={6}>
                    <Card sx={{ p: 2, bgcolor: 'white', borderRadius: 2, boxShadow: 1 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Subscribe to Instrument Tokens</Typography>
                            <Autocomplete
                                options={options}
                                getOptionLabel={option => `${option.tradingsymbol} (${option.name}) [${option.instrument_token}]`}
                                filterOptions={x => x}
                                onInputChange={handleInputChange}
                                onChange={(e, value) => setSelectedInstrument(value)}
                                value={selectedInstrument}
                                loading={searchLoading}
                                renderInput={params => (
                                    <TextField
                                        {...params}
                                        label="Search Instrument"
                                        variant="outlined"
                                        fullWidth
                                        InputProps={{
                                            ...params.InputProps,
                                            endAdornment: (
                                                <>
                                                    {searchLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                                    {params.InputProps.endAdornment}
                                                </>
                                            ),
                                        }}
                                        sx={{ mb: 2 }}
                                        disabled={loading}
                                    />
                                )}
                            />
                            <Button variant="contained" onClick={handleSubscribe} disabled={loading || !selectedInstrument} fullWidth>
                                {loading ? 'Subscribing...' : 'Subscribe'}
                            </Button>
                            {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
                            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Card sx={{ p: 2, bgcolor: 'white', borderRadius: 2, boxShadow: 1 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Unsubscribe from Tokens</Typography>
                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <InputLabel id="unsubscribe-token-label">Subscribed Token</InputLabel>
                                <Select
                                    labelId="unsubscribe-token-label"
                                    value={unsubscribeToken}
                                    label="Subscribed Token"
                                    onChange={e => setUnsubscribeToken(e.target.value)}
                                    disabled={unsubLoading || subscribed.length === 0}
                                >
                                    {subscribed.map(row => (
                                        <MenuItem key={row.instrument_token} value={row.instrument_token}>
                                            {row.tradingsymbol
                                                ? `${row.tradingsymbol} (${row.instrument_token})`
                                                : row.instrument_token}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <Button variant="contained" color="error" onClick={handleUnsubscribe} disabled={unsubLoading || !unsubscribeToken} fullWidth>
                                {unsubLoading ? 'Unsubscribing...' : 'Unsubscribe'}
                            </Button>
                            {unsubSuccess && <Alert severity="success" sx={{ mt: 2 }}>{unsubSuccess}</Alert>}
                            {unsubError && <Alert severity="error" sx={{ mt: 2 }}>{unsubError}</Alert>}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
            <Box sx={{ maxWidth: 900, mx: 'auto', mt: 4 }}>
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>Subscribed Tokens</Typography>
                        {subscribed.length === 0 ? (
                            <Typography color="text.secondary">No tokens subscribed.</Typography>
                        ) : (
                            <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', mt: 2 }}>
                                <Box component="thead" sx={{ backgroundColor: '#f5f5f5' }}>
                                    <Box component="tr">
                                        <Box component="th" sx={{ textAlign: 'left', p: 1 }}>Token</Box>
                                        <Box component="th" sx={{ textAlign: 'left', p: 1 }}>Symbol</Box>
                                        <Box component="th" sx={{ textAlign: 'left', p: 1 }}>Name</Box>
                                        <Box component="th" sx={{ textAlign: 'left', p: 1 }}>Exchange</Box>
                                        <Box component="th" sx={{ textAlign: 'left', p: 1 }}>LTP</Box>
                                        <Box component="th" sx={{ textAlign: 'left', p: 1 }}>Tick Time</Box>
                                    </Box>
                                </Box>
                                <Box component="tbody">
                                    {subscribed.map(row => (
                                        <Box component="tr" key={row.instrument_token}>
                                            <Box component="td" sx={{ p: 1 }}>{row.instrument_token}</Box>
                                            <Box component="td" sx={{ p: 1 }}>{row.tradingsymbol || '-'}</Box>
                                            <Box component="td" sx={{ p: 1 }}>{row.name || '-'}</Box>
                                            <Box component="td" sx={{ p: 1 }}>{row.exchange || '-'}</Box>
                                            <Box component="td" sx={{ p: 1 }}>{row.ltp !== null && row.ltp !== undefined ? row.ltp : '-'}</Box>
                                            <Box component="td" sx={{ p: 1 }}>{row.tick_time ? new Date(row.tick_time).toLocaleString() : '-'}</Box>
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        )}
                    </CardContent>
                </Card>
            </Box>
        </>
    );
};

export default ZerodhaWebSocketSubscription; 