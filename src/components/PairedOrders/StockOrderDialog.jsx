import React, { useState, useEffect, useRef } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Grid,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    Autocomplete,
    CircularProgress,
    Box,
    Typography
} from '@mui/material';
import { getInstruments } from '../../services/zerodha/api';

export default function StockOrderDialog({
    open,
    onClose,
    orderDetails,
    setOrderDetails,
    error,
    loading,
    onSave,
    isEditing
}) {
    const dialogRef = useRef(null);
    const [instruments, setInstruments] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [selectedInstrument, setSelectedInstrument] = useState(null);

    useEffect(() => {
        if (!open) {
            setOrderDetails({
                tradingsymbol: '',
                transaction_type: 'BUY',
                quantity: '',
                price: '',
                product: 'NRML',
                order_type: 'LIMIT',
                validity: 'IOC',
                exchange: 'NSE'
            });
            setInputValue('');
            setSelectedInstrument(null);
        } else {
            if (orderDetails.tradingsymbol) {
                setInputValue(orderDetails.tradingsymbol);
            }
            setTimeout(() => {
                if (dialogRef.current) {
                    dialogRef.current.focus();
                }
            }, 0);
        }
    }, [open, setOrderDetails, orderDetails.tradingsymbol]);

    const handleClose = () => {
        setOrderDetails({
            tradingsymbol: '',
            transaction_type: 'BUY',
            quantity: '',
            price: '',
            product: 'NRML',
            order_type: 'LIMIT',
            validity: 'IOC',
            exchange: 'NSE'
        });
        setInputValue('');
        setSelectedInstrument(null);
        onClose();
    };

    const searchInstruments = async (searchText) => {
        if (!searchText || searchText.length < 2) return;

        setSearchLoading(true);
        try {
            const response = await getInstruments({
                search: searchText,
                exchange: 'NSE',
                type: 'EQ'
            });
            if (response.success) {
                setInstruments(response.data || []);
            }
        } catch (error) {
            console.error('Error fetching instruments:', error);
        } finally {
            setSearchLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            searchInstruments(inputValue);
        }, 300);

        return () => clearTimeout(timer);
    }, [inputValue]);

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            disableEnforceFocus
            disableAutoFocus
            ref={dialogRef}
            tabIndex={-1}
            aria-labelledby="stock-order-dialog-title"
        >
            <DialogTitle id="stock-order-dialog-title">
                {isEditing ? 'Edit Stock Order' : 'Create Stock Order'}
            </DialogTitle>
            <DialogContent>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12}>
                        <Autocomplete
                            freeSolo
                            options={instruments}
                            getOptionLabel={(option) =>
                                typeof option === 'string' ? option : option.tradingsymbol
                            }
                            inputValue={inputValue}
                            onInputChange={(event, newInputValue) => {
                                setInputValue(newInputValue);
                            }}
                            onChange={(event, newValue) => {
                                if (newValue && typeof newValue === 'object') {
                                    const exchange = newValue.segment.split('-')[0];
                                    const isEquity = newValue.segment.includes('EQ');
                                    setOrderDetails(prev => ({
                                        ...prev,
                                        tradingsymbol: newValue.tradingsymbol,
                                        exchange: exchange,
                                        product: isEquity ? 'CNC' : prev.product
                                    }));
                                    setSelectedInstrument(newValue);
                                }
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Trading Symbol"
                                    fullWidth
                                    autoFocus
                                    InputProps={{
                                        ...params.InputProps,
                                        endAdornment: (
                                            <>
                                                {searchLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                                {params.InputProps.endAdornment}
                                            </>
                                        ),
                                    }}
                                />
                            )}
                            loading={searchLoading}
                            noOptionsText="No instruments found"
                            loadingText="Searching..."
                            isOptionEqualToValue={(option, value) =>
                                option.instrument_token === value.instrument_token
                            }
                            renderOption={(props, option) => (
                                <li {...props} key={option.instrument_token}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                        <Typography>{option.tradingsymbol}</Typography>
                                        <Typography color="text.secondary" sx={{ ml: 2 }}>
                                            {option.segment.split('-')[0]}
                                        </Typography>
                                    </Box>
                                </li>
                            )}
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                            <InputLabel>Transaction Type</InputLabel>
                            <Select
                                name="transaction_type"
                                value={orderDetails.transaction_type}
                                label="Transaction Type"
                                onChange={e => setOrderDetails(prev => ({ ...prev, transaction_type: e.target.value }))}
                            >
                                <MenuItem value="BUY">BUY</MenuItem>
                                <MenuItem value="SELL">SELL</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Quantity"
                            name="quantity"
                            type="number"
                            value={orderDetails.quantity}
                            onChange={e => setOrderDetails(prev => ({ ...prev, quantity: e.target.value }))}
                            InputProps={{
                                inputProps: { min: 0 }
                            }}
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                            <InputLabel>Order Type</InputLabel>
                            <Select
                                name="order_type"
                                value={orderDetails.order_type}
                                label="Order Type"
                                onChange={e => {
                                    const newOrderType = e.target.value;
                                    setOrderDetails(prev => ({
                                        ...prev,
                                        order_type: newOrderType,
                                        price: newOrderType === 'MARKET' ? '' : prev.price
                                    }));
                                }}
                            >
                                <MenuItem value="LIMIT">LIMIT</MenuItem>
                                <MenuItem value="MARKET">MARKET</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Price"
                            name="price"
                            type="number"
                            value={orderDetails.price}
                            onChange={e => setOrderDetails(prev => ({ ...prev, price: e.target.value }))}
                            disabled={orderDetails.order_type === 'MARKET'}
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                            <InputLabel>Exchange</InputLabel>
                            <Select
                                name="exchange"
                                value={orderDetails.exchange}
                                label="Exchange"
                                onChange={e => {
                                    const newExchange = e.target.value;
                                    setOrderDetails(prev => ({
                                        ...prev,
                                        exchange: newExchange,
                                        product: newExchange === 'BSE' ? 'CNC' : prev.product
                                    }));
                                }}
                                disabled={!!selectedInstrument}
                            >
                                <MenuItem value="NSE">NSE</MenuItem>
                                <MenuItem value="BSE">BSE</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                            <InputLabel>Product</InputLabel>
                            <Select
                                name="product"
                                value="CNC"
                                label="Product"
                                disabled={true}
                            >
                                <MenuItem value="CNC">CNC</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                            <InputLabel>Validity</InputLabel>
                            <Select
                                name="validity"
                                value={orderDetails.validity}
                                label="Validity"
                                onChange={e => setOrderDetails(prev => ({ ...prev, validity: e.target.value }))}
                            >
                                <MenuItem value="DAY">DAY</MenuItem>
                                <MenuItem value="IOC">IOC</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
            </DialogContent>
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            <DialogActions>
                <Button onClick={handleClose}>Cancel</Button>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={onSave}
                    disabled={loading}
                >
                    {loading ? 'Saving...' : 'Save Stock Order'}
                </Button>
            </DialogActions>
        </Dialog>
    );
} 