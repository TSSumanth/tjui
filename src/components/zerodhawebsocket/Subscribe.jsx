import React, { useState } from 'react';
import {
    Box,
    Typography,
    Button,
    TextField,
    Paper,
    Stack,
    Autocomplete,
    Alert,
    Snackbar
} from '@mui/material';
import { getInstruments } from '../../services/zerodha/api';
import { subscribeToTokens } from '../../services/zerodha/webhook';

const Subscribe = ({ onSubscribeSuccess }) => {
    const [selectedInstrument, setSelectedInstrument] = useState(null);
    const [options, setOptions] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [openSuccess, setOpenSuccess] = useState(false);
    const [openError, setOpenError] = useState(false);

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
            if (onSubscribeSuccess) {
                onSubscribeSuccess();
            }
        } catch (err) {
            setError('Failed to subscribe');
            setOpenError(true);
        } finally {
            setLoading(false);
        }
    };

    // Snackbar close handlers
    const handleCloseSuccess = () => { setOpenSuccess(false); setSuccess(''); };
    const handleCloseError = () => { setOpenError(false); setError(''); };

    return (
        <Box sx={{ flex: 1, minWidth: 320, maxWidth: '45%' }}>
            <Paper elevation={1} sx={{ p: 2, border: '1px solid black' }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2, color: '#1a237e', letterSpacing: 1, fontSize: 20 }}>
                    Subscribe Here
                </Typography>
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
            <Snackbar open={openSuccess} autoHideDuration={3000} onClose={handleCloseSuccess} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                <Alert onClose={handleCloseSuccess} severity="success" sx={{ fontSize: 13 }}>{success}</Alert>
            </Snackbar>
            <Snackbar open={openError} autoHideDuration={3000} onClose={handleCloseError} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                <Alert onClose={handleCloseError} severity="error" sx={{ fontSize: 13 }}>{error}</Alert>
            </Snackbar>
        </Box>
    );
};

export default Subscribe; 