import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Alert, CircularProgress, Paper, Stack, Snackbar } from '@mui/material';
import { isMarketHours } from '../../services/zerodha/utils';
import Subscribe from './Subscribe';
import Unsubscribe from './Unsubscribe';
import { useWebSocket } from './WebSocketManager';

const WebSocketDataDisplay = () => {
    const {
        webhookStatus,
        statusLoading,
        handleConnectWebhook,
        handleDisconnectWebhook,
        subscribedTokens,
        fetchSubscriptions
    } = useWebSocket();

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [unsubError, setUnsubError] = useState('');
    const [unsubSuccess, setUnsubSuccess] = useState('');
    const [openSuccess, setOpenSuccess] = useState(false);
    const [openError, setOpenError] = useState(false);
    const [openUnsubSuccess, setOpenUnsubSuccess] = useState(false);
    const [openUnsubError, setOpenUnsubError] = useState(false);
    const [disconnectSuccess, setDisconnectSuccess] = useState(false);

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

    // Snackbar close handlers
    const handleCloseSuccess = () => { setOpenSuccess(false); setSuccess(''); };
    const handleCloseError = () => { setOpenError(false); setError(''); };
    const handleCloseUnsubSuccess = () => { setOpenUnsubSuccess(false); setUnsubSuccess(''); };
    const handleCloseUnsubError = () => { setOpenUnsubError(false); setUnsubError(''); };

    const handleDisconnect = async () => {
        const success = await handleDisconnectWebhook();
        if (success) {
            setDisconnectSuccess(true);
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
                    sx={{ minWidth: 220, fontWeight: 600, fontSize: 16 }}
                >
                    {webhookStatus.tickerConnected
                        ? 'Webhook Active'
                        : webhookStatus.loading
                            ? 'Connecting...'
                            : 'Connect to Webhook for Live Data'}
                </Button>
                <Button
                    variant="outlined"
                    color="error"
                    disabled={!webhookStatus.tickerConnected || webhookStatus.loading}
                    onClick={handleDisconnect}
                    sx={{ minWidth: 180, fontWeight: 600, fontSize: 16 }}
                >
                    Disconnect Webhook
                </Button>
                {statusLoading && <CircularProgress size={22} />}
                <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                    {isMarketHours()
                        ? '🟢 Market Hours: Data refreshes every 2 seconds'
                        : '🔴 Non-Market Hours: Data refreshes on page load'}
                </Typography>
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
            <Snackbar open={disconnectSuccess} autoHideDuration={3000} onClose={() => setDisconnectSuccess(false)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                <Alert onClose={() => setDisconnectSuccess(false)} severity="info" sx={{ fontSize: 13 }}>Webhook disconnected</Alert>
            </Snackbar>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} alignItems="flex-start" justifyContent="space-between" sx={{ mt: 4, mb: 4, width: '100%' }}>
                <Subscribe onSubscribeSuccess={fetchSubscriptions} />
                <Unsubscribe subscribed={subscribedTokens} onUnsubscribeSuccess={fetchSubscriptions} />
            </Stack>
            <Box sx={{ width: '100%', px: 0, mt: 2 }}>
                <Paper elevation={1} sx={{ p: 2, width: '100%', maxWidth: '100%', border: '1px solid black', overflowX: 'auto' }}>
                    <Typography variant="h6" fontWeight={700} sx={{ color: '#1a237e', mb: 2, fontSize: 20 }}>Subscribed Tokens</Typography>
                    {subscribedTokens.length === 0 ? (
                        <Typography color="text.secondary" fontSize={15}>No tokens subscribed.</Typography>
                    ) : (
                        <Box sx={{ width: '100%', overflowX: 'auto' }}>
                            <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', mt: 1 }}>
                                <Box component="thead" sx={{ backgroundColor: '#f5f5f5' }}>
                                    <Box component="tr">
                                        <Box component="th" sx={{ textAlign: 'left', p: 1, fontSize: 15, color: '#1a237e' }}>Token</Box>
                                        <Box component="th" sx={{ textAlign: 'left', p: 1, fontSize: 15, color: '#1a237e' }}>Symbol</Box>
                                        <Box component="th" sx={{ textAlign: 'left', p: 1, fontSize: 15, color: '#1a237e' }}>Name</Box>
                                        <Box component="th" sx={{ textAlign: 'left', p: 1, fontSize: 15, color: '#1a237e' }}>Exchange</Box>
                                        <Box component="th" sx={{ textAlign: 'left', p: 1, fontSize: 15, color: '#1a237e' }}>LTP</Box>
                                        <Box component="th" sx={{ textAlign: 'left', p: 1, fontSize: 15, color: '#1a237e' }}>Tick Time</Box>
                                        <Box component="th" sx={{ textAlign: 'left', p: 1, fontSize: 15, color: '#1a237e' }}>Last Traded Qty</Box>
                                        <Box component="th" sx={{ textAlign: 'left', p: 1, fontSize: 15, color: '#1a237e' }}>Bid Price</Box>
                                        <Box component="th" sx={{ textAlign: 'left', p: 1, fontSize: 15, color: '#1a237e' }}>Ask Price</Box>
                                        <Box component="th" sx={{ textAlign: 'left', p: 1, fontSize: 15, color: '#1a237e' }}>Bid Qty</Box>
                                        <Box component="th" sx={{ textAlign: 'left', p: 1, fontSize: 15, color: '#1a237e' }}>Ask Qty</Box>
                                        <Box component="th" sx={{ textAlign: 'left', p: 1, fontSize: 15, color: '#1a237e' }}>Bid Vol</Box>
                                        <Box component="th" sx={{ textAlign: 'left', p: 1, fontSize: 15, color: '#1a237e' }}>Ask Vol</Box>
                                    </Box>
                                </Box>
                                <Box component="tbody">
                                    {subscribedTokens.map(row => (
                                        <Box component="tr" key={row.instrument_token}>
                                            <Box component="td" sx={{ p: 1, fontSize: 15 }}>{row.instrument_token}</Box>
                                            <Box component="td" sx={{ p: 1, fontSize: 15 }}>{row.tradingsymbol || '-'}</Box>
                                            <Box component="td" sx={{ p: 1, fontSize: 15 }}>{row.name || '-'}</Box>
                                            <Box component="td" sx={{ p: 1, fontSize: 15 }}>{row.exchange || '-'}</Box>
                                            <Box component="td" sx={{ p: 1, fontSize: 15 }}>{row.ltp !== null && row.ltp !== undefined ? row.ltp : '-'}</Box>
                                            <Box component="td" sx={{ p: 1, fontSize: 15 }}>{row.tick_time ? new Date(row.tick_time).toLocaleString() : '-'}</Box>
                                            <Box component="td" sx={{ p: 1, fontSize: 15 }}>{row.tick_last_traded_quantity ?? '-'}</Box>
                                            <Box component="td" sx={{ p: 1, fontSize: 15 }}>{row.tick_current_bid_price ?? '-'}</Box>
                                            <Box component="td" sx={{ p: 1, fontSize: 15 }}>{row.tick_current_ask_price ?? '-'}</Box>
                                            <Box component="td" sx={{ p: 1, fontSize: 15 }}>{row.tick_current_bid_quantity ?? '-'}</Box>
                                            <Box component="td" sx={{ p: 1, fontSize: 15 }}>{row.tick_current_ask_quantity ?? '-'}</Box>
                                            <Box component="td" sx={{ p: 1, fontSize: 15 }}>{row.tick_current_bid_volume ?? '-'}</Box>
                                            <Box component="td" sx={{ p: 1, fontSize: 15 }}>{row.tick_current_ask_volume ?? '-'}</Box>
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        </Box>
                    )}
                </Paper>
            </Box>
        </>
    );
};

export default WebSocketDataDisplay; 