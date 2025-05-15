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
    Button,
    Card,
    CardContent,
    Divider
} from '@mui/material';
import { Search as SearchIcon, FilterList as FilterIcon, Clear as ClearIcon, Info as InfoIcon } from '@mui/icons-material';
import { getInstruments, refreshInstruments, getInstrumentLTP } from '../../services/zerodha/api';
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
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(100);
    const [totalPages, setTotalPages] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    const [refreshMsg, setRefreshMsg] = useState('');
    const [ltpMap, setLtpMap] = useState({});

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
                page,
                pageSize,
                ...(instrumentType && { type: instrumentType }),
                ...(strikePrice && { strike: strikePrice }),
                ...(expiryDate && {
                    expiry: `${expiryDate.getFullYear()}-${String(expiryDate.getMonth() + 1).padStart(2, '0')}-${String(expiryDate.getDate()).padStart(2, '0')}`
                })
            };

            const response = await getInstruments(params);
            if (response.success) {
                setInstruments(response.data);
                setTotalPages(response.totalPages);
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
        setPage(1);
    };

    const handlePageChange = (newPage) => {
        setPage(newPage);
        handleSearch();
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

    const handleRefreshInstruments = async () => {
        setRefreshing(true);
        setRefreshMsg('');
        try {
            const refreshResp = await refreshInstruments();
            if (refreshResp.success) {
                setRefreshMsg('Instrument list refreshed!');
            } else {
                setRefreshMsg('Failed to refresh: ' + (refreshResp.error || 'Unknown error'));
            }
        } catch (err) {
            setRefreshMsg('Failed to refresh: ' + (err.message || 'Unknown error'));
        } finally {
            setRefreshing(false);
        }
    };

    useEffect(() => {
        const fetchLTPs = async () => {
            const newLtpMap = {};
            for (const instrument of instruments) {
                if (instrument.exchange && instrument.tradingsymbol) {
                    try {
                        const ltp = await getInstrumentLTP(instrument.exchange, instrument.tradingsymbol);
                        newLtpMap[instrument.tradingsymbol] = ltp[`${instrument.exchange}:${instrument.tradingsymbol}`].last_price;
                    } catch {
                        newLtpMap[instrument.tradingsymbol] = '-';
                    }
                }
            }
            setLtpMap(newLtpMap);
        };
        if (instruments.length > 0) fetchLTPs();
    }, [instruments]);

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
                <Button
                    variant="contained"
                    color="secondary"
                    onClick={handleRefreshInstruments}
                    disabled={refreshing}
                    sx={{ mb: 2 }}
                >
                    {refreshing ? 'Refreshing...' : 'Refresh Instruments'}
                </Button>
                {refreshMsg && (
                    <Alert severity={refreshMsg.startsWith('Failed') ? 'error' : 'success'} sx={{ mt: 2 }}>
                        {refreshMsg}
                    </Alert>
                )}
                <Card sx={{ mb: 2 }}>
                    <CardContent>
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
                            <Grid item xs={12} md={2}>
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    onClick={handleClearFilters}
                                    startIcon={<ClearIcon />}
                                >
                                    Clear Filters
                                </Button>
                            </Grid>
                        </Grid>
                        {error && (
                            <Alert severity="error" sx={{ mt: 2 }}>
                                {error}
                            </Alert>
                        )}
                    </CardContent>
                </Card>

                {hasSearched && instruments.length > 0 && (
                    <TableContainer component={Paper} elevation={0}>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ bgcolor: 'grey.50' }}>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Symbol</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Expiry</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Strike</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Lot Size</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Last Price</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Days to Expiry</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {instruments.map((instrument) => (
                                    <TableRow
                                        key={instrument.tradingsymbol}
                                        sx={{
                                            '&:hover': {
                                                bgcolor: 'grey.50'
                                            }
                                        }}
                                    >
                                        <TableCell sx={{ fontFamily: 'monospace' }}>
                                            {instrument.display_name}
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={instrument.display_type}
                                                size="small"
                                                color={
                                                    instrument.is_future ? 'primary' :
                                                        instrument.instrument_type === 'CE' ? 'success' :
                                                            instrument.instrument_type === 'PE' ? 'error' : 'default'
                                                }
                                            />
                                        </TableCell>
                                        <TableCell>{instrument.display_expiry}</TableCell>
                                        <TableCell align="right">{instrument.display_strike}</TableCell>
                                        <TableCell align="right">{instrument.lot_size}</TableCell>
                                        <TableCell align="right">
                                            {ltpMap[instrument.tradingsymbol] !== undefined
                                                ? ltpMap[instrument.tradingsymbol]
                                                : instrument.display_last_price || '-'}
                                        </TableCell>
                                        <TableCell align="right">
                                            <Chip
                                                label={`${instrument.days_to_expiry} days`}
                                                size="small"
                                                color={
                                                    instrument.days_to_expiry <= 7 ? 'error' :
                                                        instrument.days_to_expiry <= 14 ? 'warning' : 'default'
                                                }
                                            />
                                        </TableCell>
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

                {totalPages > 1 && (
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 1 }}>
                        <Button
                            variant="outlined"
                            onClick={() => handlePageChange(page - 1)}
                            disabled={page === 1}
                        >
                            Previous
                        </Button>
                        <Typography variant="body2" sx={{ alignSelf: 'center' }}>
                            Page {page} of {totalPages}
                        </Typography>
                        <Button
                            variant="outlined"
                            onClick={() => handlePageChange(page + 1)}
                            disabled={page === totalPages}
                        >
                            Next
                        </Button>
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default TradingInstruments; 