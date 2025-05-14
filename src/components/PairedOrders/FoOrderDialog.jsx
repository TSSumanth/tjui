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

export default function FoOrderDialog({
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
                exchange: 'NFO'
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
            exchange: 'NFO'
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
                exchange: 'NFO'
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
            aria-labelledby="fo-order-dialog-title"
        >
            <DialogTitle id="fo-order-dialog-title">
                {isEditing ? 'Edit F&O Order' : 'Create F&O Order'}
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
                                    setOrderDetails(prev => ({
                                        ...prev,
                                        tradingsymbol: newValue.tradingsymbol,
                                        exchange: 'NFO',
                                        quantity: newValue.lot_size.toString()
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
                                            Lot: {option.lot_size}
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
                            onChange={e => {
                                const value = e.target.value;
                                if (selectedInstrument && value % selectedInstrument.lot_size !== 0) {
                                    return;
                                }
                                setOrderDetails(prev => ({ ...prev, quantity: value }));
                            }}
                            InputProps={{
                                inputProps: {
                                    min: 0,
                                    step: selectedInstrument ? selectedInstrument.lot_size : 1
                                }
                            }}
                            helperText={selectedInstrument ? `Must be in multiples of ${selectedInstrument.lot_size}` : ''}
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
                                disabled={true}
                            >
                                <MenuItem value="NFO">NFO</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                            <InputLabel>Product</InputLabel>
                            <Select
                                name="product"
                                value="NRML"
                                label="Product"
                                disabled={true}
                            >
                                <MenuItem value="NRML">NRML</MenuItem>
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
                    {loading ? 'Saving...' : 'Save F&O Order'}
                </Button>
            </DialogActions>
        </Dialog>
    );
} 