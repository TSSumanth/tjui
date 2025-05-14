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
    CircularProgress
} from '@mui/material';
import { getInstruments } from '../../services/zerodha/api';

export default function FoOrderDialog({
    open,
    onClose,
    orderDetails,
    setOrderDetails,
    error,
    loading,
    onSave
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
            setTimeout(() => {
                if (dialogRef.current) {
                    dialogRef.current.focus();
                }
            }, 0);
        }
    }, [open, setOrderDetails]);

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

    const handleQuantityChange = (e) => {
        const value = e.target.value;
        setOrderDetails(prev => ({ ...prev, quantity: value }));
    };

    const handleQuantityIncrement = () => {
        if (selectedInstrument) {
            const currentQuantity = parseInt(orderDetails.quantity) || 0;
            const newQuantity = currentQuantity + selectedInstrument.lot_size;
            setOrderDetails(prev => ({ ...prev, quantity: newQuantity.toString() }));
        }
    };

    const handleQuantityDecrement = () => {
        if (selectedInstrument) {
            const currentQuantity = parseInt(orderDetails.quantity) || 0;
            const newQuantity = Math.max(0, currentQuantity - selectedInstrument.lot_size);
            setOrderDetails(prev => ({ ...prev, quantity: newQuantity.toString() }));
        }
    };

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
        >
            <DialogTitle>
                Create F&O Order
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
                                        quantity: newValue.lot_size
                                    }));
                                    setSelectedInstrument(newValue);
                                }
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Trading Symbol"
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
                                />
                            )}
                            loading={searchLoading}
                            noOptionsText="No instruments found"
                            loadingText="Searching..."
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
                            onChange={handleQuantityChange}
                            InputProps={{
                                inputProps: {
                                    min: 0,
                                    step: selectedInstrument ? selectedInstrument.lot_size : 1
                                },
                                onKeyDown: (e) => {
                                    if (e.key === 'ArrowUp') {
                                        e.preventDefault();
                                        handleQuantityIncrement();
                                    } else if (e.key === 'ArrowDown') {
                                        e.preventDefault();
                                        handleQuantityDecrement();
                                    }
                                }
                            }}
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Price"
                            name="price"
                            type="number"
                            value={orderDetails.price}
                            onChange={e => setOrderDetails(prev => ({ ...prev, price: e.target.value }))}
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                            <InputLabel>Product</InputLabel>
                            <Select
                                name="product"
                                value={orderDetails.product}
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
                                disabled={true}
                            >
                                <MenuItem value="IOC">IOC</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
            </DialogContent>
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        </Dialog>
    );
} 