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
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    IconButton,
    Tooltip,
    Button
} from '@mui/material';
import { Search as SearchIcon, FilterList as FilterIcon, Clear as ClearIcon } from '@mui/icons-material';
import { getInstruments } from '../../services/zerodha/api';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const TradingInstruments = () => {
    const [instruments, setInstruments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [instrumentType, setInstrumentType] = useState('');
    const [strikePrice, setStrikePrice] = useState('');
    const [expiryDate, setExpiryDate] = useState(null);
    const [hasSearched, setHasSearched] = useState(false);

    const handleSearch = async () => {
        if (!searchTerm.trim()) {
            setError('Please enter an instrument symbol');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const params = {
                search: searchTerm,
                ...(instrumentType && { type: instrumentType }),
                ...(strikePrice && { strike: strikePrice }),
                ...(expiryDate && {
                    expiry: `${expiryDate.getFullYear()}-${String(expiryDate.getMonth() + 1).padStart(2, '0')}-${String(expiryDate.getDate()).padStart(2, '0')}`
                })
            };

            const response = await getInstruments(params);
            if (response.data) {
                setInstruments(response.data);
                setHasSearched(true);
            }
        } catch (err) {
            console.error('Error searching instruments:', err);
            setError(err.message || 'Failed to search instruments');
        } finally {
            setLoading(false);
        }
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setInstrumentType('');
        setStrikePrice('');
        setExpiryDate(null);
        setInstruments([]);
        setHasSearched(false);
        setError(null);
    };

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

    const getUnderlyingSymbol = (tradingsymbol) => {
        if (!tradingsymbol) return '';
        const symbol = tradingsymbol.toUpperCase();
        const match = symbol.match(/([A-Z]+)/);
        return match ? match[1] : symbol;
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h5" component="h2" gutterBottom>
                    Trading Instruments
                </Typography>
                <Paper sx={{ p: 3, mb: 2 }}>
                    <Typography variant="body1" color="textSecondary" gutterBottom>
                        Search for trading instruments
                    </Typography>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={2}>
                            <TextField
                                fullWidth
                                variant="outlined"
                                label="Instrument"
                                placeholder="e.g., INFY"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        handleSearch();
                                    }
                                }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <FormControl fullWidth>
                                <InputLabel>Type</InputLabel>
                                <Select
                                    value={instrumentType}
                                    label="Type"
                                    onChange={(e) => setInstrumentType(e.target.value)}
                                >
                                    <MenuItem value="">All</MenuItem>
                                    <MenuItem value="CE">Call Option</MenuItem>
                                    <MenuItem value="PE">Put Option</MenuItem>
                                    <MenuItem value="FUT">Future</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <TextField
                                fullWidth
                                variant="outlined"
                                label="Strike Price"
                                type="number"
                                value={strikePrice}
                                onChange={(e) => setStrikePrice(e.target.value)}
                                placeholder="e.g., 2500"
                            />
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <DatePicker
                                    label="Expiry Date"
                                    value={expiryDate}
                                    onChange={setExpiryDate}
                                    slotProps={{
                                        textField: {
                                            fullWidth: true
                                        }
                                    }}
                                />
                            </LocalizationProvider>
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <Button
                                fullWidth
                                variant="contained"
                                onClick={handleSearch}
                                disabled={loading}
                                startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
                            >
                                Search
                            </Button>
                        </Grid>
                    </Grid>
                    {error && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                            {error}
                        </Alert>
                    )}
                </Paper>

                {hasSearched && instruments.length > 0 && (
                    <TableContainer component={Paper} elevation={0}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Symbol</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Underlying</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Expiry</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Strike</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Lot Size</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Exchange</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Segment</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Last Price</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {instruments.map((instrument) => (
                                    <TableRow key={instrument.tradingsymbol}>
                                        <TableCell>{instrument.tradingsymbol}</TableCell>
                                        <TableCell>{getUnderlyingSymbol(instrument.tradingsymbol)}</TableCell>
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
                                        <TableCell>{instrument.exchange}</TableCell>
                                        <TableCell>{instrument.segment}</TableCell>
                                        <TableCell>{formatStrike(instrument.last_price)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                {hasSearched && instruments.length === 0 && (
                    <Typography variant="body1" color="textSecondary" align="center">
                        No instruments found matching your criteria
                    </Typography>
                )}
            </Box>
        </Box>
    );
};

export default TradingInstruments; 