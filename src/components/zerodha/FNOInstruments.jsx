import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    CircularProgress,
    Alert,
    TextField,
    InputAdornment,
    Chip,
    Stack,
    Grid
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { getInstruments } from '../../services/zerodha/api';

const FNOInstruments = () => {
    const [instruments, setInstruments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('all'); // 'all', 'futures', 'options'

    useEffect(() => {
        const fetchInstruments = async () => {
            setLoading(true);
            try {
                console.log('Fetching instruments...');
                const response = await getInstruments();
                console.log('Instruments response:', response);

                if (!response.data) {
                    throw new Error('No data received from the server');
                }

                // No need to filter here as backend already filters F&O instruments
                setInstruments(response.data);
                console.log('F&O instruments loaded:', response.data.length);
            } catch (err) {
                console.error('Error fetching instruments:', err);
                setError(err.message || 'Failed to fetch instruments');
            } finally {
                setLoading(false);
            }
        };

        fetchInstruments();
    }, []);

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatStrike = (strike) => {
        if (!strike || strike === 0) return '-';
        return strike.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    const filteredInstruments = instruments.filter(instrument => {
        const matchesSearch = instrument.tradingsymbol?.toLowerCase().includes(searchTerm.toLowerCase());

        if (filter === 'futures') {
            return matchesSearch && instrument.instrument_type === 'FUT';
        } else if (filter === 'options') {
            return matchesSearch && (instrument.instrument_type === 'CE' || instrument.instrument_type === 'PE');
        }
        return matchesSearch;
    });

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ mb: 2 }}>
                {error}
            </Alert>
        );
    }

    return (
        <Box>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h5" component="h2" gutterBottom>
                    F&O Instruments
                </Typography>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            variant="outlined"
                            placeholder="Search by symbol..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Stack direction="row" spacing={1}>
                            <Chip
                                label={`All (${instruments.length})`}
                                onClick={() => setFilter('all')}
                                color={filter === 'all' ? 'primary' : 'default'}
                            />
                            <Chip
                                label={`Futures (${instruments.filter(i => i.instrument_type === 'FUT').length})`}
                                onClick={() => setFilter('futures')}
                                color={filter === 'futures' ? 'primary' : 'default'}
                            />
                            <Chip
                                label={`Options (${instruments.filter(i => i.instrument_type === 'CE' || i.instrument_type === 'PE').length})`}
                                onClick={() => setFilter('options')}
                                color={filter === 'options' ? 'primary' : 'default'}
                            />
                        </Stack>
                    </Grid>
                </Grid>
            </Box>

            {filteredInstruments.length === 0 ? (
                <Typography variant="body1" color="textSecondary" align="center">
                    No instruments found
                </Typography>
            ) : (
                <TableContainer component={Paper} elevation={0}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold' }}>Symbol</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Expiry</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Strike</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Lot Size</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredInstruments.map((instrument) => (
                                <TableRow key={instrument.instrument_token}>
                                    <TableCell>{instrument.tradingsymbol}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={instrument.instrument_type}
                                            size="small"
                                            color={
                                                instrument.instrument_type === 'FUT' ? 'primary' :
                                                    instrument.instrument_type === 'CE' ? 'success' :
                                                        instrument.instrument_type === 'PE' ? 'error' : 'default'
                                            }
                                        />
                                    </TableCell>
                                    <TableCell>{formatDate(instrument.expiry)}</TableCell>
                                    <TableCell>{formatStrike(instrument.strike)}</TableCell>
                                    <TableCell>{instrument.lot_size}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Box>
    );
};

export default FNOInstruments; 